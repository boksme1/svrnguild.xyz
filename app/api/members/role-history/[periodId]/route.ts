import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateMemberRolePeriod, deleteMemberRolePeriod } from '@/lib/role-timeline';
import { MemberRole } from '@prisma/client';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
interface RouteParams {
  params: { periodId: string };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  // Handle build-time execution when database isn't available
  if (typeof window === 'undefined' && !process.env.DATABASE_URL) {
    return NextResponse.json({ error: 'Service not available during build' }, { status: 503 });
  }

  try {
    requireAdmin(request);
    
    const { role, startDate, endDate, reason } = await request.json();

    const updates: {
      role?: MemberRole;
      startDate?: Date;
      endDate?: Date | null;
      reason?: string;
    } = {};

    if (role) updates.role = role as MemberRole;
    if (startDate) updates.startDate = new Date(startDate);
    if (endDate !== undefined) updates.endDate = endDate ? new Date(endDate) : null;
    if (reason !== undefined) updates.reason = reason;

    await updateMemberRolePeriod(params.periodId, updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update role period' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    requireAdmin(request);
    
    await deleteMemberRolePeriod(params.periodId);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete role period' }, { status: 500 });
  }
}