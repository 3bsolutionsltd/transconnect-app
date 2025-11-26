/**
 * Dynamic Port Configuration Utility
 * Eliminates hardcoded ports across the application
 */

interface PortConfig {
  backend: string;
  frontend: string;
  admin: string;
}

/**
 * Get current port configuration from environment variables
 */
export const getPortConfig = (): PortConfig => {
  return {
    backend: process.env.NEXT_PUBLIC_BACKEND_PORT || process.env.BACKEND_PORT || '5000',
    frontend: process.env.NEXT_PUBLIC_FRONTEND_PORT || process.env.FRONTEND_PORT || '3002',
    admin: process.env.NEXT_PUBLIC_ADMIN_PORT || process.env.ADMIN_PORT || '3003',
  };
};

/**
 * Generate API URLs based on current port configuration
 */
export const getApiUrls = () => {
  const ports = getPortConfig();
  
  return {
    backend: `http://localhost:${ports.backend}`,
    api: `http://localhost:${ports.backend}/api`,
    agents: `http://localhost:${ports.backend}/api/agents`,
    frontend: `http://localhost:${ports.frontend}`,
    admin: `http://localhost:${ports.admin}`,
  };
};

/**
 * Check if a port is available (for development use)
 */
export const checkPortAvailable = async (port: string): Promise<boolean> => {
  if (typeof window !== 'undefined') {
    // Browser environment - try to fetch health check
    try {
      const response = await fetch(`http://localhost:${port}/health`, { 
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }
  return true; // Server-side, assume available
};

/**
 * Auto-discover backend port by testing common ports
 */
export const discoverBackendPort = async (): Promise<string> => {
  const commonPorts = ['5000', '3001', '8000', '3000'];
  
  for (const port of commonPorts) {
    if (await checkPortAvailable(port)) {
      console.log(`🔍 Auto-discovered backend on port ${port}`);
      return port;
    }
  }
  
  console.warn('⚠️ Could not auto-discover backend port, using default 5000');
  return '5000';
};

/**
 * Development helper to log current configuration
 */
export const logPortConfiguration = () => {
  if (process.env.NODE_ENV === 'development') {
    const urls = getApiUrls();
    console.log('🔧 Port Configuration:');
    console.log(`   Backend: ${urls.backend}`);
    console.log(`   API: ${urls.api}`);
    console.log(`   Frontend: ${urls.frontend}`);
    console.log(`   Admin: ${urls.admin}`);
  }
};

export default {
  getPortConfig,
  getApiUrls,
  checkPortAvailable,
  discoverBackendPort,
  logPortConfiguration,
};