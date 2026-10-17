import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface NotificationPayload {
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'booking_reminder' | 'message_received' | 'review_requested';
  recipientEmail: string;
  recipientName: string;
  data: Record<string, any>;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  try {
    const payload: NotificationPayload = await req.json();

    // Validate required fields
    if (!payload.recipientEmail || !payload.type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Build email content based on notification type
    const { subject, html } = buildEmailContent(payload);

    // In production, integrate with an email service like Resend, SendGrid, or Postmark
    // For now, we'll log the email and return success
    console.log(`[EMAIL] To: ${payload.recipientEmail}`);
    console.log(`[EMAIL] Subject: ${subject}`);
    console.log(`[EMAIL] Type: ${payload.type}`);

    // Example integration with Resend (uncomment when environment variable is set):
    /*
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'NexAdvisor <noreply@nexadvisor.com>',
          to: payload.recipientEmail,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to send email:', error);
        throw new Error('Failed to send email');
      }
    }
    */

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification queued",
        recipient: payload.recipientEmail,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

function buildEmailContent(payload: NotificationPayload): { subject: string; html: string } {
  const { type, recipientName, data } = payload;

  switch (type) {
    case 'booking_created':
      return {
        subject: `New Booking Request - ${data.expertName || 'Expert'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Booking Request</h2>
            <p>Hello ${recipientName},</p>
            <p>You have a new booking request from <strong>${data.clientName}</strong>.</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Service:</strong> ${data.serviceName || 'Consultation'}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Time:</strong> ${data.time}</p>
              <p><strong>Duration:</strong> ${data.duration} minutes</p>
            </div>
            <p>Please log in to your dashboard to confirm or decline this booking.</p>
            <a href="${data.dashboardUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">View Booking</a>
          </div>
        `,
      };

    case 'booking_confirmed':
      return {
        subject: `Booking Confirmed - ${data.expertName || 'Your Session'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Booking Confirmed</h2>
            <p>Hello ${recipientName},</p>
            <p>Your booking with <strong>${data.expertName}</strong> has been confirmed!</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Service:</strong> ${data.serviceName || 'Consultation'}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Time:</strong> ${data.time}</p>
              <p><strong>Duration:</strong> ${data.duration} minutes</p>
              <p><strong>Video Link:</strong> <a href="${data.videoCallUrl}">Join Session</a></p>
            </div>
            <p>Add this event to your calendar so you don't miss it.</p>
          </div>
        `,
      };

    case 'booking_cancelled':
      return {
        subject: `Booking Cancelled - ${data.expertName || data.clientName || 'Session'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Booking Cancelled</h2>
            <p>Hello ${recipientName},</p>
            <p>A booking has been cancelled.</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Time:</strong> ${data.time}</p>
              <p><strong>Reason:</strong> ${data.reason || 'Not specified'}</p>
            </div>
            <p>If you'd like to reschedule, please visit the platform.</p>
          </div>
        `,
      };

    case 'booking_reminder':
      return {
        subject: `Upcoming Session Reminder - ${data.expertName || 'Your Consultation'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Session Reminder</h2>
            <p>Hello ${recipientName},</p>
            <p>This is a reminder that you have an upcoming session in <strong>${data.timeUntil}</strong>.</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>With:</strong> ${data.expertName || data.clientName}</p>
              <p><strong>Date:</strong> ${data.date}</p>
              <p><strong>Time:</strong> ${data.time}</p>
            </div>
            <a href="${data.videoCallUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Join Session</a>
          </div>
        `,
      };

    case 'message_received':
      return {
        subject: `New Message from ${data.senderName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Message</h2>
            <p>Hello ${recipientName},</p>
            <p>You have a new message from <strong>${data.senderName}</strong>:</p>
            <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p style="margin: 0;">${data.messagePreview}</p>
            </div>
            <a href="${data.conversationUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Reply</a>
          </div>
        `,
      };

    case 'review_requested':
      return {
        subject: `How was your session with ${data.expertName}?`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Leave a Review</h2>
            <p>Hello ${recipientName},</p>
            <p>Your recent session with <strong>${data.expertName}</strong> has been completed. We'd love to hear your feedback!</p>
            <p>Your review helps other clients make informed decisions and helps experts improve their services.</p>
            <a href="${data.reviewUrl}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px;">Leave a Review</a>
          </div>
        `,
      };

    default:
      return {
        subject: 'Notification from NexAdvisor',
        html: `<p>Hello ${recipientName},</p><p>You have a new notification.</p>`,
      };
  }
}
