import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate } from '../../lib/utils';
import { Clock, CheckCircle, Package } from 'lucide-react-native';

type Order = {
  id: string;
  client_id: string;
  total_amount: number;
  status: string;
  created_at: string;
};

const DashboardScreen: React.FC = () => {
  const { profile, session } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [stockCount, setStockCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [session?.user?.id]);

  const fetchDashboardData = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const pharmacyId = session.user.id;

      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'pending')
        .limit(1000);

      setPendingCount(pendingOrders?.length || 0);

      const today = new Date().toISOString().split('T')[0];
      const { data: todayOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .limit(1000);

      setTodayCount(todayOrders?.length || 0);

      const { data: stockProducts } = await supabase
        .from('pharmacy_stock')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .gt('quantity', 0)
        .limit(1000);

      setStockCount(stockProducts?.length || 0);

      const { data: orders } = await supabase
        .from('orders')
        .select('id, client_id, total_amount, status, created_at')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(orders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (icon: React.ReactNode, label: string, value: number) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderLabel}>Commande #{item.id.substring(0, 8).toUpperCase()}</Text>
        <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.orderAmount}>{formatXOF(item.total_amount)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Tableau de Bord</Text>
            <Text style={styles.headerSubtitle}>
              {profile?.full_name || 'Pharmacie'}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              {renderStatCard(
                <Clock size={24} color="#16a34a" strokeWidth={1.5} />,
                'En attente',
                pendingCount
              )}
              {renderStatCard(
                <CheckCircle size={24} color="#16a34a" strokeWidth={1.5} />,
                "Aujourd'hui",
                todayCount
              )}
              {renderStatCard(
                <Package size={24} color="#16a34a" strokeWidth={1.5} />,
                'En stock',
                stockCount
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Commandes récentes</Text>
              {recentOrders.length > 0 ? (
                <FlatList
                  data={recentOrders}
                  renderItem={renderOrderItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.ordersList}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Aucune commande</Text>
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
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
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
    fontSize: 20,
    fontWeight: '700',
    color: '#16a34a',
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
    borderColor: '#dcfce7',
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
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#dcfce7',
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#166534',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
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