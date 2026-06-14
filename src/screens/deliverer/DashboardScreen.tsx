import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDateShort } from '../../lib/utils';
import { ToggleLeft, ToggleRight, Truck, TrendingUp, Star, ArrowRight, MapPin, AlertCircle } from 'lucide-react-native';

type Order = {
  id: string;
  delivery_fee: number;
  estimated_distance_km: number;
  status: string;
  created_at: string;
  pickup_location?: string;
  delivery_location?: string;
  pharmacies?: { name: string; address: string };
};

type Pharmacy = {
  id: string;
  name: string;
  address: string;
};

const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { profile, session } = useAuth();
  const dimensions = useWindowDimensions();
  const [available, setAvailable] = useState(false);
  const [deliveriesToday, setDeliveriesToday] = useState(0);
  const [earningsToday, setEarningsToday] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [session?.user?.id])
  );

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;

    try {
      if (!refreshing) setLoading(true);

      const delivererId = session.user.id;
      const today = new Date().toISOString().split('T')[0];

      // Fetch today's completed deliveries
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('delivery_fee')
        .eq('deliverer_id', delivererId)
        .eq('status', 'delivered')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      setDeliveriesToday(todayOrders?.length || 0);

      const totalEarnings = (todayOrders || []).reduce(
        (sum, order) => sum + (order.delivery_fee || 0),
        0
      );
      setEarningsToday(totalEarnings);

      // Fetch average rating
      const { data: ratingData } = await supabase
        .from('deliverer_ratings')
        .select('rating')
        .eq('deliverer_id', delivererId);

      if (ratingData && ratingData.length > 0) {
        const avgRating =
          ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length;
        setAverageRating(avgRating);
      } else {
        setAverageRating(0);
      }

      // Fetch available orders with pharmacy details
      const { data: orders, error } = await supabase
        .from('orders')
        .select(
          'id, delivery_fee, estimated_distance_km, status, created_at, pickup_location, delivery_location, pharmacy_id'
        )
        .eq('status', 'ready')
        .order('created_at', { ascending: true })
        .limit(10);

      if (error) throw error;

      // Fetch pharmacy names for each order
      if (orders && orders.length > 0) {
        const ordersWithPharmacy = await Promise.all(
          orders.map(async (order: any) => {
            if (order.pharmacy_id) {
              const { data: pharma } = await supabase
                .from('pharmacies')
                .select('name, address')
                .eq('id', order.pharmacy_id)
                .single();
              return { ...order, pharmacies: pharma };
            }
            return order;
          })
        );
        setAvailableOrders(ordersWithPharmacy);
      } else {
        setAvailableOrders([]);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [session?.user?.id]);

  const toggleAvailability = async () => {
    setUpdating(true);
    try {
      await supabase
        .from('profiles')
        .update({ is_available: !available })
        .eq('id', session?.user?.id);

      setAvailable(!available);
    } catch (error) {
      console.error('Error updating availability:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleAcceptOrder = (orderId: string) => {
    navigation.navigate('ActiveDelivery', { orderId });
  };

  const renderStatCard = (icon: React.ReactNode, label: string, value: string | number) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      style={styles.courseCard}
      activeOpacity={0.7}
      onPress={() => handleAcceptOrder(item.id)}
    >
      <View style={styles.courseCardContent}>
        {/* Origin: Pharmacy */}
        <View style={styles.locationSection}>
          <Text style={styles.pharmacyName}>
            {item.pharmacies?.name || 'Pharmacie'}
          </Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {item.pharmacies?.address || item.pickup_location || 'Adresse pharmacie'}
          </Text>
        </View>

        {/* Arrow and distance */}
        <View style={styles.routeSection}>
          <ArrowRight size={20} color="#94a3b8" strokeWidth={1.5} />
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>
              {item.estimated_distance_km?.toFixed(1) || '0'} km
            </Text>
          </View>
        </View>

        {/* Destination: Client area */}
        <View style={styles.locationSection}>
          <Text style={styles.destinationLabel}>Zone Livraison</Text>
          <Text style={styles.locationText} numberOfLines={1}>
            {item.delivery_location || 'Zone à déterminer'}
          </Text>
        </View>
      </View>

      {/* Bottom row: Earnings and button */}
      <View style={styles.courseFooter}>
        <View style={styles.earningsSection}>
          <Text style={styles.earningLabel}>Gain</Text>
          <Text style={styles.earningAmount}>
            +{formatXOF(item.delivery_fee)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => handleAcceptOrder(item.id)}
        >
          <Text style={styles.acceptButtonText}>Accepter</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderOfflineOverlay = () => (
    <View style={styles.offlineOverlay}>
      <View style={styles.offlineContent}>
        <AlertCircle size={48} color="#ea580c" strokeWidth={1.5} />
        <Text style={styles.offlineTitle}>Vous êtes hors ligne</Text>
        <Text style={styles.offlineSubtitle}>
          Activez votre disponibilité pour recevoir des courses
        </Text>
        <TouchableOpacity
          style={styles.offlineButton}
          onPress={toggleAvailability}
          disabled={updating}
        >
          <Text style={styles.offlineButtonText}>Devenir disponible</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ea580c" />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Courses Disponibles</Text>
            <Text style={styles.headerSubtitle}>{profile?.full_name || 'Livreur'}</Text>
          </View>
        </View>

        {/* Availability Toggle */}
        <View style={styles.availabilityCard}>
          <View>
            <Text style={styles.availabilityLabel}>Statut</Text>
            <Text style={styles.availabilityStatus}>
              {available ? 'Disponible' : 'Indisponible'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={toggleAvailability}
            disabled={updating}
          >
            {available ? (
              <ToggleRight size={40} color="#ea580c" strokeWidth={1.5} />
            ) : (
              <ToggleLeft size={40} color="#cbd5e1" strokeWidth={1.5} />
            )}
          </TouchableOpacity>
        </View>

        {/* Stats Bar */}
        {!loading && (
          <View style={styles.statsContainer}>
            {renderStatCard(
              <Truck size={24} color="#ea580c" strokeWidth={1.5} />,
              "Acceptées",
              deliveriesToday
            )}
            {renderStatCard(
              <TrendingUp size={24} color="#ea580c" strokeWidth={1.5} />,
              "Gains",
              formatXOF(earningsToday)
            )}
            {renderStatCard(
              <Star size={24} color="#ea580c" strokeWidth={1.5} />,
              'Note',
              averageRating.toFixed(1)
            )}
          </View>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : (
          <>
            {/* Courses Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Courses disponibles</Text>
              {availableOrders.length > 0 ? (
                <FlatList
                  data={availableOrders}
                  renderItem={renderOrderItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.coursesList}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Truck size={48} color="#cbd5e1" strokeWidth={1} />
                  <Text style={styles.emptyStateTitle}>Aucune course disponible</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Vérifiez que vous êtes disponible
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyRefreshButton}
                    onPress={onRefresh}
                  >
                    <Text style={styles.emptyRefreshButtonText}>Actualiser</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* Offline Overlay */}
      {!available && !loading && renderOfflineOverlay()}
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
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  availabilityCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  availabilityLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  availabilityStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  toggleButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
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
  statIcon: {
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ea580c',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10,
  },
  coursesList: {
    gap: 12,
  },
  courseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  courseCardContent: {
    marginBottom: 12,
  },
  locationSection: {
    marginBottom: 8,
  },
  pharmacyName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  destinationLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
    marginBottom: 2,
  },
  locationText: {
    fontSize: 12,
    color: '#64748b',
  },
  routeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  distanceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 6,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  earningsSection: {
    flexDirection: 'column',
  },
  earningLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  earningAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
  },
  acceptButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ea580c',
    borderRadius: 6,
  },
  acceptButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyStateSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyRefreshButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#ea580c',
    borderRadius: 6,
    marginTop: 8,
  },
  emptyRefreshButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  offlineOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  offlineContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  offlineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  offlineSubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  offlineButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#ea580c',
    borderRadius: 8,
    marginTop: 8,
  },
  offlineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
});

export default DashboardScreen;