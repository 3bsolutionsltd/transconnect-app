import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

interface AgentRequest extends Request {
  agentId?: string;
}

/**
 * Middleware to track agent activity and update online status
 * Should be used on agent-specific routes to track when agents are active
 */
export async function trackAgentActivity(req: AgentRequest, res: Response, next: NextFunction) {
  try {
    // Extract agent ID from various sources
    let agentId: string | null = null;

    // Method 1: From route params (most common)
    if (req.params.agentId) {
      agentId = req.params.agentId;
    }

    // Method 2: From JWT token in Authorization header
    if (!agentId && req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = jwt.verify(token, JWT_SECRET) as any;
        if (decoded.agentId) {
          agentId = decoded.agentId;
        }
      } catch (jwtError) {
        // JWT verification failed, continue without tracking
        console.log('JWT verification failed in activity tracking:', jwtError);
      }
    }

    // Method 3: From request body (for login/register endpoints)
    if (!agentId && req.body.agentId) {
      agentId = req.body.agentId;
    }

    // Update agent activity if we found an agent ID
    if (agentId) {
      await updateAgentActivity(agentId);
      req.agentId = agentId; // Attach to request for downstream use
    }

    next();
  } catch (error) {
    console.error('Error in agent activity tracking:', error);
    // Don't fail the request if activity tracking fails
    next();
  }
}

/**
 * Update agent's online status and last active time
 */
export async function updateAgentActivity(agentId: string): Promise<void> {
  try {
    // Check if agent exists first
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { id: true, name: true, isOnline: true }
    });
    
    if (!agent) {
      console.warn(`⚠️ Attempted to update activity for non-existent agent: ${agentId}`);
      return;
    }
    
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        isOnline: true,
        lastActiveAt: new Date(),
        updatedAt: new Date(),
      },
    });
    
    // Only log when status changes from offline to online
    if (!agent.isOnline) {
      console.log(`📡 Agent ${agent.name} (${agentId}) came online`);
    }
  } catch (error) {
    console.error(`Failed to update activity for agent ${agentId}:`, error);
  }
}

/**
 * Mark agent as offline
 */
export async function markAgentOffline(agentId: string): Promise<void> {
  try {
    // Get agent info for better logging
    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      select: { name: true, isOnline: true }
    });
    
    if (!agent) {
      console.warn(`⚠️ Attempted to mark non-existent agent offline: ${agentId}`);
      return;
    }
    
    await prisma.agent.update({
      where: { id: agentId },
      data: {
        isOnline: false,
        updatedAt: new Date(),
      },
    });
    
    if (agent.isOnline) {
      console.log(`📴 Agent ${agent.name} (${agentId}) marked offline`);
    }
  } catch (error) {
    console.error(`Failed to mark agent ${agentId} offline:`, error);
  }
}

/**
 * Cleanup offline agents (agents inactive for more than 3 minutes)
 * This should be run periodically as a background job
 */
export async function cleanupOfflineAgents(): Promise<number> {
  try {
    const threeMinutesAgo = new Date(Date.now() - 3 * 60 * 1000);
    
    // First, find agents that will be marked offline for logging
    const agentsToMarkOffline = await prisma.agent.findMany({
      where: {
        isOnline: true,
        lastActiveAt: {
          lt: threeMinutesAgo,
        },
      },
      select: {
        id: true,
        name: true,
        lastActiveAt: true,
      },
    });
    
    if (agentsToMarkOffline.length > 0) {
      console.log(`📴 Found ${agentsToMarkOffline.length} agents inactive for >3 minutes:`);
      agentsToMarkOffline.forEach(agent => {
        const minutesInactive = Math.floor((Date.now() - (agent.lastActiveAt?.getTime() || 0)) / 60000);
        console.log(`   - ${agent.name} (${agent.id}): inactive for ${minutesInactive} minutes`);
      });
    }
    
    const result = await prisma.agent.updateMany({
      where: {
        isOnline: true,
        lastActiveAt: {
          lt: threeMinutesAgo,
        },
      },
      data: {
        isOnline: false,
        updatedAt: new Date(),
      },
    });

    if (result.count > 0) {
      console.log(`🧹 Successfully marked ${result.count} agents as offline`);
    }

    return result.count;
  } catch (error) {
    console.error('Error cleaning up offline agents:', error);
    return 0;
  }
}

/**
 * Get currently online agents count
 */
export async function getOnlineAgentsCount(): Promise<number> {
  try {
    const count = await prisma.agent.count({
      where: {
        isOnline: true,
      },
    });
    return count;
  } catch (error) {
    console.error('Error getting online agents count:', error);
    return 0;
  }
}

/**
 * Get list of currently online agents
 */
export async function getOnlineAgents() {
  try {
    const agents = await prisma.agent.findMany({
      where: {
        isOnline: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        referralCode: true,
        status: true,
        lastActiveAt: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: {
        lastActiveAt: 'desc',
      },
    });

    return agents;
  } catch (error) {
    console.error('Error getting online agents:', error);
    return [];
  }
}