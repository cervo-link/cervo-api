import type { EmailService } from '@/infra/ports/email'

export class ConsoleEmailAdapter implements EmailService {
  async sendMagicLink(to: string, link: string): Promise<void> {
    console.info('[ConsoleEmailAdapter] Magic link for %s:\n  %s', to, link)
  }
}
