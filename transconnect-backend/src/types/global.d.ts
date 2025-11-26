// Global type declarations for TransConnect Backend

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      agentId?: string;
    }
  }
}

export interface AuthRequest extends Express.Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export {};