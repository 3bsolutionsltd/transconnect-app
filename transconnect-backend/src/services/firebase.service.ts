import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

interface FirebaseConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
}

export class FirebaseService {
  private static instance: FirebaseService;
  private app: admin.app.App;

  private constructor() {
    if (!admin.apps.length) {
      const config: FirebaseConfig = {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      };

      const serviceAccount: ServiceAccount = {
        projectId: config.projectId,
        privateKey: config.privateKey,
        clientEmail: config.clientEmail,
      };

      this.app = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: config.projectId,
      });
    } else {
      this.app = admin.apps[0]!;
    }
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
        android: {
          notification: {
            title,
            body,
            icon: 'ic_notification',
            color: '#1976D2',
            sound: 'default',
            channelId: 'transconnect_notifications',
            priority: 'high' as const,
          },
          data: data,
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: 'default',
              badge: 1,
              'content-available': 1,
            },
          },
          headers: {
            'apns-priority': '10',
            'apns-push-type': 'alert',
          },
        },
        webpush: {
          notification: {
            title,
            body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/badge-72x72.png',
            requireInteraction: true,
            actions: [
              {
                action: 'view',
                title: 'View Details',
              },
            ],
          },
          data: data,
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Push notification sent successfully:', response);
      
      return {
        success: true,
        messageId: response,
      };
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'messaging/registration-token-not-registered') {
        return {
          success: false,
          error: 'Device token is no longer valid',
        };
      }
      
      return {
        success: false,
        error: error.message || 'Failed to send push notification',
      };
    }
  }

  /**
   * Send push notification to multiple devices
   */
  async sendToMultipleDevices(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ successCount: number; failureCount: number; responses: any[] }> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens,
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
        android: {
          notification: {
            title,
            body,
            icon: 'ic_notification',
            color: '#1976D2',
            sound: 'default',
            channelId: 'transconnect_notifications',
            priority: 'high' as const,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: 'default',
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            title,
            body,
            icon: '/icons/icon-192x192.png',
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(message);
      console.log('Multicast notification sent:', {
        successCount: response.successCount,
        failureCount: response.failureCount,
      });

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
        responses: response.responses,
      };
    } catch (error: any) {
      console.error('Error sending multicast notification:', error);
      throw new Error(`Failed to send multicast notification: ${error.message}`);
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    topic: string,
    title: string,
    body: string,
    data?: Record<string, string>
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          timestamp: new Date().toISOString(),
        },
        android: {
          notification: {
            title,
            body,
            icon: 'ic_notification',
            color: '#1976D2',
            sound: 'default',
            channelId: 'transconnect_notifications',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body,
              },
              sound: 'default',
            },
          },
        },
      };

      const response = await admin.messaging().send(message);
      console.log('Topic notification sent successfully:', response);
      
      return {
        success: true,
        messageId: response,
      };
    } catch (error: any) {
      console.error('Error sending topic notification:', error);
      return {
        success: false,
        error: error.message || 'Failed to send topic notification',
      };
    }
  }

  /**
   * Subscribe device to topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<boolean> {
    try {
      await admin.messaging().subscribeToTopic(tokens, topic);
      console.log(`Successfully subscribed ${tokens.length} tokens to topic: ${topic}`);
      return true;
    } catch (error: any) {
      console.error('Error subscribing to topic:', error);
      return false;
    }
  }

  /**
   * Unsubscribe device from topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<boolean> {
    try {
      await admin.messaging().unsubscribeFromTopic(tokens, topic);
      console.log(`Successfully unsubscribed ${tokens.length} tokens from topic: ${topic}`);
      return true;
    } catch (error: any) {
      console.error('Error unsubscribing from topic:', error);
      return false;
    }
  }

  /**
   * Validate registration token
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      await admin.messaging().send({
        token,
        data: { test: 'validation' },
      }, true); // dry run
      return true;
    } catch (error: any) {
      console.log('Token validation failed:', error.code);
      return false;
    }
  }
}