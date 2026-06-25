import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = "email" | "sms" | "whatsapp";
type MessageType = "transactional" | "marketing";

interface NotificationPayload {
  action?: "send" | "send_otp" | "verify_otp";
  channel: Channel;
  message_type?: MessageType;
  // Recipient
  to_email?: string;
  to_phone?: string;
  user_profile_id?: string;
  // Content
  template_name?: string;
  subject?: string;
  body_html?: string;
  body_text?: string;
  variables?: Record<string, string>;
  otp_code?: string;
  // Order context
  order_id?: string;
  campaign_id?: string;
  // Admin alert flag
  is_admin_alert?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function interpolate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

async function logMessage(
  supabase: ReturnType<typeof createClient>,
  params: {
    channel: Channel;
    message_type: MessageType;
    user_profile_id?: string;
    template_name?: string;
    recipient_email?: string;
    recipient_phone?: string;
    subject?: string;
    body_preview?: string;
    status: string;
    provider: string;
    provider_message_id?: string;
    provider_response?: unknown;
    error_message?: string;
    order_id?: string;
    campaign_id?: string;
  },
) {
  try {
    await supabase.from("communication_logs").insert({
      channel: params.channel,
      message_type: params.message_type,
      user_profile_id: params.user_profile_id ?? null,
      template_name: params.template_name ?? null,
      recipient_email: params.recipient_email ?? null,
      recipient_phone: params.recipient_phone ?? null,
      subject: params.subject ?? null,
      body_preview: params.body_preview ? params.body_preview.substring(0, 200) : null,
      status: params.status,
      provider: params.provider,
      provider_message_id: params.provider_message_id ?? null,
      provider_response: params.provider_response ?? null,
      error_message: params.error_message ?? null,
      order_id: params.order_id ?? null,
      campaign_id: params.campaign_id ?? null,
      sent_at: params.status === "sent" ? new Date().toISOString() : null,
    });
  } catch (e) {
    console.error("[send-notification] log error:", e);
  }
}

// ─── SendGrid Email ───────────────────────────────────────────────────────────

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<{ ok: boolean; message_id?: string; error?: string }> {
  const apiKey = Deno.env.get("SENDGRID_API_KEY");
  const fromEmail = Deno.env.get("SENDGRID_FROM_EMAIL") || "noreply@pocketgrocery.com";
  const fromName = Deno.env.get("SENDGRID_FROM_NAME") || "PocketGrocery";

  if (!apiKey) return { ok: false, error: "SENDGRID_API_KEY not configured" };

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: params.to }] }],
        from: { email: fromEmail, name: fromName },
        subject: params.subject,
        content: [
          { type: "text/plain", value: params.text },
          { type: "text/html", value: params.html },
        ],
      }),
    });

    if (res.status === 202) {
      const messageId = res.headers.get("X-Message-Id") ?? undefined;
      return { ok: true, message_id: messageId };
    }

    const body = await res.text();
    return { ok: false, error: `SendGrid ${res.status}: ${body}` };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─── Twilio SMS ───────────────────────────────────────────────────────────────

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (phone.startsWith("+")) return `+${cleaned}`;
  // Default to UK if 10/11 digits and no +
  if (cleaned.length === 10 || cleaned.length === 11) {
    if (cleaned.startsWith("0")) return `+44${cleaned.substring(1)}`;
    if (cleaned.startsWith("7")) return `+44${cleaned}`;
  }
  return phone.startsWith("+") ? phone : `+${phone}`;
}

async function sendSms(params: {
  to: string;
  body: string;
}): Promise<{ ok: boolean; message_id?: string; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const fromPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

  if (!accountSid || !authToken || !fromPhone) {
    return { ok: false, error: "Twilio SMS credentials not configured" };
  }

  try {
    const credentials = btoa(`${accountSid}:${authToken}`);
    const to = formatPhoneNumber(params.to);
    const form = new URLSearchParams({
      To: to,
      From: fromPhone,
      Body: params.body,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${credentials}`,
        },
        body: form.toString(),
      },
    );

    const data = await res.json();
    if (data.sid) return { ok: true, message_id: data.sid };
    return { ok: false, error: data.message ?? JSON.stringify(data) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─── Twilio WhatsApp ──────────────────────────────────────────────────────────

async function sendWhatsApp(params: {
  to: string;
  body: string;
}): Promise<{ ok: boolean; message_id?: string; error?: string }> {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const whatsappNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

  if (!accountSid || !authToken || !whatsappNumber) {
    return { ok: false, error: "Twilio WhatsApp credentials not configured" };
  }

  try {
    const credentials = btoa(`${accountSid}:${authToken}`);
    const toWhatsapp = params.to.startsWith("whatsapp:") ? params.to : `whatsapp:${params.to}`;
    const fromWhatsapp = whatsappNumber.startsWith("whatsapp:") ? whatsappNumber : `whatsapp:${whatsappNumber}`;

    const form = new URLSearchParams({
      To: toWhatsapp,
      From: fromWhatsapp,
      Body: params.body,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": `Basic ${credentials}`,
        },
        body: form.toString(),
      },
    );

    const data = await res.json();
    if (data.sid) return { ok: true, message_id: data.sid };
    return { ok: false, error: data.message ?? JSON.stringify(data) };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─── Preference check ─────────────────────────────────────────────────────────

async function checkPreference(
  supabase: ReturnType<typeof createClient>,
  userProfileId: string,
  channel: Channel,
  messageType: MessageType,
): Promise<boolean> {
  const { data } = await supabase
    .from("communication_preferences")
    .select("*")
    .eq("user_profile_id", userProfileId)
    .maybeSingle();

  if (!data) return channel === "email" && messageType === "transactional"; // default: email transactional always on

  const key = `${channel}_${messageType}` as keyof typeof data;
  return Boolean(data[key]);
}

// ─── Template resolver ────────────────────────────────────────────────────────

async function resolveTemplate(
  supabase: ReturnType<typeof createClient>,
  templateName: string,
  channel: Channel,
  variables: Record<string, string>,
): Promise<{ subject: string; html: string; text: string; template_id?: string } | null> {
  const { data } = await supabase
    .from("communication_templates")
    .select("id, subject, body_html, body_text")
    .eq("name", templateName)
    .eq("channel", channel)
    .eq("is_active", true)
    .maybeSingle();

  if (!data) return null;

  return {
    subject: interpolate(data.subject ?? "", variables),
    html: interpolate(data.body_html ?? data.body_text ?? "", variables),
    text: interpolate(data.body_text ?? "", variables),
    template_id: data.id,
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const payload: NotificationPayload = await req.json();
    const {
      action = "send",
      channel,
      message_type = "transactional",
      to_email,
      to_phone,
      user_profile_id,
      template_name,
      subject: subjectOverride,
      body_html: htmlOverride,
      body_text: textOverride,
      variables = {},
      otp_code,
      order_id,
      campaign_id,
      is_admin_alert = false,
    } = payload;

    if (action === "send_otp") {
      const to = to_phone || to_email;
      if (!to) return new Response(JSON.stringify({ error: "recipient required" }), { status: 400, headers: corsHeaders });
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const serviceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
      if (!accountSid || !authToken || !serviceSid) return new Response(JSON.stringify({ error: "Twilio Verify not configured" }), { status: 500, headers: corsHeaders });

      const res = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`, {
        method: "POST",
        headers: { "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: to, Channel: channel === "email" ? "email" : "sms" }),
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: res.ok, sid: data.sid, error: data.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "verify_otp") {
      const to = to_phone || to_email;
      if (!to || !otp_code) return new Response(JSON.stringify({ error: "recipient and code required" }), { status: 400, headers: corsHeaders });
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const serviceSid = Deno.env.get("TWILIO_VERIFY_SERVICE_SID");
      if (!accountSid || !authToken || !serviceSid) return new Response(JSON.stringify({ error: "Twilio Verify not configured" }), { status: 500, headers: corsHeaders });

      const res = await fetch(`https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`, {
        method: "POST",
        headers: { "Authorization": `Basic ${btoa(`${accountSid}:${authToken}`)}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ To: to, Code: otp_code }),
      });
      const data = await res.json();
      return new Response(JSON.stringify({ success: data.status === "approved", error: data.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (!channel) {
      return new Response(
        JSON.stringify({ error: "channel is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Check preferences for non-admin-alert messages
    if (!is_admin_alert && user_profile_id) {
      const allowed = await checkPreference(supabase, user_profile_id, channel, message_type);
      if (!allowed) {
        return new Response(
          JSON.stringify({ skipped: true, reason: "customer_preference" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Resolve content
    let subject = subjectOverride ?? "";
    let bodyHtml = htmlOverride ?? "";
    let bodyText = textOverride ?? "";
    let templateId: string | undefined;

    if (template_name) {
      const tpl = await resolveTemplate(supabase, template_name, channel, variables);
      if (tpl) {
        subject = tpl.subject || subject;
        bodyHtml = tpl.html || bodyHtml;
        bodyText = tpl.text || bodyText;
        templateId = tpl.template_id;
      }
    } else {
      subject = interpolate(subject, variables);
      bodyHtml = interpolate(bodyHtml, variables);
      bodyText = interpolate(bodyText, variables);
    }

    let result: { ok: boolean; message_id?: string; error?: string } = { ok: false, error: "Unknown channel" };
    let provider = "";

    if (channel === "email") {
      const toAddr = to_email;
      if (!toAddr) {
        return new Response(
          JSON.stringify({ error: "to_email required for email channel" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      provider = "sendgrid";
      result = await sendEmail({ to: toAddr, subject, html: bodyHtml || `<p>${bodyText}</p>`, text: bodyText });

      EdgeRuntime.waitUntil(
        logMessage(supabase, {
          channel,
          message_type,
          user_profile_id,
          template_name,
          recipient_email: toAddr,
          subject,
          body_preview: bodyText,
          status: result.ok ? "sent" : "failed",
          provider,
          provider_message_id: result.message_id,
          error_message: result.error,
          order_id,
          campaign_id,
        }),
      );
    } else if (channel === "sms") {
      const toNum = to_phone;
      if (!toNum) {
        return new Response(
          JSON.stringify({ error: "to_phone required for sms channel" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      provider = "twilio_sms";
      result = await sendSms({ to: toNum, body: bodyText });

      EdgeRuntime.waitUntil(
        logMessage(supabase, {
          channel,
          message_type,
          user_profile_id,
          template_name,
          recipient_phone: toNum,
          body_preview: bodyText,
          status: result.ok ? "sent" : "failed",
          provider,
          provider_message_id: result.message_id,
          error_message: result.error,
          order_id,
          campaign_id,
        }),
      );
    } else if (channel === "whatsapp") {
      const toNum = to_phone;
      if (!toNum) {
        return new Response(
          JSON.stringify({ error: "to_phone required for whatsapp channel" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      provider = "twilio_whatsapp";
      result = await sendWhatsApp({ to: toNum, body: bodyText });

      EdgeRuntime.waitUntil(
        logMessage(supabase, {
          channel,
          message_type,
          user_profile_id,
          template_name,
          recipient_phone: toNum,
          body_preview: bodyText,
          status: result.ok ? "sent" : "failed",
          provider,
          provider_message_id: result.message_id,
          error_message: result.error,
          order_id,
          campaign_id,
        }),
      );
    }

    return new Response(
      JSON.stringify({ success: result.ok, message_id: result.message_id, error: result.error }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[send-notification] error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
