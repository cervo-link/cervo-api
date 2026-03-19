import { SignJWT, jwtVerify } from 'jose'
import { config } from '@/config'

const secret = new TextEncoder().encode(config.jwt.JWT_SECRET)

export async function signAccessToken(memberId: string): Promise<string> {
  return new SignJWT({ memberId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(config.jwt.JWT_ACCESS_EXPIRES_IN)
    .sign(secret)
}

export async function verifyAccessToken(token: string): Promise<{ memberId: string }> {
  const { payload } = await jwtVerify(token, secret)
  return { memberId: payload.memberId as string }
}
