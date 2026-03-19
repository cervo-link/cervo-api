export interface EmailService {
  sendMagicLink(to: string, link: string): Promise<void>
}
