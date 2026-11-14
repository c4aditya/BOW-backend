const nodemailer = require('nodemailer');

const createTransporter = () => {
    const host = process.env.SMTP_HOST || process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com';
    const port = parseInt(process.env.SMTP_PORT || process.env.BREVO_SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER || process.env.BREVO_SMTP_USER || process.env.SMTP_LOGIN;
    const pass = process.env.SMTP_PASS || process.env.BREVO_SMTP_PASS || process.env.SMTP_PASSWORD;

    return nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: {
            user,
            pass
        }
    });
};

const sendClassApprovedEmail = async ({ userEmail, userName, classNumber, className }) => {
    try {
        if (!userEmail) {
            console.error("[EMAIL ERROR] sendClassApprovedEmail: Missing recipient email address.");
            return;
        }

        console.log(`[EMAIL DISPATCH] Attempting to send Approval Email to: ${userEmail}...`);
        const transporter = createTransporter();
        const fromAddress = process.env.MAIL_FROM || "info@aviation-courses.com";

        const mailOptions = {
            from: `"Aviation Class" <${fromAddress}>`,
            to: userEmail,
            subject: 'Class Access Approved',
            text: `Hello ${userName || 'Student'},

Congratulations!

Your request for class access has been approved.

Class Number: ${classNumber || ''}
Class Name: ${className || ''}

You can now log in to your account and start watching your class.

Thank you for learning with us.

Best Regards,
Aviation Classes Team`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] Approval email sent successfully to ${userEmail}. Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send approval email to ${userEmail}:`, error);
    }
};

const sendClassRejectedEmail = async ({ userEmail, userName, classNumber, className }) => {
    try {
        if (!userEmail) {
            console.error("[EMAIL ERROR] sendClassRejectedEmail: Missing recipient email address.");
            return;
        }

        console.log(`[EMAIL DISPATCH] Attempting to send Rejection Email to: ${userEmail}...`);
        const transporter = createTransporter();
        const fromAddress = process.env.MAIL_FROM || "info@aviation-courses.com";

        const mailOptions = {
            from: `"Aviation Classes" <${fromAddress}>`,
            to: userEmail,
            subject: 'Class Access Request Rejected',
            text: `Hello ${userName || 'Student'},

Your request for the following class has been rejected.

Class Number: ${classNumber || ''}
Class Name: ${className || ''}

If you believe this was a mistake or need any assistance, please contact our support team.

Best Regards,
Aviation Classes Team`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] Rejection email sent successfully to ${userEmail}. Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send rejection email to ${userEmail}:`, error);
    }
};

const sendAccountApprovedEmail = async ({ userEmail, userName }) => {
    try {
        if (!userEmail) {
            console.error("[EMAIL ERROR] sendAccountApprovedEmail: Missing recipient email address.");
            return;
        }

        console.log(`[EMAIL DISPATCH] Attempting to send Account Approval Email to: ${userEmail}...`);
        const transporter = createTransporter();
        const fromAddress = process.env.MAIL_FROM || "info@aviation-courses.com";

        const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Aviation Classes Account Has Been Approved</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Banner Image / Header -->
          <tr>
            <td style="background-color: #1e40af; text-align: center; padding: 0;">
              <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=1200&auto=format&fit=crop" alt="Aviation Training Banner" style="width: 100%; max-height: 220px; object-fit: cover; display: block;" />
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <div style="display: inline-block; background-color: #dbeafe; color: #1e40af; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 16px;">
                Account Status: Approved
              </div>

              <h1 style="margin: 0 0 20px 0; color: #0f172a; font-size: 26px; font-weight: 800; line-height: 1.3;">
                🎉 Congratulations!
              </h1>

              <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
                Hello <strong>${userName || 'Student'}</strong>,
              </p>

              <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
                We are pleased to inform you that your <strong>Aviation Classes</strong> account has been successfully approved.
              </p>

                <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 16px 0;">
              <strong>Note :- Please use same email and password at the time you  signup </strong>
              </p>

              <p style="font-size: 16px; line-height: 1.6; color: #334155; margin: 0 0 28px 0;">
                You can now log in to your account and start accessing your learning dashboard and available classes.
              </p>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="https://aviation-courses.com/" target="_blank" style="background-color: #2563eb; color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.3);">
                  Login to Aviation Classes &rarr;
                </a>
              </div>

              <!-- Support Box -->
              <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 20px; border-radius: 6px; margin: 32px 0 24px 0;">
                <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 700; color: #1e293b;">
                  Need Support or Assistance?
                </p>
                <p style="margin: 0 0 4px 0; font-size: 14px; line-height: 1.5; color: #475569;">
                  If you experience any issues while logging in, please don't worry.
                </p>
                <p style="margin: 0 0 4px 0; font-size: 14px; line-height: 1.5; color: #475569;">
                  Our support team is here to help you.
                </p>
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #475569;">
                  Please contact us and we'll assist you as soon as possible.
                </p>
              </div>

              <!-- Closing -->
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 28px 0 6px 0;">
                Thank you for choosing Aviation Classes.
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
                We wish you great success in your aviation learning journey.
              </p>

              <p style="font-size: 15px; font-weight: 700; color: #0f172a; margin: 0;">
                Best Regards,<br />
                <span style="color: #2563eb;">Aviation Classes Team</span>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 32px; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 6px 0; font-weight: 700; color: #f8fafc; font-size: 14px;">
                Aviation Classes
              </p>
              <p style="margin: 0 0 12px 0;">
                <a href="https://aviation-courses.com/" target="_blank" style="color: #60a5fa; text-decoration: none;">https://aviation-courses.com/</a>
              </p>
              <p style="margin: 0; font-size: 12px; opacity: 0.8;">
                &copy; ${new Date().getFullYear()} Aviation Classes. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

        const mailOptions = {
            from: `"Aviation Classes" <${fromAddress}>`,
            to: userEmail,
            subject: '🎉 Your Aviation Classes Account Has Been Approved',
            html: htmlContent
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[EMAIL SUCCESS] Account approval email sent successfully to ${userEmail}. Message ID: ${info.messageId}`);
        return info;
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send account approval email to ${userEmail}:`, error);
    }
};

module.exports = {
    sendClassApprovedEmail,
    sendClassRejectedEmail,
    sendAccountApprovedEmail
};
