import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { MemberRole } from '@prisma/client';
import { getMembersWithCurrentRoles, addMemberRolePeriod } from '@/lib/role-timeline';

export async function GET() {
  try {
    const members = await getMembersWithCurrentRoles();
    return NextResponse.json(members);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    requireAdmin(request);
    
    const { name, role, promotionDate, demotionDate, startDate, reason } = await request.json();

    if (!name || !role) {
      return NextResponse.json({ error: 'Name and role are required' }, { status: 400 });
    }

    const member = await prisma.member.create({
      data: {
        name,
        role: role as MemberRole,
        promotionDate: promotionDate ? new Date(promotionDate) : null,
        demotionDate: demotionDate ? new Date(demotionDate) : null
      }
    });

    // Add initial role history entry
    await addMemberRolePeriod(
      member.id,
      role as MemberRole,
      startDate ? new Date(startDate) : new Date(),
      null, // No end date for initial role
      reason || 'Initial member creation'
    );

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}