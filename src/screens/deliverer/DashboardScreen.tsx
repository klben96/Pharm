import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate } from '../../lib/utils';
import { ToggleLeft, ToggleRight, Truck, TrendingUp, Star } from 'lucide-react-native';

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
};

const DashboardScreen: React.FC = () => {
  const { profile, session } = useAuth();
  const [available, setAvailable] = useState(false);
  const [deliveriesToday, setDeliveriesToday] = useState(0);
  const [earningsToday, setEarningsToday] = useState(0);
  const [averageRating, setAverageRating] = useState(0);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [session?.user?.id]);

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const delivererId = session.user.id;

      const today = new Date().toISOString().split('T')[0];
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('id, total_amount')
        .eq('deliverer_id', delivererId)
        .eq('status', 'delivered')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);

      setDeliveriesToday(todayOrders?.length || 0);

      const totalEarnings = (todayOrders || []).reduce(
        (sum, order) => sum + (order.total_amount * 0.1),
        0
      );
      setEarningsToday(totalEarnings);

      const { data: ratingData } = await supabase
        .from('deliverer_ratings')
        .select('rating')
        .eq('deliverer_id', delivererId);

      if (ratingData && ratingData.length > 0) {
        const avgRating =
          ratingData.reduce((sum, r) => sum + r.rating, 0) / ratingData.length;
        setAverageRating(avgRating);
      }

      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .eq('status', 'ready')
        .order('created_at', { ascending: true })
        .limit(5);

      setAvailableOrders(orders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async () => {
    setUpdating(true);
    try {
      await supabase
        .from('deliverers')
        .update({ is_available: !available })
        .eq('id', session?.user?.id);

      setAvailable(!available);
    } catch (error) {
      console.error('Error updating availability:', error);
    } finally {
      setUpdating(false);
    }
  };

  const renderStatCard = (icon: React.ReactNode, label: string, value: string | number) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity style={styles.orderItem}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderLabel}>
          Commande #{item.id.substring(0, 8).toUpperCase()}
        </Text>
        <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.orderAmount}>{formatXOF(item.total_amount)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Tableau de Bord</Text>
            <Text style={styles.headerSubtitle}>
              {profile?.full_name || 'Livreur'}
            </Text>
          </View>
        </View>

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

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              {renderStatCard(
                <Truck size={24} color="#ea580c" strokeWidth={1.5} />,
                "Livraisons aujourd'hui",
                deliveriesToday
              )}
              {renderStatCard(
                <TrendingUp size={24} color="#ea580c" strokeWidth={1.5} />,
                "Gains aujourd'hui",
                formatXOF(earningsToday)
              )}
              {renderStatCard(
                <Star size={24} color="#ea580c" strokeWidth={1.5} />,
                'Note moyenne',
                averageRating.toFixed(1)
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Commandes disponibles</Text>
              {availableOrders.length > 0 ? (
                <FlatList
                  data={availableOrders}
                  renderItem={renderOrderItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.ordersList}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>
                    Aucune commande disponible
                  </Text>
                </View>
              )}
            </View>
          </>
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
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
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
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10,
  },
  ordersList: {
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  orderInfo: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  orderTime: {
    fontSize: 11,
    color: '#64748b',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ea580c',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DashboardScreen;