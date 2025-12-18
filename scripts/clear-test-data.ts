import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes('?') ? '&' : '?') + 'pgbouncer=true&statement_cache_size=0'
    }
  }
});

async function clearTestData() {
  try {
    console.log('Starting database cleanup...');

    // Delete all test users and their related data
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { id: { startsWith: 'test-' } },
          { email: { contains: 'test' } }
        ]
      },
      select: { id: true, email: true }
    });

    console.log(`Found ${testUsers.length} test users to delete`);

    for (const user of testUsers) {
      console.log(`Deleting data for user: ${user.email} (${user.id})`);
      
      // Cascade delete will handle related records due to schema onDelete: Cascade
      await prisma.user.delete({
        where: { id: user.id }
      });
    }

    console.log('✅ Test data cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing test data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestData();
