import { Request, Response } from 'express';
import { prisma } from '../../../index';

export async function updateProfile(req: Request, res: Response) {
  try {
    const { agentId, momoNumber, bankName, bankAccount } = req.body;

    // Validate required fields
    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required'
      });
    }

    // Check if agent exists
    const existingAgent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { profile: true }
    });

    if (!existingAgent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Update or create agent profile
    const updatedProfile = await prisma.agentProfile.upsert({
      where: { agentId: agentId },
      update: {
        momoNumber: momoNumber,
        bankName: bankName,
        bankAccount: bankAccount,
        updatedAt: new Date()
      },
      create: {
        agentId: agentId,
        momoNumber: momoNumber,
        bankName: bankName,
        bankAccount: bankAccount
      }
    });

    // Get the updated agent with profile
    const agentWithProfile = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { profile: true }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      agent: {
        id: agentWithProfile!.id,
        name: agentWithProfile!.name,
        phone: agentWithProfile!.phone,
        email: agentWithProfile!.email,
        momoNumber: agentWithProfile!.profile?.momoNumber,
        bankName: agentWithProfile!.profile?.bankName,
        bankAccount: agentWithProfile!.profile?.bankAccount,
        status: agentWithProfile!.status,
        kycStatus: agentWithProfile!.kycStatus
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const { agentId } = req.params;

    if (!agentId) {
      return res.status(400).json({
        success: false,
        error: 'Agent ID is required'
      });
    }

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: { profile: true }
    });

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    res.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        phone: agent.phone,
        email: agent.email,
        momoNumber: agent.profile?.momoNumber,
        bankName: agent.profile?.bankName,
        bankAccount: agent.profile?.bankAccount,
        status: agent.status,
        kycStatus: agent.kycStatus,
        createdAt: agent.createdAt,
        updatedAt: agent.updatedAt
      }
    });

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile'
    });
  }
}