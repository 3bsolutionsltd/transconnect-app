import { Platform } from 'react-native';

// Dynamic import for SecureStore to avoid web compatibility issues
let SecureStore: any = null;
if (Platform.OS !== 'web') {
  try {
    SecureStore = require('expo-secure-store');
  } catch (error) {
    console.warn('SecureStore not available:', error);
  }
}

// Cross-platform secure storage utility
export const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn('localStorage setItem failed:', error);
      }
    } else {
      // Use SecureStore for mobile
      if (SecureStore) {
        try {
          await SecureStore.setItemAsync(key, value);
        } catch (error) {
          console.warn('SecureStore setItem failed:', error);
        }
      }
    }
  },

  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage getItem failed:', error);
        return null;
      }
    } else {
      // Use SecureStore for mobile
      if (SecureStore) {
        try {
          return await SecureStore.getItemAsync(key);
        } catch (error) {
          console.warn('SecureStore getItem failed:', error);
          return null;
        }
      }
      return null;
    }
  },

  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Use localStorage for web
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn('localStorage removeItem failed:', error);
      }
    } else {
      // Use SecureStore for mobile
      if (SecureStore) {
        try {
          await SecureStore.deleteItemAsync(key);
        } catch (error) {
          console.warn('SecureStore removeItem failed:', error);
        }
      }
    }
  },

  async clear(): Promise<void> {
    if (Platform.OS === 'web') {
      // Clear all localStorage items with our prefix
      try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.startsWith('auth_') || key.startsWith('user_')) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        console.warn('localStorage clear failed:', error);
      }
    } else {
      // Clear SecureStore items individually
      if (SecureStore) {
        try {
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_data');
        } catch (error) {
          console.log('Error clearing secure storage:', error);
        }
      }
    }
  }
};