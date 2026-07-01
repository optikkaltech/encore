import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InferenceClient } from '@huggingface/inference';
import { PlansService } from '../plans/plans.service';
import { SubscribersService } from '../subscribers/subscribers.service';
import { BillingService } from '../billing/billing.service';
import { BillingFrequency } from '../../shared/enums';
import { SecureLogger } from '../../common/services/secure-logger.service';

interface ParsedCommand {
  intent:
    | 'CREATE_PLAN'
    | 'CREATE_INVOICE'
    | 'SUBSCRIBE_CUSTOMER'
    | 'UNSUPPORTED';
  arguments?: Record<string, any>;
  explanation?: string;
  fallbackUsed?: boolean;
  isDraft?: boolean;
}

@Injectable()
export class AiCommandService {
  private readonly logger = new SecureLogger();

  constructor(
    private readonly config: ConfigService,
    private readonly plansService: PlansService,
    private readonly subscribersService: SubscribersService,
    private readonly billingService: BillingService,
  ) {}

  async processQuery(merchantId: string, query: string) {
    const apiKey =
      this.config.get<string>('HUGGINGFACE_API_KEY') ||
      process.env.HUGGINGFACE_API_KEY;
    const modelId =
      this.config.get<string>('HUGGINGFACE_MODEL') ||
      'meta-llama/Llama-3.1-8B-Instruct';

    let parsed: ParsedCommand;

    if (!apiKey) {
      this.logger.warn('HUGGINGFACE_API_KEY is not configured.');
      return {
        success: false,
        intent: 'ERROR',
        message:
          'AI Command Engine is unavailable. HUGGINGFACE_API_KEY is not configured.',
      };
    } else {
      try {
        parsed = await this.hfParseQuery(query, apiKey, modelId);
        parsed.fallbackUsed = false;
      } catch (err: any) {
        this.logger.error(`Hugging Face parsing failed: ${err.message}.`);
        return {
          success: false,
          intent: 'ERROR',
          message: `Hugging Face API failed: ${err.message}. Please check your network connection or API key.`,
        };
      }
    }

    return this.executeIntent(merchantId, parsed);
  }

  /**
   * Parse prompt using Hugging Face serverless Inference API
   */
  private async hfParseQuery(
    query: string,
    apiKey: string,
    modelId: string,
  ): Promise<ParsedCommand> {
    const prompt = `You are an expert NLP to Billing API command translator.
Translate the merchant's natural language command into a structured JSON action.

Available Actions and DTO Schemas:

1. Create a Plan:
   {
     "intent": "CREATE_PLAN",
     "arguments": {
       "name": "Standard Plan",
       "code": "standard-plan",
       "amount": 5000,
       "frequency": "weekly" | "monthly" | "quarterly" | "annual",
       "description": "Optional description text"
     }
   }

2. Create an Invoice:
   {
     "intent": "CREATE_INVOICE",
     "arguments": {
       "subscriberNameOrEmail": "john@example.com or John Doe",
       "lineItems": [
         {
           "description": "Item description",
           "quantity": 1,
           "unitPrice": 15000
         }
       ],
       "notes": "Optional invoice note"
     }
   }

3. Subscribe a Customer to a Plan:
   {
     "intent": "SUBSCRIBE_CUSTOMER",
     "arguments": {
       "subscriberNameOrEmail": "john@example.com or John Doe",
       "planNameOrCode": "Gold Plan or gold-plan"
     }
   }

If the request indicates a clear intention to perform one of the supported actions (e.g. creating a plan, invoice, or subscribing a customer) but lacks necessary details (such as plan name, amount, subscriber email/name, or frequency), do NOT classify it as UNSUPPORTED. Instead:
- Return the intent with the parsed arguments.
- Fill in sensible, context-aware placeholders/defaults for the missing fields (e.g., name the plan "Gym Users Plan" if the query refers to a gym; set a default amount of 5000 NGN; default frequency to "monthly" if "monthly" is mentioned or implied).
- Set the "isDraft" property to true.
- Provide a polite, clear explanation proposing the draft details in the "explanation" property.

If the user request is outrageous or unsupported (e.g. charge on weather changes, manual direct bank payout, Pigeon post, custom hourly cycles, non-billing actions), you MUST return:
{
  "intent": "UNSUPPORTED",
  "explanation": "A polite explanation of why it is unsupported and list supported features (creating plans, invoices, subscribing customers)."
}

Respond ONLY with a valid, single JSON object. Do not include markdown code block formatting (like \`\`\`json) or explanations.

Merchant Query: "${query}"

JSON:`;

    const client = new InferenceClient(apiKey);
    const response = await client.chatCompletion({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 400,
      temperature: 0.1,
    });

    const generatedText = response.choices?.[0]?.message?.content || '';

    // Sanitize response to isolate the JSON block
    const cleanedJson = generatedText.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanedJson) as ParsedCommand;
  }

  /**
   * Safe rule-based parser in case API key is missing or fails
   */
  private localParseFallback(query: string): ParsedCommand {
    const cleanQuery = query.toLowerCase();

    // 1. Plan creation fallback
    if (
      cleanQuery.includes('plan') ||
      cleanQuery.includes('tier') ||
      cleanQuery.includes('subscribe')
    ) {
      if (
        cleanQuery.includes('create') ||
        cleanQuery.includes('need') ||
        cleanQuery.includes('setup')
      ) {
        // Extract amount
        const amountMatch = cleanQuery.match(
          /(?:₦|n|amount|price)?\s*(\d+[,.\d]*)/,
        );
        const amount = amountMatch
          ? parseFloat(amountMatch[1].replace(/,/g, ''))
          : 1000;

        // Extract frequency
        let frequency = BillingFrequency.MONTHLY;
        if (cleanQuery.includes('week')) frequency = BillingFrequency.WEEKLY;
        else if (cleanQuery.includes('year') || cleanQuery.includes('annu'))
          frequency = BillingFrequency.ANNUAL;
        else if (cleanQuery.includes('quarter'))
          frequency = BillingFrequency.QUARTERLY;

        // Extract name
        let name = 'Custom AI Plan';
        const nameMatch =
          cleanQuery.match(/called\s+['"]?([^'"]+)['"]?/i) ||
          cleanQuery.match(/name\s+['"]?([^'"]+)['"]?/i);
        if (nameMatch) {
          name = nameMatch[1];
        }

        const code = name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        return {
          intent: 'CREATE_PLAN',
          arguments: {
            name,
            code,
            amount,
            frequency,
            description: `Plan created via local NLP fallback: ${query}`,
          },
        };
      }
    }

    // 2. Invoice creation fallback
    if (
      cleanQuery.includes('invoice') ||
      cleanQuery.includes('bill') ||
      cleanQuery.includes('charge')
    ) {
      const amountMatch = cleanQuery.match(
        /(?:₦|n|amount|price)?\s*(\d+[,.\d]*)/,
      );
      const amount = amountMatch
        ? parseFloat(amountMatch[1].replace(/,/g, ''))
        : 5000;

      // Extract subscriber details
      let subscriberNameOrEmail = 'dummy@example.com';
      const emailMatch = cleanQuery.match(
        /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/,
      );
      if (emailMatch) {
        subscriberNameOrEmail = emailMatch[1];
      }

      return {
        intent: 'CREATE_INVOICE',
        arguments: {
          subscriberNameOrEmail,
          lineItems: [
            {
              description: 'NLP Generated Service Charge',
              quantity: 1,
              unitPrice: amount,
            },
          ],
        },
      };
    }

    // 3. Subscription fallback
    if (
      cleanQuery.includes('subscribe') ||
      cleanQuery.includes('add customer')
    ) {
      return {
        intent: 'SUBSCRIBE_CUSTOMER',
        arguments: {
          subscriberNameOrEmail: 'john@example.com',
          planNameOrCode: 'standard-plan',
        },
      };
    }

    // 4. Outrageous requests fallback
    return {
      intent: 'UNSUPPORTED',
      explanation: `I'm not sure how to process that command. Encore currently supports creating plans (e.g., "Create monthly Gold plan for ₦5,000"), issuing invoices (e.g., "Bill user@example.com ₦10,000"), and subscribing customers.`,
    };
  }

  private async executeIntent(merchantId: string, parsed: ParsedCommand) {
    if (parsed.intent === 'UNSUPPORTED') {
      return {
        success: false,
        intent: parsed.intent,
        message:
          parsed.explanation ||
          'This request is not supported by Encore Billing Engine.',
        fallbackUsed: parsed.fallbackUsed,
      };
    }

    if (parsed.isDraft) {
      return {
        success: true,
        intent: parsed.intent,
        isDraft: true,
        data: parsed.arguments,
        message:
          parsed.explanation ||
          `I have prepared a draft action. Would you like to confirm and create it?`,
        fallbackUsed: parsed.fallbackUsed,
      };
    }

    const args = parsed.arguments || {};

    try {
      switch (parsed.intent) {
        case 'CREATE_PLAN': {
          const plan = await this.plansService.create(merchantId, {
            name: args.name || 'AI Generated Plan',
            code: args.code || `ai-${Date.now()}`,
            amount: Number(args.amount) || 1000,
            frequency: args.frequency || BillingFrequency.MONTHLY,
            description:
              args.description || 'Created via AI natural language command.',
          });
          return {
            success: true,
            intent: parsed.intent,
            data: plan,
            message: `Billing plan "${plan.name}" (₦${plan.amount}/${plan.frequency}) created successfully!`,
            fallbackUsed: parsed.fallbackUsed,
          };
        }

        case 'CREATE_INVOICE': {
          const target = args.subscriberNameOrEmail || '';
          const subscriber = await this.findSubscriberByNameOrEmail(
            merchantId,
            target,
          );

          if (!subscriber) {
            throw new BadRequestException(
              `Could not find a subscriber matching "${target}". Please register the subscriber first.`,
            );
          }

          const invoice = await this.billingService.createInvoice(merchantId, {
            subscriberId: subscriber.id,
            lineItems: args.lineItems || [
              {
                description: 'Custom AI Bill Charge',
                quantity: 1,
                unitPrice: 1000,
              },
            ],
            notes: args.notes || 'Created via AI Command Bar.',
          });

          return {
            success: true,
            intent: parsed.intent,
            data: invoice,
            message: `Invoice ${invoice.invoiceNumber} for ₦${invoice.totalAmount} has been generated and paid for ${invoice.customerName}!`,
            fallbackUsed: parsed.fallbackUsed,
          };
        }

        case 'SUBSCRIBE_CUSTOMER': {
          const targetSub = args.subscriberNameOrEmail || '';
          const targetPlan = args.planNameOrCode || '';

          const subscriber = await this.findSubscriberByNameOrEmail(
            merchantId,
            targetSub,
          );
          if (!subscriber) {
            throw new BadRequestException(
              `Could not find subscriber "${targetSub}". Please add them first.`,
            );
          }

          const plan = await this.findPlanByNameOrCode(merchantId, targetPlan);
          if (!plan) {
            throw new BadRequestException(
              `Could not find plan matching "${targetPlan}". Please create it first.`,
            );
          }

          const subscription = await this.subscribersService.subscribeCustomer(
            merchantId,
            subscriber.id,
            {
              planId: plan.id,
            },
          );

          return {
            success: true,
            intent: parsed.intent,
            data: subscription,
            message: `Successfully subscribed customer "${subscriber.firstName} ${subscriber.lastName}" to plan "${plan.name}" (₦${plan.amount}/${plan.frequency})!`,
            fallbackUsed: parsed.fallbackUsed,
          };
        }

        default:
          throw new BadRequestException('Unknown intent parsed by AI.');
      }
    } catch (err: any) {
      return {
        success: false,
        intent: parsed.intent,
        message: err.message || 'Execution failed.',
        fallbackUsed: parsed.fallbackUsed,
      };
    }
  }

  /**
   * Helper: Resolve subscriber UUID from name/email search
   */
  private async findSubscriberByNameOrEmail(
    merchantId: string,
    search: string,
  ) {
    const list = await this.subscribersService.findAll(merchantId);
    const target = search.toLowerCase().trim();
    if (!target) return list[0]; // fallback to first subscriber if empty

    return list.find((sub) => {
      const fullName = `${sub.firstName} ${sub.lastName}`.toLowerCase();
      return (
        sub.email.toLowerCase().includes(target) ||
        sub.firstName.toLowerCase().includes(target) ||
        sub.lastName.toLowerCase().includes(target) ||
        fullName.includes(target)
      );
    });
  }

  /**
   * Helper: Resolve plan UUID from name/code search
   */
  private async findPlanByNameOrCode(merchantId: string, search: string) {
    const list = await this.plansService.findAll(merchantId);
    const target = search.toLowerCase().trim();
    if (!target) return list[0]; // fallback to first plan

    return list.find(
      (plan) =>
        plan.name.toLowerCase().includes(target) ||
        plan.code.toLowerCase().includes(target),
    );
  }
}
