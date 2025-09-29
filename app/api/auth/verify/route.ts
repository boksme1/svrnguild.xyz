import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  // Handle build-time execution
  if (typeof window === 'undefined' && !process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Service not available during build' }, { status: 503 });
  }

  try {
    const admin = getAdminFromRequest(request);
    
    if (!admin) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json({ admin });
  } catch (error) {
    return NextResponse.json({ error: 'Token verification failed' }, { status: 500 });
  }
}