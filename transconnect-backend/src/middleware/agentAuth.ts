import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

interface AgentAuthRequest extends Request {
  agent?: {
    agentId: string;
    phone: string;
    name: string;
    type: string;
  };
}

export const authenticateAgentToken = async (req: AgentAuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Check if this is an agent token
    if (decoded.type !== 'agent') {
      return res.status(401).json({ error: 'Invalid token type. Agent token required.' });
    }

    // Verify agent still exists and is active
    const agent = await prisma.agent.findUnique({
      where: { id: decoded.sub },
      select: { id: true, name: true, phone: true, email: true, status: true }
    });

    if (!agent) {
      return res.status(401).json({ error: 'Agent not found' });
    }

    if (agent.status === 'SUSPENDED' || agent.status === 'INACTIVE') {
      return res.status(401).json({ error: 'Agent account is suspended or inactive' });
    }

    if (agent.status === 'PENDING') {
      return res.status(401).json({ error: 'Agent account is pending verification' });
    }

    req.agent = {
      agentId: agent.id,
      phone: agent.phone,
      name: agent.name,
      type: 'agent'
    };

    next();
  } catch (error: any) {
    console.error('Agent auth middleware error:', error);
    
    // Provide specific error messages for different JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid or expired token', 
        code: 'INVALID_TOKEN',
        message: 'Please log in again' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token has expired', 
        code: 'EXPIRED_TOKEN',
        message: 'Please log in again'
      });
    } else {
      return res.status(401).json({ 
        error: 'Authentication failed',
        code: 'AUTH_FAILED',
        message: 'Please log in again' 
      });
    }
  }
};