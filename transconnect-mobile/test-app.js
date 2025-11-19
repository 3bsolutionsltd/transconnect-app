// Simple test to verify gesture handler works
import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TestApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ TransConnect Mobile App</Text>
      <Text style={styles.text}>✅ Gesture Handler Loaded</Text>
      <Text style={styles.text}>✅ React Native Working</Text>
      <Text style={styles.success}>🎉 All Systems Ready!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
  },
  text: {
    fontSize: 18,
    marginVertical: 10,
    color: '#333',
  },
  success: {
    fontSize: 24,
    marginTop: 20,
    color: '#28a745',
    fontWeight: 'bold',
  },
});