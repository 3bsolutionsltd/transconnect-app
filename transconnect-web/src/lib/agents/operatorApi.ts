/**
 * Agent Operator API Client
 * Handles API calls for agent operator management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class AgentOperatorAPI {
  
  /**
   * Register a new operator under agent management
   */
  async registerOperator(agentId: string, operatorData: {
    companyName: string;
    license: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password?: string;
  }, token?: string) {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/operators`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(operatorData)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(error.error || 'Failed to register operator');
    }

    return response.json();
  }

  /**
   * Get all operators managed by an agent
   */
  async getAgentOperators(agentId: string, token?: string) {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/operators`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get operators' }));
      throw new Error(error.error || 'Failed to get operators');
    }

    return response.json();
  }

  /**
   * Get agent's operator management dashboard
   */
  async getOperatorDashboard(agentId: string, token?: string) {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/operators/dashboard`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get dashboard' }));
      throw new Error(error.error || 'Failed to get operator dashboard');
    }

    return response.json();
  }

  /**
   * Get detailed operator information
   */
  async getOperatorDetails(agentId: string, operatorId: string, token?: string) {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/operators/${operatorId}`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get operator details' }));
      throw new Error(error.error || 'Failed to get operator details');
    }

    return response.json();
  }

  /**
   * Update operator information
   */
  async updateOperator(agentId: string, operatorId: string, updateData: {
    companyName?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  }, token?: string) {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/operators/${operatorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to update operator' }));
      throw new Error(error.error || 'Failed to update operator');
    }

    return response.json();
  }

  /**
   * Get operator analytics
   */
  async getOperatorAnalytics(agentId: string, operatorId: string, token?: string) {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/operators/${operatorId}/analytics`, {
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` })
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to get analytics' }));
      throw new Error(error.error || 'Failed to get operator analytics');
    }

    return response.json();
  }
}

const agentOperatorAPI = new AgentOperatorAPI();
export default agentOperatorAPI;