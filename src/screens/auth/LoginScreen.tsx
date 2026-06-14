import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Pill,
  Building2,
  Bike,
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: any;
  route: any;
};

const DEMO_ACCOUNTS = {
  client: { email: 'client@demo.com', password: 'Demo1234!' },
  pharmacy: { email: 'pharmacy@demo.com', password: 'Demo1234!' },
  deliverer: { email: 'deliverer@demo.com', password: 'Demo1234!' },
  admin: { email: 'admin@demo.com', password: 'Demo1234!' },
};

const ROLE_CONFIG = {
  client: {
    color: '#2563eb',
    bgColor: '#2563eb',
    icon: Pill,
    title: 'Client',
  },
  pharmacy: {
    color: '#16a34a',
    bgColor: '#16a34a',
    icon: Building2,
    title: 'Pharmacie',
  },
  deliverer: {
    color: '#ea580c',
    bgColor: '#ea580c',
    icon: Bike,
    title: 'Livreur',
  },
  admin: {
    color: '#ffffff',
    bgColor: '#0f172a',
    icon: Shield,
    title: 'Admin',
  },
};

const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const role = route?.params?.role || 'client';
  const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
  const Icon = config.icon;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      // Navigate based on role
      if (role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else if (role === 'pharmacy') {
        navigation.navigate('PharmacyDashboard');
      } else if (role === 'deliverer') {
        navigation.navigate('DelivererDashboard');
      } else {
        navigation.navigate('ClientHome');
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setLoading(true);

    const demoAccount = DEMO_ACCOUNTS[role as keyof typeof DEMO_ACCOUNTS];

    try {
      // Try to sign in first
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: demoAccount.email,
        password: demoAccount.password,
      });

      if (!signInError && data.user) {
        // Sign in successful
        if (role === 'admin') {
          navigation.navigate('AdminDashboard');
        } else if (role === 'pharmacy') {
          navigation.navigate('PharmacyDashboard');
        } else if (role === 'deliverer') {
          navigation.navigate('DelivererDashboard');
        } else {
          navigation.navigate('ClientHome');
        }
        setLoading(false);
        return;
      }

      // If sign in fails, try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: demoAccount.email,
        password: demoAccount.password,
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (signUpData.user) {
        // Upsert profile
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(
            {
              id: signUpData.user.id,
              role,
              full_name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
              updated_at: new Date(),
            },
            { onConflict: 'id' }
          );

        if (profileError) {
          console.error('Profile error:', profileError);
        }

        if (role === 'admin') {
          navigation.navigate('AdminDashboard');
        } else if (role === 'pharmacy') {
          navigation.navigate('PharmacyDashboard');
        } else if (role === 'deliverer') {
          navigation.navigate('DelivererDashboard');
        } else {
          navigation.navigate('ClientHome');
        }
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
      setLoading(false);
    }
  };

  const isAdminTheme = role === 'admin';

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isAdminTheme ? '#0f172a' : config.bgColor },
      ]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <View style={styles.topSection}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ArrowLeft
              size={24}
              color={isAdminTheme ? '#ffffff' : '#ffffff'}
              strokeWidth={2}
            />
          </TouchableOpacity>

          <Icon
            size={56}
            color={isAdminTheme ? config.color : '#ffffff'}
            strokeWidth={1.5}
          />
          <Text
            style={[
              styles.topTitle,
              { color: isAdminTheme ? '#ffffff' : '#ffffff' },
            ]}
          >
            {config.title}
          </Text>
        </View>

        <View style={styles.cardContainer}>
          <Text style={styles.loginTitle}>Connexion</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="votre@email.com"
              placeholderTextColor="#cbd5e1"
              value={email}
              onChangeText={setEmail}
              editable={!loading}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mot de passe</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="••••••••"
                placeholderTextColor="#cbd5e1"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                disabled={!password}
              >
                {showPassword ? (
                  <Eye size={20} color="#64748b" strokeWidth={2} />
                ) : (
                  <EyeOff size={20} color="#64748b" strokeWidth={2} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.loginButton,
              { backgroundColor: config.bgColor, opacity: loading ? 0.7 : 1 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.loginButtonText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoButton}
            onPress={handleDemoLogin}
            disabled={loading}
          >
            <Text style={[styles.demoButtonText, { color: config.bgColor }]}>
              Essayer avec un compte démo
            </Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Pas encore de compte ? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Register', { role })}
            >
              <Text
                style={[styles.signupLink, { color: config.bgColor }]}
              >
                Créer un compte
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  topSection: {
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    padding: 8,
  },
  topTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 16,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 24,
  },
  loginTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 20,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fee2e2',
    borderRadius: 8,
    overflow: 'hidden',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1e293b',
  },
  loginButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  demoButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  demoButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
    color: '#64748b',
  },
  signupLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default LoginScreen;
