import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MapPin, Bell, Settings, HelpCircle, Info, FileText, LogOut } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { profile, signOut } = useAuth();

  const handleLogout = async () => {
    Alert.alert(
      'Se déconnecter',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        {
          text: 'Annuler',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Déconnecter',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error logging out:', error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de la déconnexion');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const profileInitial = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : 'C';

  const menuItems = [
    {
      id: 'addresses',
      label: 'Mes adresses',
      icon: MapPin,
      onPress: () => {},
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      onPress: () => {},
    },
    {
      id: 'settings',
      label: 'Paramètres',
      icon: Settings,
      onPress: () => {},
    },
  ];

  const infoItems = [
    {
      id: 'faq',
      label: 'FAQ',
      onPress: () => {},
    },
    {
      id: 'about',
      label: 'À propos',
      onPress: () => {},
    },
    {
      id: 'terms',
      label: 'Conditions d\'utilisation',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{profileInitial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || 'Client'}</Text>
            <Text style={styles.profilePhone}>
              {profile?.phone || 'Non renseigné'}
            </Text>
          </View>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>Client</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paramètres</Text>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItem}
                onPress={item.onPress}
              >
                <Icon size={20} color="#2563eb" strokeWidth={1.5} />
                <Text style={styles.menuItemText}>{item.label}</Text>
                <Text style={styles.menuItemArrow}>›</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations</Text>
          {infoItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
            >
              <Text style={styles.menuItemText}>{item.label}</Text>
              <Text style={styles.menuItemArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#ffffff" strokeWidth={1.5} />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Pharmacie à Domicile v1.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 12,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 12,
    color: '#64748b',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },
  menuItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  menuItemArrow: {
    fontSize: 20,
    color: '#cbd5e1',
    fontWeight: '300',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 12,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});

export default ProfileScreen;