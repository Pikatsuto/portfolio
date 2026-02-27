import nodemailer from "nodemailer";

const host = import.meta.env.SMTP_HOST;
const port = Number(import.meta.env.SMTP_PORT) || 587;
const user = import.meta.env.SMTP_USER;
const pass = import.meta.env.SMTP_PASS;
const contactEmail = import.meta.env.CONTACT_EMAIL;

const smtpConfigured = !!(host && user && pass && contactEmail);

const transporter = smtpConfigured
  ? nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } })
  : null;

export async function sendContactEmail(
  name: string,
  email: string,
  subject: string,
  message: string,
): Promise<void> {
  if (!transporter) {
    console.warn("[mail] SMTP not configured — skipping email send");
    return;
  }
  await transporter.sendMail({
    from: `"${name}" <${user}>`,
    replyTo: email,
    to: contactEmail,
    subject: `[Contact] ${subject}`,
    text: `De : ${name} (${email})\n\n${message}`,
  });
}
