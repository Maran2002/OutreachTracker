import nodemailer from 'nodemailer';

// Create SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

/**
 * Sends a 6-digit OTP email using Gmail SMTP.
 * @param {string} to - Recipient email address
 * @param {string} otp - 6-digit code
 * @param {string} purpose - 'email_verification' | 'password_reset'
 */
export async function sendOtpEmail(to, otp, purpose) {
  const isVerification = purpose === 'email_verification';
  const subject = isVerification
    ? 'Verify your email address - OutreachTracker'
    : 'Reset your password - OutreachTracker';

  const title = isVerification ? 'Verify Your Email Address' : 'Reset Your Password';
  const message = isVerification
    ? 'Thank you for registering. Please use the following 6-digit verification code to complete your registration:'
    : 'We received a request to reset your password. Please use the following 6-digit code to complete the process:';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          background-color: #f8fafc;
          margin: 0;
          padding: 0;
          color: #334155;
        }
        .container {
          max-width: 600px;
          margin: 40px auto;
          background: #ffffff;
          border-radius: 12px;
          padding: 40px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
          border: 1px solid #e2e8f0;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo {
          font-size: 24px;
          font-weight: 700;
          color: #2563eb;
          text-decoration: none;
        }
        .title {
          font-size: 20px;
          font-weight: 600;
          color: #0f172a;
          margin-top: 16px;
          margin-bottom: 8px;
        }
        .content {
          font-size: 16px;
          line-height: 1.6;
          color: #475569;
          margin-bottom: 32px;
        }
        .otp-container {
          text-align: center;
          margin: 32px 0;
        }
        .otp-code {
          display: inline-block;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: 6px;
          color: #2563eb;
          background-color: #eff6ff;
          padding: 12px 24px;
          border-radius: 8px;
          border: 1px solid #bfdbfe;
        }
        .footer {
          margin-top: 32px;
          padding-top: 24px;
          border-t: 1px solid #e2e8f0;
          text-align: center;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <span class="logo">OutreachTracker</span>
          <h1 class="title">${title}</h1>
        </div>
        <div class="content">
          <p>Hello,</p>
          <p>${message}</p>
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This code is only valid for <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} OutreachTracker. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    html: htmlContent,
    text: `${title}\n\nHello,\n\n${message}\n\nCode: ${otp}\n\nThis code is only valid for 10 minutes. If you did not make this request, you can safely ignore this email.`,
  };

  return transporter.sendMail(mailOptions);
}
