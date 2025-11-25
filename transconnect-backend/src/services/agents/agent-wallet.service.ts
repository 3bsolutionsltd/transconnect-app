import { prisma } from '../../index';

class WalletService {
  static async createWallet(agentId: string) {
    return prisma.agentWallet.create({ data: { agentId } });
  }

  static async credit(agentId: string, amount: number) {
    const wallet = await prisma.agentWallet.findUnique({ where: { agentId } });
    if (!wallet) throw new Error('Wallet not found');

    await prisma.agentTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount,
      },
    });

    await prisma.agentWallet.update({
      where: { agentId },
      data: { balance: { increment: amount } },
    });
  }

  static async debit(agentId: string, amount: number) {
    const wallet = await prisma.agentWallet.findUnique({ where: { agentId } });
    if (!wallet) throw new Error('Wallet not found');

    if (wallet.balance < amount) throw new Error('Insufficient funds');

    await prisma.agentTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount: -amount,
      },
    });

    await prisma.agentWallet.update({
      where: { agentId },
      data: { balance: { decrement: amount } },
    });
  }
}

export default WalletService;