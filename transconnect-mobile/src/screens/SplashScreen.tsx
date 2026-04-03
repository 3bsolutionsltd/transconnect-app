import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    console.log('💫 Splash screen showing...');
    console.log('💫 onFinish type:', typeof onFinish);
    
    // Start animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 10,
        friction: 2,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('🎨 Animation complete');
    });

    // Auto-finish after timeout - multiple failsafes
    const timer1 = setTimeout(() => {
      console.log('✅ Splash screen finished (timer 1)');
      try {
        onFinish();
      } catch (error) {
        console.error('Error finishing splash (timer 1):', error);
      }
    }, 1200);
    
    // Backup timer in case first one fails
    const timer2 = setTimeout(() => {
      console.log('⚠️ Backup splash finish triggered (timer 2)');
      try {
        onFinish();
      } catch (error) {
        console.error('Error finishing splash (timer 2):', error);
      }
    }, 2000);

    return () => {
      console.log('🧹 Splash screen cleanup');
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.slogan}>Connect, Move, Optimize</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E40AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 180,
    height: 180,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 24,
    overflow: 'hidden',
  },
  logo: {
    width: 140,
    height: 140,
  },
  slogan: {
    fontSize: 16,
    color: '#E0E7FF',
    fontWeight: '300',
  },
});
