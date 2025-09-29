import { NextRequest, NextResponse } from 'next/server';
import { getAdminFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
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