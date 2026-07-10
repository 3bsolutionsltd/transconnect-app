import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Verify user still exists and is verified
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, verified: true }
    });

    if (!user || !user.verified) {
      return res.status(401).json({ error: 'Invalid or unverified user' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    
    // Provide specific error messages for different JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token signature', 
        code: 'INVALID_TOKEN',
        message: 'Please log in again' 
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired', 
        code: 'TOKEN_EXPIRED',
        message: 'Please log in again' 
      });
    } else {
      return res.status(403).json({ 
        error: 'Invalid or expired token',
        code: 'AUTH_ERROR'
      });
    }
  }
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const PLATFORM_OPERATIONS_ROLES = [
  'ADMIN',
  'MANAGER',
  'MASTER_FIELD_OPERATOR',
  'OPERATOR_FIELD_OPERATOR',
] as const;

export const canAccessAllOperationsBookings = (role?: string) => {
  return role === 'ADMIN' || role === 'MANAGER' || role === 'MASTER_FIELD_OPERATOR';
};

export const getScopedOperatorIdsForUser = async (userId: string, role?: string) => {
  if (canAccessAllOperationsBookings(role)) {
    return null;
  }

  if (role !== 'OPERATOR_FIELD_OPERATOR') {
    return [];
  }

  const scopes = await prisma.fieldOperatorScope.findMany({
    where: {
      userId,
      active: true,
    },
    select: {
      operatorId: true,
    },
  });

  return scopes.map(scope => scope.operatorId);
};

// Admin-only middleware
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  next();
};