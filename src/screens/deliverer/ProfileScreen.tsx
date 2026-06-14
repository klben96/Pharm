import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF } from '../../lib/utils';
import {
  Truck,
  LogOut,
  Star,
  FileText,
  Settings,
  Package,
  TrendingUp,
  MapPin,
} from 'lucide-react-native';

type DelivererProfile = {
  id: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  rating?: number;
  total_deliveries?: number;
  total_earnings?: number;
};

const ProfileScreen: React.FC = () => {
  const { profile, signOut, session } = useAuth();
  const [delivererData, setDelivererData] = useState<DelivererProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDelivererData();
  }, [session?.user?.id]);

  const fetchDelivererData = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileData) {
        // Fetch total deliveries
        const { data: deliveries } = await supabase
          .from('orders')
          .select('id')
          .eq('deliverer_id', session.user.id)
          .eq('status', 'delivered');

        // Fetch total earnings
        const { data: earnings } = await supabase
          .from('orders')
          .select('delivery_fee')
          .eq('deliverer_id', session.user.id)
          .eq('status', 'delivered');

        const totalEarnings = (earnings || []).reduce(
          (sum, order) => sum + (order.delivery_fee || 0),
          0
        );

        // Fetch ratings
        const { data: ratings } = await supabase
          .from('deliverer_ratings')
          .select('rating')
          .eq('deliverer_id', session.user.id);

        let avgRating = 0;
        if (ratings && ratings.length > 0) {
          avgRating =
            ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        }

        setDelivererData({
          ...profileData,
          total_deliveries: deliveries?.length || 0,
          total_earnings: totalEarnings,
          rating: avgRating,
        });
      }
    } catch (error) {
      console.error('Error fetching deliverer data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const renderMenuItem = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemIcon}>{icon}</View>
      <Text style={styles.menuItemLabel}>{label}</Text>
      <Text style={styles.menuItemArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          color={i < Math.floor(rating) ? '#ea580c' : '#cbd5e1'}
          fill={i < Math.floor(rating) ? '#ea580c' : 'none'}
          strokeWidth={1.5}
        />
      );
    }
    return stars;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Profil</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : delivererData ? (
          <>
            {/* Hero Card */}
            <View style={styles.heroCard}>
              <View style={styles.avatarContainer}>
                <Truck size={40} color="#ffffff" strokeWidth={1.5} />
              </View>
              <View style={styles.profileHeader}>
                <View style={styles.nameAndBadge}>
                  <Text style={styles.profileName}>{delivererData.full_name}</Text>
                  <View style={styles.badgeContainer}>
                    <Text style={styles.badge}>Livreur</Text>
                  </View>
                </View>
                <Text style={styles.profilePhone}>
                  {delivererData.phone || 'Non renseigné'}
                </Text>
                {delivererData.rating && delivererData.rating > 0 && (
                  <View style={styles.ratingRow}>
                    <View style={styles.starsContainer}>
                      {renderRatingStars(delivererData.rating)}
                    </View>
                    <Text style={styles.ratingValue}>
                      {delivererData.rating.toFixed(1)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statsCard}>
                <Package size={24} color="#ea580c" strokeWidth={1.5} />
                <Text style={styles.statsLabel}>Livraisons</Text>
                <Text style={styles.statsValue}>
                  {delivererData.total_deliveries || 0}
                </Text>
              </View>
              <View style={styles.statsCard}>
                <TrendingUp size={24} color="#ea580c" strokeWidth={1.5} />
                <Text style={styles.statsLabel}>Gains totaux</Text>
                <Text style={styles.statsValue}>
                  {formatXOF(delivererData.total_earnings || 0)}
                </Text>
              </View>
            </View>

            {/* Menu Section */}
            <View style={styles.menuSection}>
              <Text style={styles.menuSectionTitle}>Compte</Text>

              {renderMenuItem(
                <Truck size={20} color="#ea580c" strokeWidth={1.5} />,
                'Mon véhicule',
                () => Alert.alert('Info', 'Gestion des véhicules à implémenter')
              )}

              {renderMenuItem(
                <FileText size={20} color="#ea580c" strokeWidth={1.5} />,
                'Documents',
                () => Alert.alert('Info', 'Gestion des documents à implémenter')
              )}

              {renderMenuItem(
                <Settings size={20} color="#ea580c" strokeWidth={1.5} />,
                'Paramètres',
                () => Alert.alert('Info', 'Paramètres à implémenter')
              )}
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStatsSection}>
              <View style={styles.quickStatRow}>
                <View style={styles.quickStatIcon}>
                  <MapPin size={18} color="#ea580c" strokeWidth={1.5} />
                </View>
                <View style={styles.quickStatContent}>
                  <Text style={styles.quickStatLabel}>Distance parcourue</Text>
                  <Text style={styles.quickStatValue}>
                    {(delivererData.total_deliveries * 2.5).toFixed(0)} km
                  </Text>
                </View>
              </View>
            </View>

            {/* Logout Button */}
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <LogOut size={20} color="#ffffff" strokeWidth={1.5} />
              <Text style={styles.logoutButtonText}>Se déconnecter</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>MediDom - Livreur v1.0</Text>
              <Text style={styles.footerSubtext}>
                © 2024 MediDom Pharmacy. Tous droits réservés.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Impossible de charger le profil</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef3f2',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
  },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    flex: 1,
  },
  nameAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeContainer: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#fed7aa',
    borderRadius: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400e',
  },
  profilePhone: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ea580c',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statsCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statsLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 6,
    marginBottom: 3,
  },
  statsValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ea580c',
  },
  menuSection: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  menuSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 6,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  menuItemIcon: {
    marginRight: 12,
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#0f172a',
  },
  menuItemArrow: {
    fontSize: 18,
    color: '#cbd5e1',
  },
  quickStatsSection: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  quickStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 12,
  },
  quickStatIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fef3f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatContent: {
    flex: 1,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  quickStatValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
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
    paddingVertical: 24,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 11,
    color: '#94a3b8',
  },
});

export default ProfileScreen;