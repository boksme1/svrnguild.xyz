import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { calculateGlobalSalaries } from '@/lib/salary-calculations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  // Handle build-time execution when database isn't available
  if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Service not available during build' }, { status: 503 });
  }

  try {
    requireAdmin(request);
    
    const result = await calculateGlobalSalaries();
    
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to recalculate salaries' }, { status: 500 });
  }
}