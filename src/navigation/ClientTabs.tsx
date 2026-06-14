import React from 'react'
import { View, Text } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Home as HomeIcon, Search as SearchIcon, ShoppingCart, Package, User } from 'lucide-react-native'
import { useCart } from '../contexts/CartContext'
import HomeScreen from '../screens/client/HomeScreen'
import SearchScreen from '../screens/client/SearchScreen'
import CartScreen from '../screens/client/CartScreen'
import CheckoutScreen from '../screens/client/CheckoutScreen'
import OrdersScreen from '../screens/client/OrdersScreen'
import OrderTrackingScreen from '../screens/client/OrderTrackingScreen'
import OrdonnanceScreen from '../screens/client/OrdonnanceScreen'
import ProfileScreen from '../screens/client/ProfileScreen'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="Ordonnance" component={OrdonnanceScreen} />
    </Stack.Navigator>
  )
}

function CartStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CartMain" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
    </Stack.Navigator>
  )
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="OrdersList" component={OrdersScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
    </Stack.Navigator>
  )
}

export default function ClientTabs() {
  const { itemCount } = useCart()
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f3f4f6', height: 60, paddingBottom: 8 },
      }}
    >
      <Tab.Screen name="HomeTab" component={HomeStack} options={{ tabBarLabel: 'Accueil', tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} /> }} />
      <Tab.Screen name="SearchTab" component={SearchScreen} options={{ tabBarLabel: 'Recherche', tabBarIcon: ({ color, size }) => <SearchIcon color={color} size={size} /> }} />
      <Tab.Screen
        name="CartTab"
        component={CartStack}
        options={{
          tabBarLabel: 'Panier',
          tabBarIcon: ({ color, size }) => (
            <View style={{ position: 'relative' }}>
              <ShoppingCart color={color} size={size} />
              {itemCount > 0 && (
                <View style={{ position: 'absolute', top: -6, right: -6, backgroundColor: '#ef4444', borderRadius: 8, minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{itemCount}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tab.Screen name="OrdersTab" component={OrdersStack} options={{ tabBarLabel: 'Commandes', tabBarIcon: ({ color, size }) => <Package color={color} size={size} /> }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ tabBarLabel: 'Profil', tabBarIcon: ({ color, size }) => <User color={color} size={size} /> }} />
    </Tab.Navigator>
  )
}
