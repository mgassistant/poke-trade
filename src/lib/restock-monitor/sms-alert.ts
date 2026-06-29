/**
 * SMS Alert for Drop Monitor
 * Uses Twilio to send SMS notifications when items go in stock
 */

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID!;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN!;
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER!;
const ALERT_PHONE = "+15625179768"; // Maria

export async function sendDropAlert(
  retailer: string,
  productName: string,
  price: number | undefined,
  url: string,
  cartStatus: "carted" | "failed" | "skipped" | "monitor-only"
): Promise<boolean> {
  const emoji = cartStatus === "carted" ? "🛒" : "🚨";
  const cartMsg = cartStatus === "carted" 
    ? "AUTO-CARTED ✅ Go checkout NOW!" 
    : cartStatus === "failed"
    ? "Auto-cart failed — buy manually NOW!"
    : cartStatus === "skipped"
    ? "Skipped (price/seller issue)"
    : "IN STOCK — buy manually!";

  const body = `${emoji} POKEMON DROP ALERT\n\n${productName}\n${retailer.toUpperCase()} — $${price ?? "?"}\n${cartMsg}\n\n${url}`;

  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const params = new URLSearchParams();
    params.append("To", ALERT_PHONE);
    params.append("From", TWILIO_FROM);
    params.append("Body", body);

    const res = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`SMS alert failed: ${res.status} ${err}`);
      return false;
    }

    console.log(`📱 SMS alert sent to ${ALERT_PHONE}: ${productName} (${retailer})`);
    return true;
  } catch (e: any) {
    console.error(`SMS alert error: ${e.message}`);
    return false;
  }
}

/**
 * Send a summary SMS (e.g., at end of monitoring window)
 */
export async function sendDropSummary(
  message: string
): Promise<boolean> {
  try {
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const params = new URLSearchParams();
    params.append("To", ALERT_PHONE);
    params.append("From", TWILIO_FROM);
    params.append("Body", message);

    const res = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });

    return res.ok;
  } catch {
    return false;
  }
}
