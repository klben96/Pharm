import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { LayoutDashboard, MapPin, TrendingUp, User } from 'lucide-react-native'
import DashboardScreen from '../screens/deliverer/DashboardScreen'
import ActiveDeliveryScreen from '../screens/deliverer/ActiveDeliveryScreen'
import EarningsScreen from '../screens/deliverer/EarningsScreen'
import ProfileScreen from '../screens/deliverer/ProfileScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CourseList" component={DashboardScreen} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} />
    </Stack.Navigator>
  )
}

export default function DelivererTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#ea580c',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', height: 60, paddingBottom: 8 },
      }}
    >
      <Tab.Screen name="Courses" component={DashboardStack} options={{ tabBarLabel: 'Courses', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tab.Screen name="ActiveTab" component={ActiveDeliveryScreen} options={{ tabBarLabel: 'En cours', tabBarIcon: ({ color, size }) => <MapPin color={color} size={size} /> }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} options={{ tabBarLabel: 'Gains', tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size} /> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tab.Navigator>
  )
}
