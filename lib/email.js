import nodemailer from "nodemailer";

export const quoteRecipient = process.env.QUOTE_NOTIFICATION_EMAIL || "quantuzgoo@gmail.com";
const appBaseUrl = process.env.APP_BASE_URL || "http://localhost:3004";

let transporter = null;

// Set SMTP_DEBUG=true to print the full SMTP conversation (transcript) to the console.
const smtpDebug = /^(1|true|yes)$/i.test(String(process.env.SMTP_DEBUG || ""));

export function isEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: smtpDebug,
    debug: smtpDebug,
  });

  return transporter;
}

// Verifies the SMTP connection/credentials and prints the outcome. Useful for diagnosing login-link delivery.
export async function verifyEmailConnection() {
  if (!isEmailConfigured()) {
    console.warn("[email] SMTP not configured: SMTP_USER/SMTP_PASS are missing.");
    return { ok: false, reason: "Email is not configured on the server." };
  }
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  try {
    await getTransporter().verify();
    console.log(`[email] SMTP connection OK -> ${host}:${port} as ${process.env.SMTP_USER}`);
    return { ok: true };
  } catch (error) {
    console.error(`[email] SMTP verify FAILED -> ${host}:${port}:`, error);
    return { ok: false, reason: error.message };
  }
}

// Builds a nodemailer-compatible logger that captures every line into `lines` (for on-screen display).
function createCaptureLogger(lines) {
  const format = (message, args) => {
    let i = 0;
    return String(message).replace(/%[sdjoO%]/g, (token) => {
      if (token === "%%") return "%";
      const value = args[i++];
      if (token === "%j" || token === "%o" || token === "%O") {
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }
      return String(value);
    });
  };
  const write = (level) => (entry, message, ...args) => {
    const text = message === undefined ? "" : format(message, args);
    const time = new Date().toISOString().slice(11, 23);
    lines.push(`${time} ${level.padEnd(5)} ${text}`);
  };
  const logger = {
    level: () => {},
    trace: write("TRACE"),
    debug: write("DEBUG"),
    info: write("INFO"),
    warn: write("WARN"),
    error: write("ERROR"),
    fatal: write("FATAL"),
  };
  logger.child = () => logger;
  return logger;
}

// Runs SMTP verify + an optional test send, capturing the full SMTP transcript for on-screen display.
export async function runEmailDiagnostics({ to, token, baseUrl } = {}) {
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const config = {
    configured: isEmailConfigured(),
    host,
    port,
    secure: port === 465,
    user: process.env.SMTP_USER || null,
    from: process.env.SMTP_FROM || process.env.SMTP_USER || null,
  };
  const transcript = [];

  if (!config.configured) {
    return {
      config,
      verify: { ok: false, reason: "Email is not configured (SMTP_USER/SMTP_PASS missing)." },
      testSend: null,
      transcript,
    };
  }

  const testTransporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    logger: createCaptureLogger(transcript),
    debug: true,
  });

  let verify;
  try {
    await testTransporter.verify();
    verify = { ok: true };
  } catch (error) {
    verify = { ok: false, reason: error.message };
  }

  let testSend = null;
  if (to) {
    const resolvedBaseUrl = String(baseUrl || appBaseUrl).replace(/\/$/, "");
    const loginUrl = `${resolvedBaseUrl}/api/auth/verify-link?token=${encodeURIComponent(token || "test-token")}`;
    try {
      const info = await testTransporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: "Nova Bodyworks — SMTP test email",
        text: `This is a test email confirming SMTP delivery works.\n\nSample login link: ${loginUrl}`,
        html: `<div style="font-family:Arial,sans-serif">
          <p>This is a <strong>test email</strong> confirming SMTP delivery works.</p>
          <p>Sample login link: <a href="${loginUrl}">${loginUrl}</a></p>
        </div>`,
      });
      testSend = {
        sent: true,
        messageId: info.messageId,
        response: info.response,
        accepted: info.accepted,
        rejected: info.rejected,
      };
    } catch (error) {
      testSend = { sent: false, reason: error.message };
    }
  }

  testTransporter.close();
  return { config, verify, testSend, transcript };
}

export async function sendQuoteRequestEmail({ subject, text, html, attachments }) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: "Email is not configured on the server." };
  }

  try {
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: quoteRecipient,
      subject,
      text,
      html,
      attachments,
    });
    console.log(
      `[email] Quote request sent -> messageId=${info.messageId} response=${info.response} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)}`,
    );
    return { sent: true };
  } catch (error) {
    console.error("[email] Failed to send quote request email:", error);
    return { sent: false, reason: `Email delivery failed: ${error.message}` };
  }
}

export async function sendLoginLinkEmail({ to, token, baseUrl }) {
  if (!isEmailConfigured()) {
    return { sent: false, reason: "Email is not configured on the server." };
  }

  const resolvedBaseUrl = String(baseUrl || appBaseUrl).replace(/\/$/, "");
  const loginUrl = `${resolvedBaseUrl}/api/auth/verify-link?token=${encodeURIComponent(token)}`;

  console.log(`[email] Sending login link to=${to} via ${process.env.SMTP_HOST || "smtp.gmail.com"}:${Number(process.env.SMTP_PORT || 465)}`);

  try {
    const info = await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: "Your Nova Bodyworks login link",
      text: `Use this secure login link: ${loginUrl}\n\nThis link expires in 15 minutes.`,
      html: `<div style="font-family:Arial,sans-serif">
        <p>Use this secure login link:</p>
        <p><a href="${loginUrl}">${loginUrl}</a></p>
        <p>This link expires in 15 minutes.</p>
      </div>`,
    });
    console.log(
      `[email] Login link sent -> messageId=${info.messageId} response=${info.response} accepted=${JSON.stringify(info.accepted)} rejected=${JSON.stringify(info.rejected)}`,
    );
    return { sent: true };
  } catch (error) {
    console.error("[email] Failed to send login link email:", error);
    return { sent: false, reason: `Email delivery failed: ${error.message}` };
  }
}
