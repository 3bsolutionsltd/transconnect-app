import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface SecureConfig {
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
  payments: {
    flutterwave: {
      publicKey: string;
      secretKey: string;
    };
    mtn: {
      apiKey: string;
    };
    airtel: {
      apiKey: string;
    };
  };
  external: {
    googleMaps: string;
    twilio: {
      accountSid: string;
      authToken: string;
      phoneNumber: string;
    };
  };
  server: {
    port: number;
    nodeEnv: string;
    frontendUrl: string;
  };
}

export class SecureConfigService {
  private static instance: SecureConfigService;
  private config: SecureConfig;
  private encryptionKey: string;

  private constructor() {
    this.encryptionKey = this.getEncryptionKey();
    this.config = this.loadConfiguration();
  }

  public static getInstance(): SecureConfigService {
    if (!SecureConfigService.instance) {
      SecureConfigService.instance = new SecureConfigService();
    }
    return SecureConfigService.instance;
  }

  private getEncryptionKey(): string {
    // In production, this should come from a secure key management service
    // For now, use a combination of system info and JWT secret
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    return crypto.createHash('sha256').update(jwtSecret).digest('hex');
  }

  private encrypt(text: string): string {
    if (!text) return text;
    
    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.encryptionKey, 'hex').slice(0, 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return iv.toString('hex') + ':' + encrypted;
    } catch (error) {
      console.warn('Encryption failed, using plain text:', error);
      return text;
    }
  }

  private decrypt(encryptedText: string): string {
    if (!encryptedText || !encryptedText.includes(':')) {
      return encryptedText; // Return as-is if not encrypted
    }

    try {
      const algorithm = 'aes-256-cbc';
      const key = Buffer.from(this.encryptionKey, 'hex').slice(0, 32);
      
      const parts = encryptedText.split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.warn('Decryption failed, using as-is:', error);
      return encryptedText;
    }
  }

  private loadConfiguration(): SecureConfig {
    // Load from environment variables with fallbacks
    const config: SecureConfig = {
      database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/transconnect_db'
      },
      jwt: {
        secret: process.env.JWT_SECRET || this.generateSecureSecret(),
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      },
      email: {
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        pass: this.decrypt(process.env.SMTP_PASS || '')
      },
      payments: {
        flutterwave: {
          publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
          secretKey: this.decrypt(process.env.FLUTTERWAVE_SECRET_KEY || '')
        },
        mtn: {
          apiKey: this.decrypt(process.env.MTN_API_KEY || '')
        },
        airtel: {
          apiKey: this.decrypt(process.env.AIRTEL_API_KEY || '')
        }
      },
      external: {
        googleMaps: this.decrypt(process.env.GOOGLE_MAPS_API_KEY || ''),
        twilio: {
          accountSid: process.env.TWILIO_ACCOUNT_SID || '',
          authToken: this.decrypt(process.env.TWILIO_AUTH_TOKEN || ''),
          phoneNumber: process.env.TWILIO_PHONE_NUMBER || ''
        }
      },
      server: {
        port: parseInt(process.env.PORT || '5000'),
        nodeEnv: process.env.NODE_ENV || 'development',
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      }
    };

    // Validate critical configuration
    this.validateConfiguration(config);
    
    return config;
  }

  private validateConfiguration(config: SecureConfig): void {
    const requiredFields = [
      'database.url',
      'jwt.secret',
      'email.host',
      'email.user'
    ];

    const errors: string[] = [];

    requiredFields.forEach(field => {
      const value = this.getNestedValue(config, field);
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`Missing required configuration: ${field}`);
      }
    });

    if (errors.length > 0) {
      console.error('Configuration validation failed:');
      errors.forEach(error => console.error(`- ${error}`));
      
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Invalid configuration in production environment');
      }
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private generateSecureSecret(): string {
    // Generate a secure random secret for JWT
    return crypto.randomBytes(64).toString('hex');
  }

  // Getters for configuration sections
  public get database() { return this.config.database; }
  public get jwt() { return this.config.jwt; }
  public get email() { return this.config.email; }
  public get payments() { return this.config.payments; }
  public get external() { return this.config.external; }
  public get server() { return this.config.server; }

  // Security utilities
  public maskSensitiveData(data: any): any {
    const masked = JSON.parse(JSON.stringify(data));
    
    const sensitiveFields = [
      'password', 'pass', 'secret', 'key', 'token', 'auth'
    ];

    const maskValue = (obj: any) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'object' && value !== null) {
          maskValue(value);
        } else if (typeof value === 'string') {
          const isSensitive = sensitiveFields.some(field => 
            key.toLowerCase().includes(field)
          );
          
          if (isSensitive && value.length > 0) {
            obj[key] = '*'.repeat(Math.min(value.length, 8));
          }
        }
      }
    };

    maskValue(masked);
    return masked;
  }

  public logConfiguration(): void {
    const masked = this.maskSensitiveData(this.config);
    console.log('Loaded configuration:', JSON.stringify(masked, null, 2));
  }

  // Token rotation utilities
  public rotateJWTSecret(): string {
    const newSecret = this.generateSecureSecret();
    console.log('JWT secret rotated. Update environment variable and restart application.');
    return newSecret;
  }

  public validateTokens(): { valid: string[], invalid: string[], warnings: string[] } {
    const results = {
      valid: [] as string[],
      invalid: [] as string[],
      warnings: [] as string[]
    };

    // Check JWT secret strength
    if (this.jwt.secret.length < 32) {
      results.warnings.push('JWT secret should be at least 32 characters long');
    }

    // Check email configuration
    if (this.email.user && this.email.pass) {
      results.valid.push('Email credentials configured');
    } else {
      results.invalid.push('Email credentials missing or incomplete');
    }

    // Check payment gateways
    if (this.payments.flutterwave.publicKey && this.payments.flutterwave.secretKey) {
      results.valid.push('Flutterwave credentials configured');
    } else {
      results.warnings.push('Flutterwave credentials not configured');
    }

    // Check external services
    if (this.external.googleMaps) {
      results.valid.push('Google Maps API key configured');
    } else {
      results.warnings.push('Google Maps API key not configured');
    }

    return results;
  }
}

export default SecureConfigService;