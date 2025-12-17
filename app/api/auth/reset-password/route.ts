import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { createSession } from '@/lib/auth-session';
import { z } from 'zod';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const result = resetPasswordSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0].message },
        { status: 400 }
      );
    }

    const { token: rawToken, newPassword } = result.data;

    // Find all non-expired reset tokens
    const resetTokens = await prisma.passwordResetToken.findMany({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
      include: { user: true },
    });

    // Check each token hash to find a match
    let matchedToken = null;
    for (const resetToken of resetTokens) {
      const isMatch = await bcrypt.compare(rawToken, resetToken.tokenHash);
      if (isMatch) {
        matchedToken = resetToken;
        break;
      }
    }

    if (!matchedToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: matchedToken.userId },
      data: { passwordHash },
    });

    // Delete all reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: matchedToken.userId },
    });

    // Auto-login user by creating session
    await createSession(matchedToken.userId);

    return NextResponse.json({ 
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    );
  }
}
