import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'Poké-Trade <notifications@updates.poke-trade.com>';

export async function sendEmail(params: {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      reply_to: params.replyTo || 'support@poke-trade.com',
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

// Email templates
export function tradeNotificationEmail(userName: string, tradeAction: string, details: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #dc2626; font-size: 24px; margin: 0;">Poké-Trade</h1>
      </div>
      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; border: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px;">Hi ${userName},</p>
        <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600;">${tradeAction}</p>
        <p style="margin: 0; color: #6b7280;">${details}</p>
      </div>
      <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
        <a href="https://poke-trade.com/dashboard" style="display: inline-block; background: #dc2626; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">View on Poké-Trade</a>
      </div>
      <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 24px;">
        © ${new Date().getFullYear()} Poké-Trade. All rights reserved.
      </p>
    </div>
  `;
}
