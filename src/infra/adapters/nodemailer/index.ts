import nodemailer from 'nodemailer'
import { config } from '@/config'
import type { EmailService } from '@/infra/ports/email'

export class NodemailerAdapter implements EmailService {
  private transporter = nodemailer.createTransport({
    host: config.smtp.SMTP_HOST,
    port: config.smtp.SMTP_PORT,
    auth:
      config.smtp.SMTP_USER
        ? { user: config.smtp.SMTP_USER, pass: config.smtp.SMTP_PASS }
        : undefined,
  })

  async sendMagicLink(to: string, link: string): Promise<void> {
    await this.transporter.sendMail({
      from: config.smtp.SMTP_FROM,
      to,
      subject: 'Your Cervo sign-in link',
      text: `Sign in to Cervo: ${link}\n\nThis link expires in 15 minutes.`,
      html: `<p>Click <a href="${link}">here</a> to sign in to Cervo.</p><p>This link expires in 15 minutes.</p>`,
    })
  }
}
