import { Request, Response, NextFunction } from 'express';
import { prisma } from '../index';

interface ExtendedUser {
  userId: string;
  email: string;
  role: string;
  operatorId?: string;
  operatorRole?: string;
  operatorCompany?: string;
}

// Helper function to get operator ID and role for a user
export const getOperatorInfoForUser = async (userId: string): Promise<{
  operatorId: string | null;
  operatorRole: string | null;
  operatorCompany: string | null;
  isOperatorUser: boolean;
}> => {
  try {
    // First check if user is a direct operator (has operator record)
    const directOperator = await prisma.operator.findUnique({
      where: { userId },
      select: { id: true, companyName: true, approved: true }
    });

    if (directOperator && directOperator.approved) {
      return {
        operatorId: directOperator.id,
        operatorRole: 'OWNER', // Original operator owner
        operatorCompany: directOperator.companyName,
        isOperatorUser: false
      };
    }

    // Then check if user is an operator user (created by admin through OperatorUser model)
    const operatorUser = await prisma.operatorUser.findUnique({
      where: { userId },
      include: {
        operator: {
          select: { id: true, companyName: true, approved: true }
        }
      }
    });

    if (operatorUser && operatorUser.active && operatorUser.operator.approved) {
      return {
        operatorId: operatorUser.operatorId,
        operatorRole: operatorUser.role,
        operatorCompany: operatorUser.operator.companyName,
        isOperatorUser: true
      };
    }

    return {
      operatorId: null,
      operatorRole: null,
      operatorCompany: null,
      isOperatorUser: false
    };
  } catch (error) {
    console.error('Error getting operator info for user:', error);
    return {
      operatorId: null,
      operatorRole: null,
      operatorCompany: null,
      isOperatorUser: false
    };
  }
};

// Legacy function for backward compatibility
export const getOperatorIdForUser = async (userId: string): Promise<string | null> => {
  const info = await getOperatorInfoForUser(userId);
  return info.operatorId;
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

    // Get operator information for the user
    const operatorInfo = await getOperatorInfoForUser(userId);
    
    if (!operatorInfo.operatorId) {
      return res.status(403).json({ error: 'No operator association found' });
    }

    // Add operator information to request for use in route handlers
    (req as any).operatorId = operatorInfo.operatorId;
    (req as any).operatorRole = operatorInfo.operatorRole;
    (req as any).operatorCompany = operatorInfo.operatorCompany;
    (req as any).isOperatorUser = operatorInfo.isOperatorUser;
    
    next();
  } catch (error) {
    console.error('Error in requireOperatorAccess middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware to check role-based permissions for operator users
export const requireOperatorPermission = (permissions: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userRole = (req as any).user.role;
      const operatorRole = (req as any).operatorRole;

      // Admins and original operators have full permissions
      if (userRole === 'ADMIN' || operatorRole === 'OWNER') {
        return next();
      }

      // Check operator staff permissions
      if (operatorRole && checkRolePermissions(operatorRole, permissions)) {
        return next();
      }

      return res.status(403).json({
        error: `Insufficient permissions. Required: ${permissions.join(' or ')}`
      });
    } catch (error) {
      console.error('Error in requireOperatorPermission middleware:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Define permissions for each operator role
function checkRolePermissions(role: string, requiredPermissions: string[]): boolean {
  const rolePermissions: { [key: string]: string[] } = {
    'MANAGER': ['create_route', 'edit_route', 'delete_route', 'view_route', 'manage_bookings', 'view_reports'],
    'DRIVER': ['view_route', 'edit_route', 'update_trip_status', 'scan_qr'],
    'CONDUCTOR': ['view_route', 'manage_passengers', 'scan_qr', 'collect_fare'],
    'TICKETER': ['create_route', 'edit_route', 'view_route', 'manage_bookings', 'scan_qr', 'process_payment'],
    'MAINTENANCE': ['view_bus', 'update_bus_status', 'maintenance_records']
  };

  const userPermissions = rolePermissions[role] || [];
  return requiredPermissions.some(permission => userPermissions.includes(permission));
}

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