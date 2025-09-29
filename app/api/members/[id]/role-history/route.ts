import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getMemberRoleHistory, addMemberRolePeriod } from '@/lib/role-timeline';
import { MemberRole } from '@prisma/client';

export const dynamic = 'force-dynamic';
interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const roleHistory = await getMemberRoleHistory(params.id);
    return NextResponse.json(roleHistory);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch role history' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    requireAdmin(request);
    
    const { role, startDate, endDate, reason } = await request.json();

    if (!role || !startDate) {
      return NextResponse.json({ error: 'Role and start date are required' }, { status: 400 });
    }

    await addMemberRolePeriod(
      params.id,
      role as MemberRole,
      new Date(startDate),
      endDate ? new Date(endDate) : null,
      reason
    );

    const updatedHistory = await getMemberRoleHistory(params.id);
    return NextResponse.json(updatedHistory);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to add role period' }, { status: 500 });
  }
}