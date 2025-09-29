const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function initializeRoleHistory() {
  try {
    console.log('🚀 Initializing role history for existing members...');
    
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
            reason: 'Initial role assignment during migration'
          }
        });
        console.log(`✅ Created role history for ${member.name} (${member.role})`);
      } else {
        console.log(`⏭️  Skipped ${member.name} - already has role history`);
      }
    }

    console.log('🎉 Role history initialization completed successfully!');
  } catch (error) {
    console.error('❌ Role history initialization failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

initializeRoleHistory().catch(console.error);