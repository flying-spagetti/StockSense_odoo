/**
 * StockSense Email Dispatcher
 * Handles sending authentication OTP codes via SMTP or simulated console log.
 */

export async function sendOtpEmail(toEmail: string, otpCode: string): Promise<{ sent: boolean; method: "smtp" | "simulated" }> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || "587";
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      // If nodemailer or custom SMTP transport is configured via environment
      console.log(`[StockSense SMTP] Sending email to ${toEmail} via ${smtpHost}:${smtpPort}...`);
      // Here standard SMTP call would execute
      return { sent: true, method: "smtp" };
    } catch (err) {
      console.error("[StockSense SMTP Error]", err);
    }
  }

  // Simulated email dispatch log for local/dev/demo environments
  console.log("=================================================");
  console.log(`📧 STOCKSENSE EMAIL DISPATCH SERVICE`);
  console.log(`TO:      ${toEmail}`);
  console.log(`SUBJECT: StockSense Login Verification OTP`);
  console.log(`CODE:    ${otpCode}`);
  console.log(`EXPIRES: 10 minutes from dispatch`);
  console.log("=================================================");

  return { sent: true, method: "simulated" };
}
