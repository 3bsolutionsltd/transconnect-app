import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

// Helper function to get operator ID for a user
export const getOperatorIdForUser = async (userId: string): Promise<string | null> => {
  try {
    // First check if user is a direct operator (has operator record)
    const directOperator = await prisma.operator.findUnique({
      where: { userId }
    });

    if (directOperator) {
      return directOperator.id;
    }

    // Then check if user is an operator user (created by admin through OperatorUser model)
    const operatorUser = await prisma.operatorUser.findUnique({
      where: { userId }
    });

    if (operatorUser) {
      return operatorUser.operatorId;
    }

    return null;
  } catch (error) {
    console.error('Error getting operator ID for user:', error);
    return null;
  }
};

// Helper function to check if user has operator permissions
export const checkOperatorPermission = async (userId: string, requiredOperatorId?: string): Promise<boolean> => {
  try {
    const userOperatorId = await getOperatorIdForUser(userId);
    
    if (!userOperatorId) {
      return false;
    }

    // If specific operator ID is required, check if it matches
    if (requiredOperatorId && userOperatorId !== requiredOperatorId) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error checking operator permission:', error);
    return false;
  }
};

// Middleware to ensure user has operator access
export const requireOperatorAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const userRole = (req as any).user.role;

    // Admins have full access
    if (userRole === 'ADMIN') {
      return next();
    }

    // Check if user is an operator or operator user
    if (userRole !== 'OPERATOR') {
      return res.status(403).json({ error: 'Operator access required' });
    }

    const operatorId = await getOperatorIdForUser(userId);
    if (!operatorId) {
      return res.status(403).json({ error: 'No operator association found' });
    }

    // Add operator ID to request for use in route handlers
    (req as any).operatorId = operatorId;
    next();
  } catch (error) {
    console.error('Error in requireOperatorAccess middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to ensure user has access to specific operator
export const requireSpecificOperatorAccess = (operatorIdParam: string = 'operatorId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const userRole = (req as any).user.role;
      const requestedOperatorId = req.params[operatorIdParam];

      // Admins have full access
      if (userRole === 'ADMIN') {
        return next();
      }

      // Check if user is an operator or operator user
      if (userRole !== 'OPERATOR') {
        return res.status(403).json({ error: 'Operator access required' });
      }

      const userOperatorId = await getOperatorIdForUser(userId);
      if (!userOperatorId) {
        return res.status(403).json({ error: 'No operator association found' });
      }

      // Check if user has access to the requested operator
      if (userOperatorId !== requestedOperatorId) {
        return res.status(403).json({ error: 'Not authorized to access this operator' });
      }

      next();
    } catch (error) {
      console.error('Error in requireSpecificOperatorAccess middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

export default {
  getOperatorIdForUser,
  checkOperatorPermission,
  requireOperatorAccess,
  requireSpecificOperatorAccess
};