import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../contexts/AuthContext';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ClientTabs from './ClientTabs';
import PharmacyTabs from './PharmacyTabs';
import DelivererTabs from './DelivererTabs';
import AdminTabs from './AdminTabs';

const Stack = createStackNavigator();

const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};

const RoleNavigator = ({ role }: { role: string }) => {
  switch (role) {
    case 'client':
      return <ClientTabs />;
    case 'pharmacy':
      return <PharmacyTabs />;
    case 'deliverer':
      return <DelivererTabs />;
    case 'admin':
      return <AdminTabs />;
    default:
      return <AuthStack />;
  }
};

const AppNavigator = () => {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {!session || !profile ? (
        <AuthStack />
      ) : (
        <RoleNavigator role={profile.role} />
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;