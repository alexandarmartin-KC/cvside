import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/email';
import { randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// In-memory rate limiting (basic MVP)
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 3;

function checkRateLimit(email: string): boolean {
  const now = Date.now();
  const attempts = rateLimitMap.get(email) || 0;
  
  // Clean up old entries
  if (attempts && now - attempts > RATE_LIMIT_WINDOW) {
    rateLimitMap.delete(email);
    return true;
  }
  
  if (attempts >= MAX_REQUESTS) {
    return false;
  }
  
  rateLimitMap.set(email, (attempts || 0) + 1);
  return true;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = forgotPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Rate limiting
    if (!checkRateLimit(email)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Always return success to prevent user enumeration
    // But only send email if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.passwordHash) {
      // Generate random token (32 bytes = 64 hex characters)
      const rawToken = randomBytes(32).toString('hex');
      
      // Hash token before storing
      const tokenHash = await bcrypt.hash(rawToken, 10);
      
      // Delete any existing reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });
      
      // Create new reset token (expires in 30 minutes)
      await prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        },
      });
      
      // Send email with raw token
      await sendPasswordResetEmail(email, rawToken);
    }

    // Always return success (don't leak user existence)
    return NextResponse.json({ 
      success: true,
      message: 'If an account exists with that email, we sent a password reset link.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
