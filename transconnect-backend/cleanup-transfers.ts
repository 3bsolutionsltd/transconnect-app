/**
 * Cleanup Script: Remove pending/test transfers
 * Run with: npx ts-node cleanup-transfers.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanupTransfers() {
  try {
    console.log('🧹 Starting transfer cleanup...\n');

    // Show existing transfers first
    const existingTransfers = await prisma.bookingTransfer.findMany({
      include: {
        booking: {
          select: {
            id: true,
            status: true,
          },
        },
        fromRoute: {
          select: {
            origin: true,
            destination: true,
          },
        },
        toRoute: {
          select: {
            origin: true,
            destination: true,
          },
        },
      },
      orderBy: {
        requestedAt: 'desc',
      },
    });

    console.log(`📊 Found ${existingTransfers.length} existing transfers:\n`);
    
    existingTransfers.forEach((transfer, index) => {
      console.log(`${index + 1}. Transfer ID: ${transfer.id}`);
      console.log(`   Booking: ${transfer.bookingId}`);
      console.log(`   Status: ${transfer.status}`);
      console.log(`   From: ${transfer.fromRoute.origin} → ${transfer.fromRoute.destination}`);
      console.log(`   To: ${transfer.toRoute.origin} → ${transfer.toRoute.destination}`);
      console.log(`   Requested: ${transfer.requestedAt.toLocaleString()}`);
      console.log('');
    });

    // Delete all transfers (or just PENDING ones)
    const choice = process.argv[2] || 'pending';
    
    if (choice === 'all') {
      console.log('⚠️  Deleting ALL transfers...');
      const result = await prisma.bookingTransfer.deleteMany({});
      console.log(`✅ Deleted ${result.count} transfers\n`);
    } else {
      console.log('⚠️  Deleting PENDING transfers only...');
      const result = await prisma.bookingTransfer.deleteMany({
        where: {
          status: 'PENDING',
        },
      });
      console.log(`✅ Deleted ${result.count} pending transfers\n`);
    }

    // Show remaining transfers
    const remainingTransfers = await prisma.bookingTransfer.findMany({});
    console.log(`📊 Remaining transfers: ${remainingTransfers.length}\n`);

    console.log('✅ Cleanup complete!');
    console.log('\n💡 Next steps:');
    console.log('1. Refresh the Bookings page in your browser');
    console.log('2. Transfer badges should be gone from bookings');
    console.log('3. You can now retry Test 1.5 (transfer without auto-approve)');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupTransfers();

console.log('\n📝 Usage:');
console.log('  npx ts-node cleanup-transfers.ts          # Delete PENDING transfers only');
console.log('  npx ts-node cleanup-transfers.ts all      # Delete ALL transfers');
