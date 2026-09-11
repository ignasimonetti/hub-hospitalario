import jwt from 'jsonwebtoken'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is missing in production');
    }
    return 'insecure-dev-only-jwt-secret-do-not-use-in-production';
  }
  return secret;
}

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
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '1h' })
}

export function verifyEmailConfirmationToken(token: string): EmailConfirmationPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any
    
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