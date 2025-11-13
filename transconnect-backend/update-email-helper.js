require('dotenv').config();

async function updateEmailIfExists(oldEmail, newEmail) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Check if the old email exists
    const existingUser = await prisma.user.findFirst({
      where: {
        email: oldEmail
      }
    });
    
    if (!existingUser) {
      console.log(`❌ User with email ${oldEmail} not found`);
      return false;
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
        email: newEmail
      }
    });
    
    console.log('✅ Successfully updated user email to:', updatedUser.email);
    return true;
    
  } catch (error) {
    console.error('❌ Error updating user email:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Usage: node update-email-helper.js "old@email.com" "new@email.com"
const oldEmail = process.argv[2];
const newEmail = process.argv[3];

if (!oldEmail || !newEmail) {
  console.log('Usage: node update-email-helper.js "old@email.com" "new@email.com"');
  console.log('Example: node update-email-helper.js "stephen@3bs.ltd" "stephen@mails.3bs.ltd"');
  process.exit(1);
}

updateEmailIfExists(oldEmail, newEmail).catch(console.error);