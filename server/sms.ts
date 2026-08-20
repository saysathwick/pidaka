const OTP_GAP_MS = 45_000;
const OTP_HOUR_MAX = 5;
const OTP_HOUR_MS = 60 * 60 * 1000;

const sendLog = new Map<string, number[]>();

export class SmsError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.status = status;
  }
}

export class OtpRateError extends SmsError {
  constructor(message = "Wait a moment before asking for another code") {
    super(message, 429);
  }
}

export function twilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      (process.env.TWILIO_FROM || process.env.TWILIO_MESSAGING_SERVICE_SID),
  );
}

export function msg91Configured() {
  return Boolean(process.env.MSG91_AUTH_KEY && process.env.MSG91_TEMPLATE_ID);
}

export function smsConfigured() {
  return twilioConfigured() || msg91Configured();
}

export function assertOtpRate(phone: string) {
  const now = Date.now();
  const stamps = (sendLog.get(phone) ?? []).filter((at) => now - at < OTP_HOUR_MS);
  const last = stamps[stamps.length - 1];
  if (last && now - last < OTP_GAP_MS) {
    throw new OtpRateError("That code was just sent. Wait a moment.");
  }
  if (stamps.length >= OTP_HOUR_MAX) {
    throw new OtpRateError("Too many codes for this number. Try later.");
  }
  stamps.push(now);
  sendLog.set(phone, stamps);
}

function smsBody(code: string) {
  return `Pidaka code: ${code}. It dies in five minutes.`;
}

function twilioMessage(raw: string) {
  try {
    const parsed = JSON.parse(raw) as { code?: number; message?: string };
    if (parsed.code === 21608) return "Twilio will only send to verified numbers on a trial account";
    if (parsed.code === 21408) return "Twilio is not allowed to send to this country yet";
    if (parsed.message) return parsed.message;
  } catch {
    // keep a short fallback
  }
  return "The SMS provider refused the send";
}

async function sendTwilio(phone: string, code: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const token = process.env.TWILIO_AUTH_TOKEN!;
  const body = new URLSearchParams({
    To: phone,
    Body: smsBody(code),
  });
  if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
    body.set("MessagingServiceSid", process.env.TWILIO_MESSAGING_SERVICE_SID);
  } else {
    body.set("From", process.env.TWILIO_FROM!);
  }
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    throw new SmsError(twilioMessage(await res.text()));
  }
}

async function sendMsg91(phone: string, code: string) {
  const res = await fetch("https://control.msg91.com/api/v5/otp", {
    method: "POST",
    headers: {
      authkey: process.env.MSG91_AUTH_KEY!,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      template_id: process.env.MSG91_TEMPLATE_ID,
      mobile: phone.replace(/^\+/, ""),
      otp: code,
      otp_expiry: 5,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new SmsError("MSG91 refused the send");
  }
  try {
    const parsed = JSON.parse(text) as { type?: string; message?: string };
    if (parsed.type && parsed.type !== "success") {
      throw new SmsError(parsed.message || "MSG91 refused the send");
    }
  } catch (err) {
    if (err instanceof SmsError) throw err;
  }
}

export async function deliverPhoneCode(phone: string, code: string) {
  if (msg91Configured()) {
    await sendMsg91(phone, code);
    return;
  }
  if (twilioConfigured()) {
    await sendTwilio(phone, code);
    return;
  }
  throw new SmsError("Phone is not wired on this wall", 503);
}
