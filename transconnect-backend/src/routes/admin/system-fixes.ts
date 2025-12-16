import { Router, Request, Response } from 'express';
import { prisma } from '../../index';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Admin endpoint to fix missing OperatorUser relationships
router.post('/fix-operator-users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).user.role;

    // Only admins can run this fix
    if (userRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can run system fixes' });
    }

    // Find all operators that don't have OperatorUser relationships
    const operatorsWithoutOperatorUsers = await prisma.operator.findMany({
      where: {
        operatorUsers: {
          none: {}  // Operators with no OperatorUser relationships
        }
      },
      include: {
        user: true,
        operatorUsers: true
      }
    });

    const fixResults = [];

    for (const operator of operatorsWithoutOperatorUsers) {
      try {
        // Create the missing OperatorUser relationship
        const operatorUser = await prisma.operatorUser.create({
          data: {
            userId: operator.userId,
            operatorId: operator.id,
            role: 'MANAGER',
            permissions: ['manage_all'],
            active: true
          }
        });
        
        fixResults.push({
          operator: operator.companyName,
          operatorId: operator.id,
          userId: operator.userId,
          status: 'fixed',
          operatorUserId: operatorUser.id
        });
      } catch (error: any) {
        fixResults.push({
          operator: operator.companyName,
          operatorId: operator.id,
          userId: operator.userId,
          status: 'failed',
          error: error.message
        });
      }
    }
    
    // Verify the fix
    const remainingBrokenOperators = await prisma.operator.findMany({
      where: {
        operatorUsers: {
          none: {}
        }
      },
      select: {
        companyName: true,
        id: true
      }
    });

    res.json({
      success: true,
      message: `Fix completed! Processed ${operatorsWithoutOperatorUsers.length} operators.`,
      fixResults,
      remainingIssues: remainingBrokenOperators.length,
      remainingBrokenOperators: remainingBrokenOperators.map(op => op.companyName)
    });

  } catch (error: any) {
    console.error('Error running operator user fix:', error);
    res.status(500).json({ 
      error: 'Failed to run fix', 
      details: error.message 
    });
  }
});

export default router;