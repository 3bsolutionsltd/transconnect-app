// Admin Token Cleanup - Force Re-authentication
// This script should be run once to clear all invalid tokens

console.log('🔧 Admin Token Cleanup Script');

// Check if we're in a browser environment
if (typeof window !== 'undefined' && window.localStorage) {
  console.log('🧹 Clearing admin tokens...');
  
  const oldToken = localStorage.getItem('admin_token');
  const oldUser = localStorage.getItem('admin_user');
  
  if (oldToken || oldUser) {
    console.log('Found old tokens:', {
      hasToken: !!oldToken,
      hasUser: !!oldUser,
      tokenPreview: oldToken ? oldToken.substring(0, 50) + '...' : null
    });
    
    // Clear old tokens
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    
    console.log('✅ Old tokens cleared successfully');
    console.log('🔄 Please log in again with admin credentials');
    
    // Show user-friendly message
    alert('Admin session expired. Please log in again with your admin credentials.');
    
    // Redirect to login
    if (window.location.pathname !== '/') {
      window.location.href = '/';
    }
  } else {
    console.log('ℹ️ No old tokens found');
  }
} else {
  console.log('❌ Not running in browser environment');
}

export {};