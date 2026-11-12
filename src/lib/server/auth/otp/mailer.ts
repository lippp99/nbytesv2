import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { maskEmail } from "@/lib/auth/auth-contract";
import { type SmtpConfig, authEnv } from "../auth-env";
import { type MailKind, authEmailContent } from "./auth-email";

const SEND_TIMEOUT_MS = 10_000; // PRD §12.2

let transporter: Transporter | undefined;

function smtpTransport(smtp: SmtpConfig): Transporter {
  return (transporter ??= nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure, // true: TLS from the start (port 465)
    requireTLS: !smtp.secure, // otherwise STARTTLS is mandatory, so the password never goes out in clear text
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: SEND_TIMEOUT_MS,
    greetingTimeout: SEND_TIMEOUT_MS,
    socketTimeout: SEND_TIMEOUT_MS,
  }));
}

/** The one place that talks to the email provider; throwing here makes step 1 answer 503 unavailable. */
export async function sendAuthEmail(to: string, kind: MailKind, code?: string): Promise<void> {
  const mail = authEmailContent(kind, code);
  const { smtp, emailFrom } = authEnv();
  if (!smtp) {
    // Dev console mailer (auth-env allows it only with NODE_ENV=development).
    console.info(`[auth-mail] to=${maskEmail(to)} subject="${mail.subject}"\n${mail.text}`);
    return;
  }
  await smtpTransport(smtp).sendMail({ from: emailFrom, to, subject: mail.subject, text: mail.text, html: mail.html });
}
