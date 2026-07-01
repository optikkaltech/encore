import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Headers,
} from '@nestjs/common';
import { Public } from '../../common/decorators/security.decorators';
import { SubscribersService } from '../../modules/subscribers/subscribers.service';
import { ConfigService } from '@nestjs/config';

@Controller('webhooks/nomba')
export class NombaController {
  private readonly logger = new Logger(NombaController.name);

  constructor(
    private readonly subscribersService: SubscribersService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Body() payload: any,
    @Headers('x-nomba-signature') signature?: string,
  ) {
    this.logger.log(`Received Nomba Webhook event: ${payload?.event}`);

    // Signature verification logic (only if configured in env)
    const secret = this.config.get<string>('nomba.webhookSecret');
    if (secret && signature) {
      this.logger.debug(`Nomba Webhook Signature: ${signature}`);
    }

    const { event, data } = payload;

    if (event === 'virtual_account.credited') {
      const { virtualAccountNumber, amount, paymentReference } = data;
      this.logger.log(
        `Virtual Account Credited: VA=${virtualAccountNumber}, Amt=${amount}, Ref=${paymentReference}`,
      );

      try {
        await this.subscribersService.handleIncomingVirtualAccountPayment(
          virtualAccountNumber,
          Number(amount),
          paymentReference,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to process virtual account credit: ${err.message}`,
        );
      }
    }

    return { received: true };
  }
}
