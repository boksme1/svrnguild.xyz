import { prisma } from './db';
import { hashPassword } from './auth';

export async function seedDatabase() {
  try {
    // Clear existing admin accounts for fresh setup
    await prisma.admin.deleteMany({});
    
    // Create admin accounts
    const adminAccounts = [
      { username: 'boksme', password: 'boksme123' },
      { username: 'carl1', password: 'carl123!' },
      { username: 'lem1', password: 'lemuel123!' },
      { username: 'bosstimer', password: 'timer123!' }
    ];

    for (const admin of adminAccounts) {
      await prisma.admin.create({
        data: {
          username: admin.username,
          password: hashPassword(admin.password)
        }
      });
      console.log(`✅ Admin account created: ${admin.username}`);
    }

    // Clear and create sample guild members
    await prisma.member.deleteMany({});
    
    const sampleMembers = [
      { name: 'Guild Master Boks', role: 'GUILD_MASTER' as const },
      { name: 'Carl Core', role: 'CORE' as const },
      { name: 'Lemuel Leader', role: 'CORE' as const },
      { name: 'Timer Boss', role: 'MEMBER' as const },
      { name: 'Shadow Warrior', role: 'MEMBER' as const },
      { name: 'Ice Mage', role: 'MEMBER' as const },
      { name: 'Fire Knight', role: 'MEMBER' as const },
      { name: 'Wind Archer', role: 'MEMBER' as const }
    ];

    for (const member of sampleMembers) {
      await prisma.member.create({
        data: {
          name: member.name,
          role: member.role
        }
      });
    }
    console.log(`✅ ${sampleMembers.length} sample members created`);

    // Clear and create sample bosses
    await prisma.boss.deleteMany({});
    
    const sampleBosses = [
      { name: 'Dragon King', type: 'NORMAL' as const, respawnTime: 120, lastKilled: new Date(Date.now() - 60 * 60 * 1000) }, // 1 hour ago
      { name: 'Ice Lord', type: 'NORMAL' as const, respawnTime: 180, lastKilled: new Date(Date.now() - 2 * 60 * 60 * 1000) }, // 2 hours ago
      { name: 'Shadow Beast', type: 'FIXED' as const, respawnTime: 360, lastKilled: new Date(Date.now() - 5 * 60 * 60 * 1000) }, // 5 hours ago
      { name: 'Fire Demon', type: 'NORMAL' as const, respawnTime: 90, lastKilled: null },
      { name: 'Wind Elemental', type: 'FIXED' as const, respawnTime: 240, lastKilled: new Date(Date.now() - 3 * 60 * 60 * 1000) }, // 3 hours ago
      { name: 'Earth Golem', type: 'NORMAL' as const, respawnTime: 150, lastKilled: new Date(Date.now() - 1 * 60 * 60 * 1000) } // 1 hour ago
    ];

    const createdBosses: any[] = [];
    for (const boss of sampleBosses) {
      const createdBoss = await prisma.boss.create({
        data: boss
      });
      createdBosses.push(createdBoss);
    }
    console.log(`✅ ${sampleBosses.length} sample bosses created`);

    // Clear and create sample loot items
    await prisma.lootItem.deleteMany({});
    await prisma.lootParticipation.deleteMany({});
    await prisma.salary.deleteMany({});

    const members = await prisma.member.findMany();
    const sampleLootItems = [
      { name: 'Dragon Scale Armor', value: 15000, bossId: createdBosses[0].id, status: 'SOLD' as const, participants: [members[0].id, members[1].id, members[4].id] },
      { name: 'Ice Shard Sword', value: 12000, bossId: createdBosses[1].id, status: 'SOLD' as const, participants: [members[0].id, members[2].id, members[5].id] },
      { name: 'Shadow Cloak', value: 8000, bossId: createdBosses[2].id, status: 'PENDING' as const, participants: [members[1].id, members[3].id, members[6].id] },
      { name: 'Fire Ruby', value: 20000, bossId: createdBosses[3].id, status: 'SOLD' as const, participants: [members[0].id, members[1].id, members[2].id, members[7].id] },
      { name: 'Wind Essence', value: 6000, bossId: createdBosses[4].id, status: 'SETTLED' as const, participants: [members[0].id, members[4].id] },
      { name: 'Earth Crystal', value: 10000, bossId: createdBosses[5].id, status: 'SOLD' as const, participants: [members[0].id, members[3].id, members[5].id, members[6].id] }
    ];

    for (const loot of sampleLootItems) {
      const createdLoot = await prisma.lootItem.create({
        data: {
          name: loot.name,
          value: loot.value,
          bossId: loot.bossId,
          status: loot.status,
          dateAcquired: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random date within last 7 days
        }
      });

      // Create participations
      for (const memberId of loot.participants) {
        await prisma.lootParticipation.create({
          data: {
            memberId,
            lootItemId: createdLoot.id
          }
        });
      }
    }
    console.log(`✅ ${sampleLootItems.length} sample loot items with participations created`);

    // Initialize guild financials
    await prisma.guildFinancials.deleteMany({});
    await prisma.guildFinancials.create({
      data: {
        id: 'main',
        totalLootValue: 0,
        totalDistributed: 0,
        guildFund: 0,
        adminFee: 0
      }
    });
    console.log('✅ Guild financials initialized');

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
}