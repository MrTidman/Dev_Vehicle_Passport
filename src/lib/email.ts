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

/**
 * Send a service reminder email
 * 
 * @param userEmail - Recipient email address
 * @param carName - Name/make/model of the vehicle
 * @param reminderType - Type of reminder (MOT, tax, service, etc.)
 * @param dueDate - When the reminder is due
 */
export async function sendServiceReminder(
  userEmail: string,
  carName: string,
  reminderType: string,
  dueDate: string
): Promise<EmailResponse> {
  return sendEmail({
    to: userEmail,
    subject: `Service Reminder: ${carName} - ${reminderType}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #225566;">Service Passport Reminder</h2>
        <p>Dear Vehicle Owner,</p>
        <p>This is a reminder that your <strong>${carName}</strong> requires attention:</p>
        <ul>
          <li><strong>Reminder Type:</strong> ${reminderType}</li>
          <li><strong>Due Date:</strong> ${dueDate}</li>
        </ul>
        <p>Please log in to your Virtual Service Passport to view details.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message from Virtual Service Passport.</p>
      </div>
    `,
  });
}

/**
 * Send a service record confirmation email
 * 
 * @param userEmail - Recipient email address
 * @param carName - Name/make/model of the vehicle
 * @param serviceType - Type of service performed
 * @param serviceDate - Date of service
 */
export async function sendServiceConfirmation(
  userEmail: string,
  carName: string,
  serviceType: string,
  serviceDate: string
): Promise<EmailResponse> {
  return sendEmail({
    to: userEmail,
    subject: `Service Recorded: ${carName} - ${serviceType}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #225566;">Service Record Confirmation</h2>
        <p>Dear Vehicle Owner,</p>
        <p>Your service record has been successfully added:</p>
        <ul>
          <li><strong>Vehicle:</strong> ${carName}</li>
          <li><strong>Service Type:</strong> ${serviceType}</li>
          <li><strong>Date:</strong> ${serviceDate}</li>
        </ul>
        <p>Thank you for keeping your service history up to date!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Virtual Service Passport - Classic Car Documentation</p>
      </div>
    `,
  });
}

/**
 * Send vehicle transfer notification
 * 
 * @param userEmail - Recipient email address
 * @param carName - Name of the vehicle
 * @param transferDate - Date of transfer
 */
export async function sendTransferNotification(
  userEmail: string,
  carName: string,
  transferDate: string
): Promise<EmailResponse> {
  return sendEmail({
    to: userEmail,
    subject: `Vehicle Transferred: ${carName}`,
    htmlBody: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #225566;">Vehicle Transfer Notification</h2>
        <p>Dear User,</p>
        <p>A vehicle has been transferred to your ownership:</p>
        <ul>
          <li><strong>Vehicle:</strong> ${carName}</li>
          <li><strong>Transfer Date:</strong> ${transferDate}</li>
        </ul>
        <p>You can now manage this vehicle in your Virtual Service Passport.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">Virtual Service Passport</p>
      </div>
    `,
  });
}