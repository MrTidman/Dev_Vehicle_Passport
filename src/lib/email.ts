/**
 * Email Notification Infrastructure
 * 
 * This module provides the interface for sending email notifications.
 * Currently a stub - to be implemented with Supabase Edge Functions
 * and an email provider (SendGrid, Resend, AWS SES, etc.).
 * 
 * Future implementation:
 * 1. Set up Supabase Edge Function to handle email sending
 * 2. Configure email provider (Resend recommended for ease of use)
 * 3. Update edge function URL in environment variables
 * 4. Implement actual email sending logic
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  htmlBody?: string;
  textBody?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  contentType?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send an email notification
 * 
 * Currently throws an error indicating implementation is pending.
 * 
 * @param options - Email configuration options
 * @returns Promise resolving to email send result
 * 
 * @example
 * ```ts
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Service Reminder',
 *   htmlBody: '<p>Your car is due for service</p>',
 * });
 * ```
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResponse> {
  // TODO: Implement with Supabase Edge Function
  // 
  // Implementation steps:
  // 1. Create Supabase Edge Function: supabase/functions/send-email/index.ts
  // 2. Add Resend (or other provider) API key to Supabase secrets
  // 3. Deploy edge function
  // 4. Call edge function here instead of throwing
  
  console.warn('Email sending not yet implemented. Configure Supabase Edge Function.');
  
  // Placeholder implementation - remove when real implementation is added
  const endpoint = import.meta.env.VITE_EMAIL_EDGE_FUNCTION_URL;
  
  if (!endpoint) {
    throw new Error(
      'Email service not configured. Set VITE_EMAIL_EDGE_FUNCTION_URL environment variable.'
    );
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: options.to,
        subject: options.subject,
        html_body: options.htmlBody,
        text_body: options.textBody,
        from: options.from,
        reply_to: options.replyTo,
        attachments: options.attachments,
      }),
    });

    if (!response.ok) {
      throw new Error(`Email API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      success: true,
      messageId: data.messageId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}