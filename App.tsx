import 'react-native-url-polyfill/auto'
import React from 'react'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from './src/contexts/AuthContext'
import { CartProvider } from './src/contexts/CartContext'
import AppNavigator from './src/navigation'

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </CartProvider>
    </AuthProvider>
  )
}
