/**
 * Agent Activity Tracker
 * Keeps agent online status updated by sending periodic pings to the backend
 */

let heartbeatInterval: NodeJS.Timeout | null = null;
let isTracking = false;

const HEARTBEAT_INTERVAL = 2 * 60 * 1000; // 2 minutes
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Start tracking agent activity
 */
export function startAgentActivityTracking(agentId: string, token: string) {
  if (isTracking) {
    console.log('Activity tracking already running');
    return;
  }

  console.log('🔄 Starting agent activity tracking for agent:', agentId);
  
  isTracking = true;
  
  // Send initial ping
  sendHeartbeat(agentId, token);
  
  // Set up periodic heartbeat
  heartbeatInterval = setInterval(() => {
    sendHeartbeat(agentId, token);
  }, HEARTBEAT_INTERVAL);

  // Send ping when user interacts with the page
  setupUserActivityListeners(agentId, token);

  // Handle page visibility changes
  setupVisibilityChangeHandler(agentId, token);
}

/**
 * Stop tracking agent activity
 */
export function stopAgentActivityTracking(agentId?: string, token?: string) {
  console.log('🛑 Stopping agent activity tracking');
  
  isTracking = false;
  
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  // Mark agent as offline when stopping tracking
  if (agentId && token) {
    markAgentOffline(agentId, token);
  }

  // Remove event listeners
  removeUserActivityListeners();
}

/**
 * Send heartbeat ping to keep agent status online
 */
async function sendHeartbeat(agentId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/ping`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('💓 Heartbeat sent successfully:', data.timestamp);
    } else {
      console.warn('⚠️ Heartbeat failed:', response.status);
    }
  } catch (error) {
    console.error('❌ Heartbeat error:', error);
  }
}

/**
 * Mark agent as offline
 */
async function markAgentOffline(agentId: string, token: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/offline`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      console.log('📴 Agent marked offline successfully');
    } else {
      console.warn('⚠️ Failed to mark agent offline:', response.status);
    }
  } catch (error) {
    console.error('❌ Error marking agent offline:', error);
  }
}

/**
 * Set up listeners for user activity to send immediate pings
 */
function setupUserActivityListeners(agentId: string, token: string) {
  const activityEvents = ['click', 'keydown', 'scroll', 'mousemove'];
  let lastActivityTime = Date.now();
  
  const handleActivity = () => {
    const now = Date.now();
    // Only send ping if it's been more than 30 seconds since last activity
    if (now - lastActivityTime > 30000) {
      lastActivityTime = now;
      sendHeartbeat(agentId, token);
    }
  };

  activityEvents.forEach(event => {
    document.addEventListener(event, handleActivity, { passive: true });
  });

  // Store reference for cleanup
  (window as any).__agentActivityHandler = handleActivity;
  (window as any).__agentActivityEvents = activityEvents;
}

/**
 * Remove user activity listeners
 */
function removeUserActivityListeners() {
  const handler = (window as any).__agentActivityHandler;
  const events = (window as any).__agentActivityEvents;
  
  if (handler && events) {
    events.forEach((event: string) => {
      document.removeEventListener(event, handler);
    });
    
    delete (window as any).__agentActivityHandler;
    delete (window as any).__agentActivityEvents;
  }
}

/**
 * Handle page visibility changes
 */
function setupVisibilityChangeHandler(agentId: string, token: string) {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      console.log('📱 Page hidden - reducing activity tracking');
    } else {
      console.log('👀 Page visible - resuming normal activity tracking');
      // Send immediate heartbeat when page becomes visible
      sendHeartbeat(agentId, token);
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Store reference for cleanup
  (window as any).__agentVisibilityHandler = handleVisibilityChange;
}

/**
 * Handle beforeunload to mark agent offline when leaving
 */
export function setupBeforeUnloadHandler(agentId: string, token: string) {
  const handleBeforeUnload = () => {
    // Use sendBeacon for reliable delivery during page unload
    navigator.sendBeacon(
      `${API_BASE_URL}/api/agents/${agentId}/offline`,
      JSON.stringify({})
    );
  };

  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Store reference for cleanup
  (window as any).__agentBeforeUnloadHandler = handleBeforeUnload;
}

/**
 * Get current tracking status
 */
export function isActivityTrackingActive(): boolean {
  return isTracking;
}

/**
 * Hook for React components to manage activity tracking
 */
export function useAgentActivityTracking(agentId: string | null, token: string | null) {
  const startTracking = () => {
    if (agentId && token) {
      startAgentActivityTracking(agentId, token);
      setupBeforeUnloadHandler(agentId, token);
    }
  };

  const stopTracking = () => {
    if (agentId && token) {
      stopAgentActivityTracking(agentId, token);
    }
  };

  return {
    startTracking,
    stopTracking,
    isActive: isTracking,
  };
}