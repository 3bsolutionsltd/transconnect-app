/**
 * Small helper utilities to store / read agent token and id in localStorage.
 * In production prefer httpOnly cookies managed by backend.
 * 
 * TODO: Consider integrating with existing AuthContext if it supports agent tokens
 */

// Agent token management
export function setAgentToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('agent_token', token);
  }
}

export function getAgentToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('agent_token');
  }
  return null;
}

export function removeAgentToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('agent_token');
  }
}

// Agent ID management
export function setAgentId(id: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('agent_id', id);
  }
}

export function getAgentId(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('agent_id');
  }
  return null;
}

export function removeAgentId(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('agent_id');
  }
}

// Combined cleanup
export function clearAgentAuth(): void {
  removeAgentToken();
  removeAgentId();
}

// Logout function with redirect
export function logoutAgent(): void {
  clearAgentAuth();
  if (typeof window !== 'undefined') {
    window.location.href = '/agents';
  }
}

// Check if agent is authenticated
export function isAgentAuthenticated(): boolean {
  return !!(getAgentToken() && getAgentId());
}

/**
 * Hook-like helper for React components
 * Usage: const agentAuth = useAgentAuth();
 */
export function useAgentAuth() {
  return {
    token: getAgentToken(),
    agentId: getAgentId(),
    isAuthenticated: isAgentAuthenticated(),
    setToken: setAgentToken,
    setAgentId: setAgentId,
    clearAuth: clearAgentAuth,
  };
}