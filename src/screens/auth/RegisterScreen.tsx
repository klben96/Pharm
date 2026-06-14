import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  Pill,
  Building2,
  Bike,
  Shield,
  ArrowLeft,
} from 'lucide-react-native';
import { supabase } from '../../lib/supabase';

type Props = {
  navigation: any;
  route: any;
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

const RegisterScreen: React.FC<Props> = ({ navigation, route }) => {
  const role = route?.params?.role || 'client';
  const config = ROLE_CONFIG[role as keyof typeof ROLE_CONFIG];
  const Icon = config.icon;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      setError('Veuillez entrer votre nom complet');
      return false;
    }
    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Veuillez entrer un email valide');
      return false;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
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
              full_name: fullName,
              phone: phone || null,
              updated_at: new Date(),
            },
            { onConflict: 'id' }
          );

        if (profileError) {
          console.error('Profile error:', profileError);
          setError('Erreur lors de la création du profil');
          setLoading(false);
          return;
        }

        // Navigate to dashboard based on role
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

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.cardContainer}>
            <Text style={styles.registerTitle}>Créer un compte</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput
                style={styles.input}
                placeholder="Jean Dupont"
                placeholderTextColor="#cbd5e1"
                value={fullName}
                onChangeText={setFullName}
                editable={!loading}
                autoCapitalize="words"
              />
            </View>

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
              <Text style={styles.label}>Téléphone (optionnel)</Text>
              <TextInput
                style={styles.input}
                placeholder="+33 6 12 34 56 78"
                placeholderTextColor="#cbd5e1"
                value={phone}
                onChangeText={setPhone}
                editable={!loading}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe (min 8 caractères)</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#cbd5e1"
                value={password}
                onChangeText={setPassword}
                editable={!loading}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#cbd5e1"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[
                styles.registerButton,
                { backgroundColor: config.bgColor, opacity: loading ? 0.7 : 1 },
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.registerButtonText}>Créer un compte</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Vous avez déjà un compte ? </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate('Login', { role })}
              >
                <Text
                  style={[styles.loginLink, { color: config.bgColor }]}
                >
                  Se connecter
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
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
    paddingBottom: 32,
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
  scrollView: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  scrollContent: {
    paddingBottom: 32,
  },
  cardContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  registerTitle: {
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
    marginBottom: 16,
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
  registerButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 8,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
    color: '#64748b',
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RegisterScreen;
