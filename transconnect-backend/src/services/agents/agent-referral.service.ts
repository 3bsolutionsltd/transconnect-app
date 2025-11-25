import { prisma } from '../../index';

class ReferralService {
  static async linkReferral(agentId: string, referralCode: string) {
    const referrer = await prisma.agent.findUnique({ where: { referralCode } });
    if (!referrer) return;

    await prisma.agent.update({
      where: { id: agentId },
      data: { referredById: referrer.id },
    });

    await prisma.referral.create({
      data: {
        agentId: referrer.id,
        referredId: agentId,
        level: 1,
      },
    });
  }

  static async getDownline(agentId: string, depth = 3) {
    const result: Array<{ level: number; agent: string }> = [];

    async function walk(id: string, level: number) {
      if (level > depth) return;

      const refs = await prisma.referral.findMany({ where: { agentId: id } });
      for (const r of refs) {
        result.push({ level, agent: r.referredId });
        await walk(r.referredId, level + 1);
      }
    }

    await walk(agentId, 1);
    return result;
  }
}

export default ReferralService;