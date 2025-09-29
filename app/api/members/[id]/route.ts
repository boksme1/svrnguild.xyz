import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { MemberRole } from '@prisma/client';
import { addMemberRolePeriod, getCurrentMemberRole } from '@/lib/role-timeline';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);
    
    const { name, role, promotionDate, demotionDate, roleChangeReason } = await request.json();

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (promotionDate !== undefined) updateData.promotionDate = promotionDate ? new Date(promotionDate) : null;
    if (demotionDate !== undefined) updateData.demotionDate = demotionDate ? new Date(demotionDate) : null;

    // Handle role changes through role history system
    if (role !== undefined) {
      const currentRole = await getCurrentMemberRole(params.id);
      if (currentRole !== role) {
        // Role is changing - add new role period
        await addMemberRolePeriod(
          params.id,
          role as MemberRole,
          new Date(), // Start now
          null, // No end date (currently active)
          roleChangeReason || `Role changed to ${role}`
        );
      }
      updateData.role = role as MemberRole;
    }

    const member = await prisma.member.update({
      where: { id: params.id },
      data: updateData,
      include: {
        attendances: {
          orderBy: { week: 'desc' },
          take: 10
        },
        salaries: {
          include: {
            lootItem: true
          }
        },
        roleHistory: {
          orderBy: { startDate: 'desc' }
        }
      }
    });

    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    requireAdmin(request);
    
    await prisma.member.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Failed to delete member' }, { status: 500 });
  }
}