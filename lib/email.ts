import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

let transporter: nodemailer.Transporter | null = null;
let transportInitFailed = false;

function getTransporter() {
  if (transporter) return transporter;
  if (transportInitFailed) return null;

  const host = process.env.EMAIL_SERVER_HOST;
  const port = parseInt(process.env.EMAIL_SERVER_PORT || '587', 10);
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;

  if (!host || !user || !pass) {
    console.warn('Email configuration missing. Emails will not be sent.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  // Verify the SMTP connection works
  transporter.verify((error) => {
    if (error) {
      console.error('[EMAIL] SMTP connection verification failed:', error.message);
      if (
        error.message.includes('Invalid login') ||
        error.message.includes('username and password not accepted')
      ) {
        console.error(
          '[EMAIL] Gmail requires an App Password. Generate one at: https://myaccount.google.com/apppasswords'
        );
      }
      if (error.message.includes('connect ECONNREFUSED') || error.message.includes('timeout')) {
        console.error('[EMAIL] Cannot connect to SMTP server. Check host/port settings.');
      }
      transporter = null;
      transportInitFailed = true;
    } else {
      console.log('[EMAIL] SMTP connection verified successfully');
    }
  });

  return transporter;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[EMAIL MOCK] Would send to ${options.to}: ${options.subject}`);
    return false;
  }

  try {
    await transport.sendMail({
      from: process.env.EMAIL_FROM || options.to,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''),
    });
    console.log(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export function getInvitationEmailHtml(
  inviterName: string,
  workspaceName: string,
  inviteLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're invited to join ${workspaceName}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">TaskMesh</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <h2 style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 22px; font-weight: 600;">You're invited!</h2>
                  <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                    <strong>${inviterName}</strong> has invited you to join the workspace <strong>${workspaceName}</strong> on TaskMesh.
                  </p>
                  <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                    Accept the invitation to start collaborating with your team, manage tasks, and boost productivity.
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 8px;">
                        <a href="${inviteLink}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">Accept Invitation</a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin: 32px 0 0 0; color: #6b7280; font-size: 14px; text-align: center;">
                    If the button doesn't work, copy and paste this link:<br>
                    <a href="${inviteLink}" style="color: #3b82f6; word-break: break-all;">${inviteLink}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #6b7280; font-size: 13px;">
                    This invitation was sent by TaskMesh. If you didn't expect this invitation, you can safely ignore this email.
                  </p>
                  <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">
                    &copy; ${new Date().getFullYear()} TaskMesh. All rights reserved.
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
}

export function getTaskAssignedEmailHtml(
  taskTitle: string,
  assignerName: string,
  taskLink: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Task Assigned</title></head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 0;">
        <tr>
          <td align="center">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">New Task Assigned</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="margin: 0 0 24px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                    <strong>${assignerName}</strong> has assigned you a new task: <strong>${taskTitle}</strong>
                  </p>
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td style="background: #10b981; border-radius: 8px;">
                        <a href="${taskLink}" target="_blank" style="display: inline-block; padding: 14px 32px; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600;">View Task</a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="background-color: #f9fafb; padding: 24px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0; color: #9ca3af; font-size: 12px;">&copy; ${new Date().getFullYear()} TaskMesh</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
