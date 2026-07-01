interface EmailLayoutOptions {
  title: string;
  preheader?: string;
  bodyHtml: string;
  cta?: {
    text: string;
    url: string;
  };
  footerHtml?: string;
}

/**
 * Builds the shared wrapper template using tables to maximize email compatibility
 */
export function buildEmailHtml(options: EmailLayoutOptions): string {
  const preheaderHtml = options.preheader
    ? `<span style="display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; mso-hide:all;">${options.preheader}</span>`
    : '';

  const ctaHtml = options.cta
    ? `
      <table cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0; width: 100%;">
        <tr>
          <td align="center">
            <a href="${options.cta.url}" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #4A4A4A; color: #FFFFFF; font-size: 14px; font-weight: 500; text-decoration: none; border-radius: 8px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; text-align: center; transition: background-color 150ms ease;">
              ${options.cta.text}
            </a>
          </td>
        </tr>
      </table>
    `
    : '';

  const footer =
    options.footerHtml ||
    `
    <p style="margin: 0; margin-bottom: 8px;">Sent by <strong>Encore</strong>, the smart subscription billing engine.</p>
    <p style="margin: 0;">If you have any questions, please contact our support team at <a href="mailto:support@encore.io" style="color: #666666; text-decoration: underline;">support@encore.io</a>.</p>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    table { border-collapse: collapse !important; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    
    @media screen and (max-width: 600px) {
      .container { width: 100% !important; max-width: 100% !important; border-radius: 0 !important; border-left: none !important; border-right: none !important; }
      .content-padding { padding: 24px 20px !important; }
      .header-padding { padding: 24px 20px 16px 20px !important; }
      .footer-padding { padding: 20px 20px !important; }
    }
  </style>
</head>
<body style="background-color: #F5F5F5; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 48px 0; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
  ${preheaderHtml}
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #F5F5F5; table-layout: fixed;">
    <tr>
      <td align="center" style="padding: 0 10px;">
        
        <!-- Main Card Container -->
        <table class="container" cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #FFFFFF; border: 1px solid #E0E0E0; border-radius: 12px; border-collapse: separate; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.02); text-align: left;">
          
          <!-- Header (Logo) -->
          <tr>
            <td class="header-padding" style="padding: 32px 32px 16px 32px; border-bottom: 1px solid #F5F5F5; background-color: #FFFFFF;">
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0;">
                <tr>
                  <td style="vertical-align: middle; padding-right: 10px;">
                    <!-- Elegant Rounded Minimalist E Icon -->
                    <div style="background-color: #4A4A4A; color: #FFFFFF; width: 32px; height: 32px; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 600; font-size: 16px; font-family: 'Inter', sans-serif;">
                      E
                    </div>
                  </td>
                  <td style="vertical-align: middle; font-size: 18px; font-weight: 600; color: #1A1A1A; letter-spacing: -0.5px;">
                    Encore
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td class="content-padding" style="padding: 32px 32px; color: #1A1A1A;">
              
              <!-- Content goes here -->
              ${options.bodyHtml}
              
              <!-- Optional Call-to-action button -->
              ${ctaHtml}
              
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td class="footer-padding" style="padding: 24px 32px; text-align: center; border-top: 1px solid #F5F5F5; background-color: #FFFFFF; font-size: 12px; color: #999999; line-height: 1.6;">
              ${footer}
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom extra space / spacer -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td height="24" style="line-height: 24px; font-size: 1px;">&nbsp;</td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Verification Email Template
 */
export function getVerificationEmailHtml(
  businessName: string,
  verificationUrl: string,
): string {
  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 600; color: #1A1A1A; margin-top: 0; margin-bottom: 16px;">Welcome to Encore, ${businessName}!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 16px;">We're excited to have you on board. Before we get started setting up your subscription billing engine, we need to verify your email address.</p>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 24px;">Please click the button below to verify your account. This link will expire in 24 hours.</p>
  `;

  const footerHtml = `
    <p style="margin: 0; margin-bottom: 8px;">If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="margin: 0; margin-bottom: 16px; word-break: break-all;"><a href="${verificationUrl}" style="color: #4A4A4A; text-decoration: underline;">${verificationUrl}</a></p>
    <hr style="border: 0; border-top: 1px solid #F5F5F5; margin: 16px 0;" />
    <p style="margin: 0; margin-bottom: 8px;">Sent by <strong>Encore</strong>, the smart subscription billing engine.</p>
    <p style="margin: 0;">If you didn't create an account, you can safely ignore this email.</p>
  `;

  return buildEmailHtml({
    title: 'Verify your Encore account',
    preheader: `Verify your email address to get started with Encore.`,
    bodyHtml,
    cta: {
      text: 'Verify Email',
      url: verificationUrl,
    },
    footerHtml,
  });
}

/**
 * Password Reset Email Template
 */
export function getPasswordResetEmailHtml(resetUrl: string): string {
  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 600; color: #1A1A1A; margin-top: 0; margin-bottom: 16px;">Reset your password</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 16px;">We received a request to reset your password for your Encore account.</p>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 24px;">Click the button below to choose a new password. This reset link is valid for 1 hour.</p>
  `;

  const footerHtml = `
    <p style="margin: 0; margin-bottom: 8px;">If the button doesn't work, copy and paste this URL into your browser:</p>
    <p style="margin: 0; margin-bottom: 16px; word-break: break-all;"><a href="${resetUrl}" style="color: #4A4A4A; text-decoration: underline;">${resetUrl}</a></p>
    <hr style="border: 0; border-top: 1px solid #F5F5F5; margin: 16px 0;" />
    <p style="margin: 0; margin-bottom: 8px;">If you didn't request this, you can safely ignore this email. Your password will remain unchanged.</p>
    <p style="margin: 0;">Sent by <strong>Encore</strong>.</p>
  `;

  return buildEmailHtml({
    title: 'Reset your Encore password',
    preheader: `Click the link to reset your Encore password.`,
    bodyHtml,
    cta: {
      text: 'Reset Password',
      url: resetUrl,
    },
    footerHtml,
  });
}

/**
 * Welcome Email Template
 */
export function getWelcomeEmailHtml(
  businessName: string,
  loginUrl: string,
): string {
  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 600; color: #1A1A1A; margin-top: 0; margin-bottom: 16px;">Your Encore account is ready!</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 16px;">Hello ${businessName},</p>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 16px;">Your email address has been successfully verified, and your Encore account is officially ready. You can now log into your dashboard to start managing pricing plans, subscribers, and payments.</p>
    
    <div style="background-color: #F5F5F5; border-radius: 8px; padding: 16px; margin: 24px 0;">
      <h3 style="font-size: 13px; font-weight: 600; color: #1A1A1A; margin: 0; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Next steps to get started:</h3>
      <ol style="margin: 0; padding-left: 20px; font-size: 14px; color: #666666; line-height: 1.6;">
        <li style="margin-bottom: 8px;">Set up your first <strong>Product & Pricing Plans</strong>.</li>
        <li style="margin-bottom: 8px;">Integrate our API or client SDK to start onboarding <strong>Subscribers</strong>.</li>
        <li style="margin-bottom: 0;">Configure your payment provider details to enable direct billing.</li>
      </ol>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 16px;">Click the button below to head to your dashboard and get started.</p>
  `;

  return buildEmailHtml({
    title: 'Welcome to Encore',
    preheader: `Your account is ready! Let's build your billing pipelines.`,
    bodyHtml,
    cta: {
      text: 'Go to Dashboard',
      url: loginUrl,
    },
  });
}

/**
 * Payment Receipt Email Template
 */
export function getPaymentReceiptEmailHtml(
  customerName: string,
  invoiceNumber: string,
  amount: string,
  date: string,
  paymentMethod: string,
  planName: string,
  viewInvoiceUrl?: string,
): string {
  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 600; color: #1A1A1A; margin-top: 0; margin-bottom: 8px;">Payment Receipt</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 24px;">Hi ${customerName}, thanks for your payment! Here is a summary of your receipt for invoice <strong>#${invoiceNumber}</strong>.</p>
    
    <div style="border: 1px solid #E0E0E0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <!-- Header bar -->
        <tr style="background-color: #F5F5F5;">
          <td style="padding: 12px 16px; border-bottom: 1px solid #E0E0E0; font-size: 12px; font-weight: 600; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Receipt Details</td>
          <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #E0E0E0; font-size: 12px; font-weight: 600;">
            <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 600; border-radius: 100px; background-color: #DCFCE7; color: #166534; text-transform: uppercase; font-family: 'Inter', sans-serif;">Paid</span>
          </td>
        </tr>
        <!-- Row items -->
        <tr>
          <td colspan="2" style="padding: 16px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px; color: #666666;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #999999;">Invoice Number</td>
                <td align="right" style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #1A1A1A; font-weight: 500;">#${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #999999;">Plan / Service</td>
                <td align="right" style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #1A1A1A; font-weight: 500;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #999999;">Date Paid</td>
                <td align="right" style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #1A1A1A; font-weight: 500;">${date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #999999;">Payment Method</td>
                <td align="right" style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #1A1A1A; font-weight: 500;">${paymentMethod}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 4px 0; color: #1A1A1A; font-weight: 600; font-size: 16px;">Amount Paid</td>
                <td align="right" style="padding: 12px 0 4px 0; color: #1A1A1A; font-weight: 600; font-size: 16px;">${amount}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;

  return buildEmailHtml({
    title: `Payment Receipt for Invoice #${invoiceNumber}`,
    preheader: `Thank you for your payment of ${amount} for invoice #${invoiceNumber}.`,
    bodyHtml,
    cta: viewInvoiceUrl
      ? {
          text: 'View Full Invoice',
          url: viewInvoiceUrl,
        }
      : undefined,
  });
}

/**
 * Dunning Email Template (Payment Failed)
 */
export function getDunningEmailHtml(
  customerName: string,
  invoiceNumber: string,
  amount: string,
  attemptCount: number,
  nextAttemptDate: string,
  updatePaymentUrl: string,
): string {
  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 600; color: #1A1A1A; margin-top: 0; margin-bottom: 8px;">Action Required: Payment Failed</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 24px;">Hi ${customerName}, we were unable to process your payment of <strong>${amount}</strong> for invoice <strong>#${invoiceNumber}</strong>. This was payment attempt <strong>#${attemptCount}</strong>.</p>
    
    <div style="border: 1px solid #E0E0E0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <!-- Header bar -->
        <tr style="background-color: #F5F5F5;">
          <td style="padding: 12px 16px; border-bottom: 1px solid #E0E0E0; font-size: 12px; font-weight: 600; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Failure Details</td>
          <td align="right" style="padding: 12px 16px; border-bottom: 1px solid #E0E0E0; font-size: 12px; font-weight: 600;">
            <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 600; border-radius: 100px; background-color: #FEE2E2; color: #991B1B; text-transform: uppercase; font-family: 'Inter', sans-serif;">Failed</span>
          </td>
        </tr>
        <!-- Row items -->
        <tr>
          <td colspan="2" style="padding: 16px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px; color: #666666;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #999999;">Invoice Number</td>
                <td align="right" style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #1A1A1A; font-weight: 500;">#${invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #999999;">Amount Due</td>
                <td align="right" style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #1A1A1A; font-weight: 500;">${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #999999;">Attempt Number</td>
                <td align="right" style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #1A1A1A; font-weight: 500;">${attemptCount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #999999;">Next Retry Attempt</td>
                <td align="right" style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #1A1A1A; font-weight: 500;">${nextAttemptDate}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 16px;">To prevent any disruption to your service, please click the button below to update your payment details. We will automatically retry billing on the next retry date.</p>
  `;

  return buildEmailHtml({
    title: `Action Required: Payment Failed for Invoice #${invoiceNumber}`,
    preheader: `Payment failed for invoice #${invoiceNumber}. Please update your payment method.`,
    bodyHtml,
    cta: {
      text: 'Update Payment Details',
      url: updatePaymentUrl,
    },
  });
}

/**
 * Subscriber Onboarding Email — sent after manual add OR self-enroll.
 * Contains plan summary and a one-time setup link (72h expiry).
 */
export function getSubscriberOnboardingEmailHtml(
  subscriberName: string,
  merchantName: string,
  planName: string,
  amount: string,
  frequency: string,
  setupUrl: string,
  trialDays?: number,
): string {
  const trialNote =
    trialDays && trialDays > 0
      ? `<p style="font-size: 14px; line-height: 1.6; color: #166534; background: #dcfce7; border-radius: 6px; padding: 10px 14px; margin: 0 0 20px 0;">
        🎉 <strong>Free trial included:</strong> You won't be charged for the first <strong>${trialDays} days</strong>.
       </p>`
      : '';

  const hasPlanDetails = planName && planName !== 'Your Plan' && amount && frequency;
  const subscriptionCard = hasPlanDetails
    ? `
    <div style="border: 1px solid #E0E0E0; border-radius: 8px; overflow: hidden; margin-bottom: 24px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr style="background-color: #F5F5F5;">
          <td style="padding: 12px 16px; border-bottom: 1px solid #E0E0E0; font-size: 12px; font-weight: 600; color: #666666; text-transform: uppercase; letter-spacing: 0.5px;">Your Subscription</td>
        </tr>
        <tr>
          <td style="padding: 16px;">
            <table cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size: 14px; color: #666666;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #999999;">Plan</td>
                <td align="right" style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #1A1A1A; font-weight: 600;">${planName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #999999;">Amount</td>
                <td align="right" style="padding: 8px 0; border-bottom: 1px solid #F5F5F5; color: #1A1A1A; font-weight: 600;">${amount}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999999;">Frequency</td>
                <td align="right" style="padding: 8px 0; color: #1A1A1A; font-weight: 600;">${frequency}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
    `
    : '';

  const bodyHtml = `
    <h2 style="font-size: 20px; font-weight: 600; color: #1A1A1A; margin-top: 0; margin-bottom: 8px;">You've been added to ${merchantName}</h2>
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin-top: 0; margin-bottom: 24px;">
      Hi ${subscriberName}, ${merchantName} has invited you to set up your account on Encore. ${hasPlanDetails ? "Here is a summary of your subscription:" : ""}
    </p>
    ${subscriptionCard}
    ${trialNote}
    <p style="font-size: 14px; line-height: 1.6; color: #666666; margin: 0 0 12px 0;">Click the button below to activate your subscription. In one step you will:</p>
    <ul style="font-size: 14px; line-height: 1.8; color: #666666; margin: 0 0 20px 0; padding-left: 20px;">
      <li>Set up your payment method (card or bank)</li>
      <li>Create your billing portal password</li>
      <li>Get instant access to your invoices and payment history</li>
    </ul>
    <p style="font-size: 12px; color: #999999; margin: 0 0 4px 0;">⏱ This link expires in 72 hours.</p>
  `;

  return buildEmailHtml({
    title: `You've been added to ${merchantName}`,
    preheader: `Set up your ${planName} subscription — takes less than 2 minutes.`,
    bodyHtml,
    cta: { text: 'Set Up My Subscription →', url: setupUrl },
  });
}
