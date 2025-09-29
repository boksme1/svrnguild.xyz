const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...');
    
    // Clear existing data
    await prisma.lootParticipation.deleteMany({});
    await prisma.salary.deleteMany({});
    await prisma.lootItem.deleteMany({});
    await prisma.boss.deleteMany({});
    await prisma.member.deleteMany({});
    await prisma.admin.deleteMany({});
    await prisma.guildFinancials.deleteMany({});
    
    console.log('✅ Cleared existing data');

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

    // Create guild members
    const sampleMembers = [
      { name: 'Aim1', role: 'GUILD_MASTER' },
      { name: 'Badjaina', role: 'CORE' },
      { name: 'Neeqs', role: 'CORE' },
      { name: 'Y4ts', role: 'CORE' },
      { name: 'Miyeira', role: 'CORE' },
      { name: 'Rudrestra', role: 'CORE' },
      { name: 'SW4G', role: 'CORE' },
      { name: 'VIOLAAAA', role: 'CORE' },
      { name: 'Papayax', role: 'CORE' },
      { name: 'MAXPA1N', role: 'MEMBER' },
      { name: 'Foolpierce', role: 'MEMBER' },
      { name: 'Arksha', role: 'MEMBER' },
      { name: 'RyomaEZ', role: 'MEMBER' },
      { name: 'tOonix', role: 'MEMBER' },
      { name: 'LucianWolf', role: 'MEMBER' },
      { name: 'Osaragili', role: 'MEMBER' },
      { name: 'Kyuu', role: 'MEMBER' },
      { name: 'Ayame', role: 'MEMBER' },
      { name: 'Ley', role: 'MEMBER' },
      { name: '帝EmpressQi', role: 'MEMBER' },
      { name: 'Shinese', role: 'MEMBER' },
      { name: 'Khryztynn', role: 'MEMBER' },
      { name: 'Deumong', role: 'MEMBER' },
      { name: 'MURDOCK', role: 'MEMBER' },
      { name: 'Patotoya', role: 'MEMBER' },
      { name: 'KillAndFlex', role: 'MEMBER' },
      { name: 'Nekron', role: 'MEMBER' },
      { name: 'Kristine', role: 'MEMBER' },
      { name: 'Mighty1', role: 'MEMBER' },
      { name: 'Madam', role: 'MEMBER' },
      { name: '惡MAD', role: 'MEMBER' },
      { name: 'VitaAurea', role: 'MEMBER' },
      { name: 'Kwann', role: 'MEMBER' },
      { name: 'Sheeesh', role: 'MEMBER' },
      { name: 'IndayBilao', role: 'MEMBER' },
      { name: 'Zumi', role: 'MEMBER' },
      { name: 'Spring', role: 'MEMBER' },
      { name: 'Lgcy', role: 'MEMBER' },
      { name: 'FrdcKen', role: 'MEMBER' },
      { name: 'ムワノロケェケモ', role: 'MEMBER' },
      { name: 'VeniRusuh', role: 'MEMBER' },
      { name: 'Manong', role: 'MEMBER' },
      { name: 'Likha', role: 'MEMBER' },
      { name: 'Cecilion', role: 'MEMBER' },
      { name: 'Mhajikera', role: 'MEMBER' },
      { name: 'Kride', role: 'MEMBER' }
    ];

    const createdMembers = [];
    for (const member of sampleMembers) {
      const created = await prisma.member.create({
        data: {
          name: member.name,
          role: member.role
        }
      });
      createdMembers.push(created);
    }
    console.log(`✅ ${sampleMembers.length} guild members created`);

    // Initialize role history for all members
    for (const member of createdMembers) {
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
    console.log(`✅ Role history initialized for all members`);

    // Create sample bosses
    const sampleBosses = [
      { name: 'Dragon King', type: 'NORMAL', respawnTime: 120, lastKilled: new Date(Date.now() - 60 * 60 * 1000) },
      { name: 'Ice Lord', type: 'NORMAL', respawnTime: 180, lastKilled: new Date(Date.now() - 2 * 60 * 60 * 1000) },
      { name: 'Shadow Beast', type: 'FIXED', respawnTime: 360, lastKilled: new Date(Date.now() - 5 * 60 * 60 * 1000) },
      { name: 'Fire Demon', type: 'NORMAL', respawnTime: 90, lastKilled: null },
      { name: 'Wind Elemental', type: 'FIXED', respawnTime: 240, lastKilled: new Date(Date.now() - 3 * 60 * 60 * 1000) },
      { name: 'Earth Golem', type: 'NORMAL', respawnTime: 150, lastKilled: new Date(Date.now() - 1 * 60 * 60 * 1000) }
    ];

    const createdBosses = [];
    for (const boss of sampleBosses) {
      const created = await prisma.boss.create({
        data: boss
      });
      createdBosses.push(created);
    }
    console.log(`✅ ${sampleBosses.length} sample bosses created`);

    // Create sample loot items
    const sampleLootItems = [
      { name: 'Dragon Scale Armor', value: 15000, bossId: createdBosses[0].id, status: 'SOLD', participants: [createdMembers[0].id, createdMembers[1].id, createdMembers[4].id] },
      { name: 'Ice Shard Sword', value: 12000, bossId: createdBosses[1].id, status: 'SOLD', participants: [createdMembers[0].id, createdMembers[2].id, createdMembers[5].id] },
      { name: 'Shadow Cloak', value: 8000, bossId: createdBosses[2].id, status: 'PENDING', participants: [createdMembers[1].id, createdMembers[3].id, createdMembers[6].id] },
      { name: 'Fire Ruby', value: 20000, bossId: createdBosses[3].id, status: 'SOLD', participants: [createdMembers[0].id, createdMembers[1].id, createdMembers[2].id, createdMembers[7].id] },
      { name: 'Wind Essence', value: 6000, bossId: createdBosses[4].id, status: 'SETTLED', participants: [createdMembers[0].id, createdMembers[4].id] },
      { name: 'Earth Crystal', value: 10000, bossId: createdBosses[5].id, status: 'SOLD', participants: [createdMembers[0].id, createdMembers[3].id, createdMembers[5].id, createdMembers[6].id] }
    ];

    for (const loot of sampleLootItems) {
      const createdLoot = await prisma.lootItem.create({
        data: {
          name: loot.name,
          value: loot.value,
          bossId: loot.bossId,
          status: loot.status,
          dateAcquired: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
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

    console.log('\n🎉 Database setup completed successfully!\n');
    console.log('📋 Login Credentials:');
    console.log('┌──────────────┬─────────────┐');
    console.log('│ Username     │ Password    │');
    console.log('├──────────────┼─────────────┤');
    console.log('│ boksme       │ boksme123   │');
    console.log('│ carl1        │ carl123!    │');
    console.log('│ lem1         │ lemuel123!  │');
    console.log('│ bosstimer    │ timer123!   │');
    console.log('└──────────────┴─────────────┘');
    console.log('\n🌐 Visit http://localhost:3000 to access the application');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase().catch(console.error);