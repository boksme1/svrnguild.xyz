import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { calculateGlobalSalaries } from '@/lib/salary-calculations';

export async function POST(request: NextRequest) {
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