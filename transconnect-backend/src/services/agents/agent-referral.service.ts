import { prisma } from '../../index';

class ReferralService {
  static normalizeReferralCode(referralCode: string) {
    return referralCode.trim().toUpperCase();
  }

  static async linkReferral(
    agentId: string,
    referralCode: string,
    options?: { replaceExisting?: boolean }
  ) {
    const normalizedCode = ReferralService.normalizeReferralCode(referralCode);
    const referrer = await prisma.agent.findUnique({ where: { referralCode: normalizedCode } });
    if (!referrer) {
      throw new Error('Invalid referral code');
    }

    if (referrer.id === agentId) {
      throw new Error('An agent cannot refer themselves');
    }

    const targetAgent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, referredById: true }
    });

    if (!targetAgent) {
      throw new Error('Agent not found');
    }

    if (targetAgent.referredById && targetAgent.referredById !== referrer.id && !options?.replaceExisting) {
      throw new Error('Agent already has a referrer');
    }

    await prisma.agent.update({
      where: { id: agentId },
      data: { referredById: referrer.id },
    });

    if (targetAgent.referredById && targetAgent.referredById !== referrer.id && options?.replaceExisting) {
      await prisma.referral.deleteMany({
        where: { referredId: agentId }
      });
    }

    await prisma.referral.upsert({
      where: {
        agentId_referredId: {
          agentId: referrer.id,
          referredId: agentId,
        },
      },
      create: {
        agentId: referrer.id,
        referredId: agentId,
        level: 1,
      },
      update: {
        isActive: true,
        level: 1,
      },
    });

    return {
      referrerId: referrer.id,
      referrerCode: referrer.referralCode,
      linked: true,
    };
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