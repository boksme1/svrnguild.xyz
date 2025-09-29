import { prisma } from './db';
import { MemberRole } from '@prisma/client';

export interface RolePeriod {
  id: string;
  role: MemberRole;
  startDate: Date;
  endDate: Date | null;
  reason?: string;
}

/**
 * Get the active role for a member at a specific date
 */
export async function getMemberRoleAtDate(memberId: string, date: Date): Promise<MemberRole | null> {
  const roleHistory = await prisma.memberRoleHistory.findFirst({
    where: {
      memberId,
      startDate: { lte: date },
      OR: [
        { endDate: null }, // Currently active
        { endDate: { gte: date } } // Was active at that date
      ]
    },
    orderBy: { startDate: 'desc' }
  });

  return roleHistory?.role || null;
}

/**
 * Get the current active role for a member
 */
export async function getCurrentMemberRole(memberId: string): Promise<MemberRole | null> {
  return getMemberRoleAtDate(memberId, new Date());
}

/**
 * Get all role periods for a member
 */
export async function getMemberRoleHistory(memberId: string): Promise<RolePeriod[]> {
  const roleHistory = await prisma.memberRoleHistory.findMany({
    where: { memberId },
    orderBy: { startDate: 'asc' }
  });

  return roleHistory.map(history => ({
    id: history.id,
    role: history.role,
    startDate: history.startDate,
    endDate: history.endDate,
    reason: history.reason || undefined
  }));
}

/**
 * Add a new role period for a member
 */
export async function addMemberRolePeriod(
  memberId: string, 
  role: MemberRole, 
  startDate: Date, 
  endDate: Date | null = null,
  reason?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // End any currently active role period if this new period starts now or in the past
    if (startDate <= new Date()) {
      await tx.memberRoleHistory.updateMany({
        where: {
          memberId,
          endDate: null // Currently active
        },
        data: {
          endDate: new Date(startDate.getTime() - 1) // End 1ms before new role starts
        }
      });
    }

    // Create the new role period
    await tx.memberRoleHistory.create({
      data: {
        memberId,
        role,
        startDate,
        endDate,
        reason
      }
    });

    // Update the member's current role field
    const currentRole = await getCurrentMemberRole(memberId);
    if (currentRole) {
      await tx.member.update({
        where: { id: memberId },
        data: { role: currentRole }
      });
    }
  });
}

/**
 * Update a role period
 */
export async function updateMemberRolePeriod(
  periodId: string,
  updates: {
    role?: MemberRole;
    startDate?: Date;
    endDate?: Date | null;
    reason?: string;
  }
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const period = await tx.memberRoleHistory.findUnique({
      where: { id: periodId },
      select: { memberId: true }
    });

    if (!period) throw new Error('Role period not found');

    await tx.memberRoleHistory.update({
      where: { id: periodId },
      data: updates
    });

    // Update the member's current role field
    const currentRole = await getCurrentMemberRole(period.memberId);
    if (currentRole) {
      await tx.member.update({
        where: { id: period.memberId },
        data: { role: currentRole }
      });
    }
  });
}

/**
 * Delete a role period
 */
export async function deleteMemberRolePeriod(periodId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const period = await tx.memberRoleHistory.findUnique({
      where: { id: periodId },
      select: { memberId: true }
    });

    if (!period) throw new Error('Role period not found');

    await tx.memberRoleHistory.delete({
      where: { id: periodId }
    });

    // Update the member's current role field
    const currentRole = await getCurrentMemberRole(period.memberId);
    if (currentRole) {
      await tx.member.update({
        where: { id: period.memberId },
        data: { role: currentRole }
      });
    }
  });
}

/**
 * Initialize role history for existing members (migration helper)
 */
export async function initializeMemberRoleHistory(): Promise<void> {
  const members = await prisma.member.findMany();
  
  for (const member of members) {
    // Check if this member already has role history
    const existingHistory = await prisma.memberRoleHistory.count({
      where: { memberId: member.id }
    });

    if (existingHistory === 0) {
      // Create initial role history entry
      await prisma.memberRoleHistory.create({
        data: {
          memberId: member.id,
          role: member.role,
          startDate: member.createdAt,
          endDate: null, // Currently active
          reason: 'Initial role assignment'
        }
      });
    }
  }
}

/**
 * Get members with their current roles (including from role history)
 */
export async function getMembersWithCurrentRoles() {
  const members = await prisma.member.findMany({
    include: {
      roleHistory: {
        where: { endDate: null }, // Only active role periods
        orderBy: { startDate: 'desc' },
        take: 1
      },
      participations: {
        include: {
          lootItem: true
        }
      },
      attendances: true,
      salaries: {
        include: {
          lootItem: true
        }
      }
    }
  });

  return members.map(member => ({
    ...member,
    currentRole: member.roleHistory[0]?.role || member.role
  }));
}