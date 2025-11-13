require('dotenv').config();

async function checkUsers() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // List all users to see what exists
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName} ${user.lastName} - ${user.email} (${user.id})`);
    });
    
    // Check for stephen specifically
    const stephenUsers = users.filter(u => 
      u.firstName?.toLowerCase().includes('stephen') || 
      u.email?.toLowerCase().includes('stephen') ||
      u.email?.includes('3bs')
    );
    
    if (stephenUsers.length > 0) {
      console.log('\n📧 Found Stephen-related users:');
      stephenUsers.forEach(user => {
        console.log(`- ${user.firstName} ${user.lastName} - ${user.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers().catch(console.error);