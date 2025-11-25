import { prisma } from '../../index';
import WalletService from './agent-wallet.service';

const SPLITS = [10, 5, 2];

class CommissionService {
  static async process(agentId: string, amount: number, context?: any) {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent || !agent.path) return;

    const uplines = agent.path.split('/').filter(Boolean).reverse();

    for (let i = 0; i < Math.min(3, uplines.length); i++) {
      const uplineId = uplines[i];
      const pct = SPLITS[i];
      const commissionAmount = Math.floor((amount * pct) / 100);

      if (commissionAmount <= 0) continue;

      await prisma.commission.create({
        data: {
          agentId: uplineId,
          fromAgentId: agentId,
          amount: commissionAmount,
          level: i + 1,
          status: 'PAID',
        },
      });

      await WalletService.credit(uplineId, commissionAmount);
    }
  }
}

export default CommissionService;