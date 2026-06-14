import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { LayoutDashboard, Users, ClipboardList, Settings } from 'lucide-react-native'
import DashboardScreen from '../screens/admin/DashboardScreen'
import UsersScreen from '../screens/admin/UsersScreen'
import OrdersScreen from '../screens/admin/OrdersScreen'
import PharmaciesScreen from '../screens/admin/PharmaciesScreen'
import DisputesScreen from '../screens/admin/DisputesScreen'
import FinanceScreen from '../screens/admin/FinanceScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Pharmacies" component={PharmaciesScreen} />
      <Stack.Screen name="Disputes" component={DisputesScreen} />
      <Stack.Screen name="Finance" component={FinanceScreen} />
    </Stack.Navigator>
  )
}

export default function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#64748b',
        tabBarStyle: { backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155', height: 60, paddingBottom: 8 },
        tabBarLabelStyle: { color: '#94a3b8' },
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard', tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tab.Screen name="Users" component={UsersScreen} options={{ tabBarLabel: 'Utilisateurs', tabBarIcon: ({ color, size }) => <Users color={color} size={size} /> }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ tabBarLabel: 'Commandes', tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }} />
      <Tab.Screen name="More" component={MoreStack} options={{ tabBarLabel: 'Plus', tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
    </Tab.Navigator>
  )
}
