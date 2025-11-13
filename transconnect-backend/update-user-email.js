require('dotenv').config();

async function updateUserEmail() {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // First check if the user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: 'stephen@3bs.ltd'
      }
    });
    
    if (!existingUser) {
      console.log('❌ User with email stephen@3bs.ltd not found');
      return;
    }
    
    console.log('✅ Found user:', {
      id: existingUser.id,
      name: `${existingUser.firstName} ${existingUser.lastName}`,
      currentEmail: existingUser.email
    });
    
    // Update the email
    const updatedUser = await prisma.user.update({
      where: {
        id: existingUser.id
      },
      data: {
        email: 'stephen@mails.3bs.ltd'
      }
    });
    
    console.log('✅ Successfully updated user email to:', updatedUser.email);
    
  } catch (error) {
    console.error('❌ Error updating user email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserEmail().catch(console.error);