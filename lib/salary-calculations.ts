import { prisma } from './db';
import { MemberRole, LootStatus } from '@prisma/client';
import { getMemberRoleAtDate } from './role-timeline';

interface ParticipationData {
  memberId: string;
  memberName: string;
  role: MemberRole;
  promotionDate: Date | null;
  demotionDate: Date | null;
}

interface LootItemData {
  id: string;
  value: number;
  dateAcquired: Date;
  participations: ParticipationData[];
}

export async function calculateGlobalSalaries() {
  try {
    const soldItems = await prisma.lootItem.findMany({
      where: { status: LootStatus.SOLD },
      include: {
        participations: {
          include: {
            member: true
          }
        }
      }
    });

    // Clear existing salaries for sold items
    await prisma.salary.deleteMany({
      where: {
        lootItem: {
          status: LootStatus.SOLD
        }
      }
    });

    const salariesToCreate: Array<{
      memberId: string;
      lootItemId: string;
      amount: number;
    }> = [];
    let totalLootValue = 0;
    let totalDistributed = 0;
    let guildFund = 0;
    let adminFee = 0;

    for (const item of soldItems) {
      totalLootValue += item.value;

      const eligibleMembers: ParticipationData[] = [];
      
      for (const participation of item.participations) {
        const roleAtDate = await getMemberRoleAtDate(participation.member.id, item.dateAcquired);
        if (roleAtDate) {
          const memberData = {
            memberId: participation.member.id,
            memberName: participation.member.name,
            role: roleAtDate,
            promotionDate: participation.member.promotionDate,
            demotionDate: participation.member.demotionDate
          };
          
          if (isEligibleForSalary(memberData, item.dateAcquired)) {
            eligibleMembers.push(memberData);
          }
        }
      }

      // Add Guild Master if not already participating
      // Find who was Guild Master at the time of loot acquisition
      const allMembers = await prisma.member.findMany();
      let guildMasterAtDate: ParticipationData | null = null;
      
      for (const member of allMembers) {
        const roleAtDate = await getMemberRoleAtDate(member.id, item.dateAcquired);
        if (roleAtDate === MemberRole.GUILD_MASTER) {
          guildMasterAtDate = {
            memberId: member.id,
            memberName: member.name,
            role: MemberRole.GUILD_MASTER,
            promotionDate: member.promotionDate,
            demotionDate: member.demotionDate
          };
          break;
        }
      }

      if (guildMasterAtDate && !eligibleMembers.some(m => m.memberId === guildMasterAtDate.memberId)) {
        eligibleMembers.push(guildMasterAtDate);
      }

      if (eligibleMembers.length > 0) {
        const salaryPerMember = Math.floor(item.value / eligibleMembers.length);
        const remainder = item.value - (salaryPerMember * eligibleMembers.length);

        for (const member of eligibleMembers) {
          salariesToCreate.push({
            memberId: member.memberId,
            lootItemId: item.id,
            amount: salaryPerMember
          });
        }

        totalDistributed += salaryPerMember * eligibleMembers.length;
        guildFund += remainder;
      }
    }

    // Create all salaries
    if (salariesToCreate.length > 0) {
      await prisma.salary.createMany({
        data: salariesToCreate
      });
    }

    // Update guild financials
    await prisma.guildFinancials.upsert({
      where: { id: 'main' },
      create: {
        id: 'main',
        totalLootValue,
        totalDistributed,
        guildFund,
        adminFee
      },
      update: {
        totalLootValue,
        totalDistributed,
        guildFund,
        adminFee
      }
    });

    return {
      totalLootValue,
      totalDistributed,
      guildFund,
      adminFee,
      itemsProcessed: soldItems.length,
      salariesCreated: salariesToCreate.length
    };
  } catch (error) {
    console.error('Salary calculation error:', error);
    throw error;
  }
}

// This function is now imported from role-timeline.ts and uses the new role history system

function isEligibleForSalary(member: ParticipationData, lootDate: Date): boolean {
  // Guild Master always gets salary
  if (member.role === MemberRole.GUILD_MASTER) {
    return true;
  }

  // Core and Members only get salary if they participated
  return member.role === MemberRole.CORE || member.role === MemberRole.MEMBER;
}

export async function syncAttendance() {
  try {
    // Get all loot items from current week
    const currentWeek = getCurrentWeek();
    
    const currentWeekItems = await prisma.lootItem.findMany({
      where: {
        dateAcquired: {
          gte: getWeekStart(currentWeek),
          lte: getWeekEnd(currentWeek)
        }
      },
      include: {
        participations: {
          include: {
            member: true
          }
        }
      }
    });

    // Track attendance for all participants
    const attendanceUpdates: any[] = [];
    const participantIds = new Set<string>();

    for (const item of currentWeekItems) {
      for (const participation of item.participations) {
        participantIds.add(participation.member.id);
      }
    }

    // Update attendance for all participants
    for (const memberId of Array.from(participantIds)) {
      attendanceUpdates.push(
        prisma.attendance.upsert({
          where: {
            memberId_week: {
              memberId,
              week: currentWeek
            }
          },
          create: {
            memberId,
            week: currentWeek,
            attended: true
          },
          update: {
            attended: true
          }
        })
      );
    }

    await Promise.all(attendanceUpdates);

    return {
      weekProcessed: currentWeek,
      attendanceRecorded: participantIds.size
    };
  } catch (error) {
    console.error('Attendance sync error:', error);
    throw error;
  }
}

function getCurrentWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  const onejan = new Date(year, 0, 1);
  const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7);
  return `${year}-${week.toString().padStart(2, '0')}`;
}

function getWeekStart(week: string): Date {
  const [year, weekNum] = week.split('-').map(Number);
  const onejan = new Date(year, 0, 1);
  const days = (weekNum - 1) * 7 - onejan.getDay() + 1;
  return new Date(year, 0, 1 + days);
}

function getWeekEnd(week: string): Date {
  const start = getWeekStart(week);
  return new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
}