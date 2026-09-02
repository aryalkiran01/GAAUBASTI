export {};

let twilioClient = null;

const getClient = () => {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return null;
  }

  try {
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    return twilioClient;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[SMS] Twilio SDK not installed:', error.message);
    }
    return null;
  }
};

const isSMSConfigured = () => {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
};

const sendSMS = async (to, body) => {
  const client = getClient();
  if (!client) {
    if (process.env.NODE_ENV === 'development') {
      console.info(`[SMS] Twilio not configured — would send to ${to}: ${body}`);
    }
    return { sent: false, reason: 'TWILIO_NOT_CONFIGURED' };
  }

  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  const cleanTo = String(to).replace(/[^+\d]/g, '');
  if (!cleanTo) {
    return { sent: false, reason: 'INVALID_NUMBER' };
  }

  await (client as any).messages.create({
    body,
    from: fromNumber,
    to: cleanTo
  });

  return { sent: true };
};

const sendOTPSMS = async (to, otp) => {
  return sendSMS(to, `Your Gaun Basti verification code is: ${otp}. It expires in 10 minutes.`);
};

module.exports = { sendSMS, sendOTPSMS, isSMSConfigured };
