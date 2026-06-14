import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate, ORDER_STATUSES } from '../../lib/utils';
import { AlertCircle, CheckCircle2, Package } from 'lucide-react-native';

type Order = {
  id: string;
  client_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
  };
};

const DashboardScreen: React.FC = () => {
  const { profile, session } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);
  const [preparingCount, setPreparingCount] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const pharmacyId = session.user.id;

      // Pending orders
      const { data: pendingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'pending')
        .limit(1000);

      setPendingCount(pendingOrders?.length || 0);

      // Preparing orders
      const { data: preparingOrders } = await supabase
        .from('orders')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'preparing')
        .limit(1000);

      setPreparingCount(preparingOrders?.length || 0);

      // Delivered today
      const today = new Date().toISOString().split('T')[0];
      const { data: deliveredToday } = await supabase
        .from('orders')
        .select('id')
        .eq('pharmacy_id', pharmacyId)
        .eq('status', 'delivered')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`)
        .limit(1000);

      setDeliveredCount(deliveredToday?.length || 0);

      // Recent orders with client names
      const { data: orders } = await supabase
        .from('orders')
        .select('id, client_id, total_amount, status, created_at, profiles(full_name)')
        .eq('pharmacy_id', pharmacyId)
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentOrders(orders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const renderStatCard = (icon: React.ReactNode, label: string, value: number, variant: 'pending' | 'preparing' | 'delivered') => {
    const variantStyles: Record<string, { bg: string; iconColor: string }> = {
      pending: { bg: '#fef3c7', iconColor: '#f59e0b' },
      preparing: { bg: '#e0e7ff', iconColor: '#6366f1' },
      delivered: { bg: '#dcfce7', iconColor: '#16a34a' },
    };

    const style = variantStyles[variant];

    return (
      <View style={[styles.statCard, { backgroundColor: style.bg }]}>
        <View style={styles.statIcon}>{icon}</View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color: style.iconColor }]}>{value}</Text>
      </View>
    );
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusInfo = ORDER_STATUSES[item.status] || ORDER_STATUSES.pending;
    const clientName = (item.profiles as any)?.full_name || 'Client';

    return (
      <View style={styles.orderItem}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>#{item.id.substring(0, 8).toUpperCase()}</Text>
          <Text style={styles.orderClient}>{clientName}</Text>
          <Text style={styles.orderTime}>{formatDate(item.created_at)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        <View style={styles.orderAmount}>
          <Text style={styles.amountText}>{formatXOF(item.total_amount)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tableau de Bord</Text>
          <Text style={styles.headerSubtitle}>
            {profile?.full_name || 'Pharmacie'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        ) : (
          <>
            <View style={styles.statsContainer}>
              {renderStatCard(
                <AlertCircle size={24} color="#f59e0b" strokeWidth={2} />,
                'En attente',
                pendingCount,
                'pending'
              )}
              {renderStatCard(
                <Package size={24} color="#6366f1" strokeWidth={2} />,
                'En préparation',
                preparingCount,
                'preparing'
              )}
              {renderStatCard(
                <CheckCircle2 size={24} color="#16a34a" strokeWidth={2} />,
                "Livrées auj.",
                deliveredCount,
                'delivered'
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
                  <Text style={styles.emptyStateText}>Aucune commande pour le moment</Text>
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
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16a34a',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 12,
  },
  ordersList: {
    gap: 10,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  orderInfo: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  orderClient: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
    fontWeight: '500',
  },
  orderTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  emptyState: {
    paddingVertical: 40,
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
    minHeight: 300,
  },
});

export default DashboardScreen;