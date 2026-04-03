import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Delete pending transfers
  const result = await prisma.bookingTransfer.deleteMany({
    where: {
      status: 'PENDING',
    },
  });
  
  console.log(`Deleted ${result.count} pending transfers`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
