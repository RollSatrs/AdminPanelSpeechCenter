import "server-only";

import nodemailer from "nodemailer";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

const transporter = nodemailer.createTransport({
  host: requireEnv("SMTP_HOST"),
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: process.env.SMTP_SECURE !== "false",
  auth: {
    user: requireEnv("SMTP_USER"),
    pass: requireEnv("SMTP_PASS"),
  },
});

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  await transporter.sendMail({
    from: requireEnv("MAIL_FROM"),
    to: email,
    subject: "Сброс пароля SOZLAB",
    html: `
      <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 12px;font-size:22px">Сброс пароля</h2>
        <p style="margin:0 0 16px">Вы запросили восстановление доступа в административную панель SOZLAB.</p>
        <p style="margin:0 0 24px">
          <a
            href="${resetUrl}"
            style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600"
          >
            Сбросить пароль
          </a>
        </p>
        <p style="margin:0 0 12px;color:#4b5563">Ссылка действует 30 минут.</p>
        <p style="margin:0;color:#6b7280">Если это были не вы, просто проигнорируйте письмо.</p>
      </div>
    `,
  });
}
