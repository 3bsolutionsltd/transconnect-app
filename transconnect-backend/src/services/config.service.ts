// Simple configuration service for production deployment
// No file system operations, just environment variable management

export interface AppConfig {
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  email: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
  };
  server: {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
  };
}

export class ConfigService {
  private static instance: ConfigService;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfiguration();
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  private loadConfiguration(): AppConfig {
    return {
      database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/transconnect_db'
      },
      jwt: {
        secret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      },
      email: {
        host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || process.env.EMAIL_USER || '',
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASS || ''
      },
      server: {
        port: parseInt(process.env.PORT || '5000'),
        nodeEnv: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      }
    };
  }

  // Getters for configuration sections
  public get database() { return this.config.database; }
  public get jwt() { return this.config.jwt; }
  public get email() { return this.config.email; }
  public get server() { return this.config.server; }

  // Validation
  public validateConfiguration(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.jwt.secret || this.jwt.secret === 'default-jwt-secret-change-in-production') {
      errors.push('JWT_SECRET must be set to a secure value');
    }

    if (!this.database.url || this.database.url.includes('localhost')) {
      if (process.env.NODE_ENV === 'production') {
        errors.push('DATABASE_URL must be set for production');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Logging (safe for production)
  public logConfiguration(): void {
    console.log('Configuration loaded:', {
      database: { url: this.database.url ? '***configured***' : 'not set' },
      jwt: { secret: this.jwt.secret ? '***configured***' : 'not set' },
      email: { 
        host: this.email.host,
        port: this.email.port,
        user: this.email.user ? '***configured***' : 'not set'
      },
      server: {
        port: this.server.port,
        nodeEnv: this.server.nodeEnv
      }
    });

    const validation = this.validateConfiguration();
    if (!validation.isValid) {
      console.warn('Configuration warnings:', validation.errors);
    }
  }
}

export default ConfigService;