import { config } from '@/config'
import { ConsoleEmailAdapter } from '@/infra/adapters/console-email'
import { NodemailerAdapter } from '@/infra/adapters/nodemailer'

export function createEmailService() {
  if (config.smtp.SMTP_HOST) {
    return new NodemailerAdapter()
  }
  return new ConsoleEmailAdapter()
}
