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
import { Building2, Clock, Bell, LogOut } from 'lucide-react-native';
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profil</Text>
        </View>

        {/* Profile Hero Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Building2 size={40} color="#ffffff" strokeWidth={1.5} />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{profile?.full_name || 'Pharmacie'}</Text>
            <View style={styles.badgeRow}>
              <View style={styles.pharmacyBadge}>
                <Text style={styles.badgeText}>Pharmacie</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Contact & Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations pharmacie</Text>
          <View style={styles.infoCard}>
            {profile?.phone && (
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Téléphone</Text>
                <Text style={styles.infoValue}>{profile.phone}</Text>
              </View>
            )}
            {profile?.phone && (
              <View style={[styles.infoItem, styles.infoItemBorder]}>
                <Text style={styles.infoLabel}>Horaires</Text>
                <Text style={styles.infoValue}>Lun - Dim: 08h - 20h</Text>
              </View>
            )}
          </View>
        </View>

        {/* Menu Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Préférences</Text>

          <TouchableOpacity style={styles.menuItem}>
            <Clock size={20} color="#16a34a" strokeWidth={2} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Horaires d'ouverture</Text>
              <Text style={styles.menuItemSubtitle}>Gérez vos heures de disponibilité</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Bell size={20} color="#16a34a" strokeWidth={2} />
            <View style={styles.menuItemContent}>
              <Text style={styles.menuItemTitle}>Notifications</Text>
              <Text style={styles.menuItemSubtitle}>Alertes de commandes et mises à jour</Text>
            </View>
            <Text style={styles.menuItemArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
        >
          <LogOut size={20} color="#ffffff" strokeWidth={2} />
          <Text style={styles.logoutButtonText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerVersion}>MediDom Pharmacy v1.0</Text>
          <Text style={styles.footerSubtext}>Application de gestion pour pharmacies</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
    gap: 14,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pharmacyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
    overflow: 'hidden',
  },
  infoItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  infoItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
  },
  infoLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 10,
    gap: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
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
    marginVertical: 20,
    paddingVertical: 14,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    gap: 10,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  footerVersion: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  footerSubtext: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
});

export default ProfileScreen;