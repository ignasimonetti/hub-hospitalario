import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'hub-hospitalario-secret-key-2024'

export interface EmailConfirmationPayload {
  userId: string
  email: string
  type: 'email_confirmation'
  iat?: number
  exp?: number
}

export function generateEmailConfirmationToken(userId: string, email: string): string {
  const payload: EmailConfirmationPayload = {
    userId,
    email,
    type: 'email_confirmation'
  }

  // Token expires in 1 hour
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' })
}

export function verifyEmailConfirmationToken(token: string): EmailConfirmationPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Ensure it's the correct type of token and is an object
    if (!decoded || typeof decoded !== 'object' || decoded.type !== 'email_confirmation') {
      return null
    }
    
    return decoded as EmailConfirmationPayload
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as EmailConfirmationPayload
    if (!decoded || !decoded.exp) return true
    
    const now = Date.now() / 1000
    return decoded.exp < now
  } catch (error) {
    return true
  }
}