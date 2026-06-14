import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { LayoutDashboard, ClipboardList, Package, User } from 'lucide-react-native'
import DashboardScreen from '../screens/pharmacy/DashboardScreen'
import OrdersScreen from '../screens/pharmacy/OrdersScreen'
import OrderDetailScreen from '../screens/pharmacy/OrderDetailScreen'
import StockScreen from '../screens/pharmacy/StockScreen'
import ProfileScreen from '../screens/pharmacy/ProfileScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList" component={OrdersScreen} />
      <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
    </Stack.Navigator>
  )
}

export default function PharmacyTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#16a34a',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', height: 60, paddingBottom: 8 },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Tableau', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tab.Screen name="Orders" component={OrdersStack} options={{ tabBarLabel: 'Commandes', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }} />
      <Tab.Screen name="Stock" component={StockScreen} options={{ tabBarLabel: 'Stock', tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tab.Navigator>
  )
}
