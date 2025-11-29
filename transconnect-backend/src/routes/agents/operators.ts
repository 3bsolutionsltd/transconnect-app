/**
 * Agent Operator Management Routes
 * /api/agents/:agentId/operators
 */

import { Router, Request, Response } from 'express';
import { AgentOperatorService } from '../../services/agents/agentOperator.service';
import { authenticateAgentToken } from '../../middleware/agentAuth';
import { body, param, validationResult } from 'express-validator';

const router = Router();

// Middleware to validate agent access
const validateAgentAccess = async (req: Request, res: Response, next: any) => {
  try {
    // Extract agentId from the URL since req.params might not work with sub-routers
    let agentId = req.params.agentId;
    
    // If agentId is not in params, extract from baseUrl
    if (!agentId && req.baseUrl) {
      const match = req.baseUrl.match(/\/api\/agents\/([^\/]+)\/operators/);
      if (match) {
        agentId = match[1];
      }
    }
    
    const tokenAgentId = (req as any).agent?.agentId;

    console.log('Agent access validation:', {
      urlAgentId: agentId,
      tokenAgentId: tokenAgentId,
      agent: (req as any).agent,
      allParams: req.params,
      originalUrl: req.originalUrl,
      baseUrl: req.baseUrl,
      path: req.path,
      extractedFromBaseUrl: agentId
    });

    // Validate that the agent can only access their own operators
    if (agentId !== tokenAgentId) {
      console.error('Agent ID mismatch:', { urlAgentId: agentId, tokenAgentId });
      return res.status(403).json({ 
        error: 'Access denied. You can only manage your own operators.',
        debug: { urlAgentId: agentId, tokenAgentId }
      });
    }

    next();
  } catch (error) {
    console.error('Agent access validation error:', error);
    res.status(500).json({ error: 'Failed to validate agent access' });
  }
};

/**
 * Register a new operator under agent management
 * POST /api/agents/:agentId/operators
 */
router.post('/',
  authenticateAgentToken,
  validateAgentAccess,
  [
    body('companyName').isString().notEmpty().withMessage('Company name is required'),
    body('license').isString().notEmpty().withMessage('License is required'),
    body('firstName').isString().notEmpty().withMessage('First name is required'),
    body('lastName').isString().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').isString().notEmpty().withMessage('Phone number is required'),
    body('password').optional().isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        console.error('Operator registration validation errors:', {
          errors: errors.array(),
          body: req.body,
          params: req.params
        });
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract agentId from URL since req.params doesn't work with sub-routers
      let agentId = req.params.agentId;
      if (!agentId && req.baseUrl) {
        const match = req.baseUrl.match(/\/api\/agents\/([^\/]+)\/operators/);
        if (match) {
          agentId = match[1];
        }
      }

      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID could not be determined' });
      }

      const operatorData = req.body;

      const result = await AgentOperatorService.registerOperator(agentId, operatorData);
      
      res.status(201).json(result);
    } catch (error: any) {
      console.error('Error registering operator:', error);
      res.status(400).json({ 
        error: error.message || 'Failed to register operator' 
      });
    }
  }
);

/**
 * Get all operators managed by an agent
 * GET /api/agents/:agentId/operators
 */
router.get('/',
  authenticateAgentToken,
  validateAgentAccess,
  async (req: Request, res: Response) => {
    try {
      // Extract agentId from URL since req.params doesn't work with sub-routers
      let agentId = req.params.agentId;
      if (!agentId && req.baseUrl) {
        const match = req.baseUrl.match(/\/api\/agents\/([^\/]+)\/operators/);
        if (match) {
          agentId = match[1];
        }
      }

      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID could not be determined' });
      }
      
      const operators = await AgentOperatorService.getAgentOperators(agentId);
      
      res.json({
        success: true,
        operators,
        count: operators.length
      });
    } catch (error: any) {
      console.error('Error getting agent operators:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get operators' 
      });
    }
  }
);

/**
 * Get agent's operator management dashboard
 * GET /api/agents/:agentId/operators/dashboard
 */
router.get('/dashboard',
  authenticateAgentToken,
  validateAgentAccess,
  async (req: Request, res: Response) => {
    try {
      // Extract agentId from URL since req.params doesn't work with sub-routers
      let agentId = req.params.agentId;
      if (!agentId && req.baseUrl) {
        const match = req.baseUrl.match(/\/api\/agents\/([^\/]+)\/operators/);
        if (match) {
          agentId = match[1];
        }
      }

      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID could not be determined' });
      }
      
      const dashboard = await AgentOperatorService.getAgentOperatorDashboard(agentId);
      
      res.json({
        success: true,
        dashboard
      });
    } catch (error: any) {
      console.error('Error getting operator dashboard:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get operator dashboard' 
      });
    }
  }
);

/**
 * Get detailed operator information
 * GET /api/agents/:agentId/operators/:operatorId
 */
router.get('/:operatorId',
  authenticateAgentToken,
  validateAgentAccess,
  async (req: Request, res: Response) => {
    try {
      // Extract agentId from URL since req.params doesn't work with sub-routers
      let agentId = req.params.agentId;
      if (!agentId && req.baseUrl) {
        const match = req.baseUrl.match(/\/api\/agents\/([^\/]+)\/operators/);
        if (match) {
          agentId = match[1];
        }
      }

      const operatorId = req.params.operatorId;

      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID could not be determined' });
      }
      
      if (!operatorId) {
        return res.status(400).json({ error: 'Operator ID is required' });
      }
      
      const operator = await AgentOperatorService.getOperatorDetails(agentId, operatorId);
      
      res.json({
        success: true,
        operator
      });
    } catch (error: any) {
      console.error('Error getting operator details:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get operator details' 
      });
    }
  }
);

/**
 * Update operator information
 * PUT /api/agents/:agentId/operators/:operatorId
 */
router.put('/:operatorId',
  authenticateAgentToken,
  validateAgentAccess,
  [
    body('companyName').optional().isString().notEmpty().withMessage('Company name cannot be empty'),
    body('firstName').optional().isString().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().isString().notEmpty().withMessage('Last name cannot be empty'),
    body('email').optional().isEmail().withMessage('Must be a valid email'),
    body('phone').optional().isString().notEmpty().withMessage('Phone number cannot be empty')
  ],
  async (req: Request, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      // Extract agentId from URL since req.params doesn't work with sub-routers
      let agentId = req.params.agentId;
      if (!agentId && req.baseUrl) {
        const match = req.baseUrl.match(/\/api\/agents\/([^\/]+)\/operators/);
        if (match) {
          agentId = match[1];
        }
      }

      const operatorId = req.params.operatorId;

      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID could not be determined' });
      }
      
      if (!operatorId) {
        return res.status(400).json({ error: 'Operator ID is required' });
      }
      const updateData = req.body;

      const result = await AgentOperatorService.updateOperator(agentId, operatorId, updateData);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error updating operator:', error);
      res.status(400).json({ 
        error: error.message || 'Failed to update operator' 
      });
    }
  }
);

/**
 * Get operator analytics
 * GET /api/agents/:agentId/operators/:operatorId/analytics
 */
router.get('/:operatorId/analytics',
  authenticateAgentToken,
  validateAgentAccess,
  async (req: Request, res: Response) => {
    try {
      // Extract agentId from URL since req.params doesn't work with sub-routers
      let agentId = req.params.agentId;
      if (!agentId && req.baseUrl) {
        const match = req.baseUrl.match(/\/api\/agents\/([^\/]+)\/operators/);
        if (match) {
          agentId = match[1];
        }
      }

      const operatorId = req.params.operatorId;

      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID could not be determined' });
      }
      
      if (!operatorId) {
        return res.status(400).json({ error: 'Operator ID is required' });
      }
      
      const analytics = await AgentOperatorService.getOperatorAnalytics(operatorId);
      
      res.json({
        success: true,
        analytics
      });
    } catch (error: any) {
      console.error('Error getting operator analytics:', error);
      res.status(500).json({ 
        error: error.message || 'Failed to get operator analytics' 
      });
    }
  }
);

export default router;