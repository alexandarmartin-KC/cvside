import { NextResponse } from 'next/server';

export async function GET() {
  const hasDatabaseUrl = !!process.env.DATABASE_URL;
  const hasNextAuthSecret = !!process.env.NEXTAUTH_SECRET;
  const hasNextAuthUrl = !!process.env.NEXTAUTH_URL;
  
  return NextResponse.json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    database: hasDatabaseUrl ? 'configured' : 'missing',
    auth: {
      secret: hasNextAuthSecret ? 'configured' : 'missing',
      url: hasNextAuthUrl ? 'configured' : 'missing',
    },
  });
}
