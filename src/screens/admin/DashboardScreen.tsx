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
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate } from '../../lib/utils';
import {
  BarChart3,
  Users,
  Building2,
  TrendingUp,
  Activity,
  AlertCircle,
  Zap,
} from 'lucide-react-native';

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  client_id?: string;
};

type Alert = {
  id: string;
  type: 'stock' | 'dispute' | 'transaction';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
};

const DashboardScreen: React.FC = () => {
  const [totalOrders, setTotalOrders] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPharmacies, setTotalPharmacies] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact' });

      setTotalOrders(ordersCount || 0);

      // Active orders (not delivered or cancelled)
      const { count: activeCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact' })
        .in('status', ['pending', 'validated', 'preparing', 'ready', 'picked_up', 'delivering']);

      setActiveOrders(activeCount || 0);

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' });

      setTotalUsers(usersCount || 0);

      const { count: pharmaciesCount } = await supabase
        .from('pharmacies')
        .select('id', { count: 'exact' });

      setTotalPharmacies(pharmaciesCount || 0);

      const currentMonth = new Date().toISOString().split('-').slice(0, 2).join('-');
      const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('total_amount')
        .like('created_at', `${currentMonth}%`);

      const revenue = (monthlyOrders || []).reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );
      setMonthlyRevenue(revenue);

      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at, client_id')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentOrders(orders || []);

      // Load system alerts (hardcoded examples)
      const systemAlerts: Alert[] = [
        {
          id: '1',
          type: 'stock',
          message: 'Rupture de stock: Paracétamol (500mg) - Pharmacie Centre',
          severity: 'high',
          timestamp: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'dispute',
          message: 'Litige ouvert: Commande CMD-12345 (Produit défectueux)',
          severity: 'high',
          timestamp: new Date().toISOString(),
        },
        {
          id: '3',
          type: 'transaction',
          message: '3 demandes de retrait en attente de validation',
          severity: 'medium',
          timestamp: new Date().toISOString(),
        },
      ];

      setAlerts(systemAlerts);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchDashboardData();
      setLoading(false);
    };
    loadData();
  }, [fetchDashboardData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }, [fetchDashboardData]);

  const renderStatCard = (
    icon: React.ReactNode,
    label: string,
    value: number | string,
    color: string
  ) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderOrderItem = ({ item }: { item: Order }) => {
    const getStatusColor = (status: string) => {
      const colors: Record<string, string> = {
        pending: '#92400e',
        validated: '#1e40af',
        preparing: '#3730a3',
        ready: '#166534',
        picked_up: '#6b21a8',
        delivering: '#c2410c',
        delivered: '#166534',
        cancelled: '#991b1b',
      };
      return colors[status] || '#64748b';
    };

    return (
      <View style={styles.orderItem}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderLabel}>
            Cmd #{item.id.substring(0, 8).toUpperCase()}
          </Text>
          <Text style={[styles.orderStatus, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
        <View style={styles.orderAmount}>
          <Text style={styles.orderAmountValue}>{formatXOF(item.total_amount)}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  const renderAlertItem = ({ item }: { item: Alert }) => {
    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'high':
          return '#ef4444';
        case 'medium':
          return '#f59e0b';
        default:
          return '#3b82f6';
      }
    };

    return (
      <View
        style={[
          styles.alertItem,
          { borderLeftColor: getSeverityColor(item.severity) },
        ]}
      >
        <AlertCircle
          size={16}
          color={getSeverityColor(item.severity)}
          strokeWidth={2}
        />
        <Text style={styles.alertText}>{item.message}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>MediDom Admin</Text>
              <Text style={styles.godModeText}>God Mode</Text>
            </View>
            <Zap size={28} color="#fbbf24" strokeWidth={2} />
          </View>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                {renderStatCard(
                  <BarChart3 size={24} color="#3b82f6" strokeWidth={1.5} />,
                  'Total Commandes',
                  totalOrders,
                  '#3b82f6'
                )}
                {renderStatCard(
                  <Activity size={24} color="#10b981" strokeWidth={1.5} />,
                  'Commandes Actives',
                  activeOrders,
                  '#10b981'
                )}
              </View>

              <View style={styles.statsRow}>
                {renderStatCard(
                  <Users size={24} color="#a855f7" strokeWidth={1.5} />,
                  'Utilisateurs Enregistrés',
                  totalUsers,
                  '#a855f7'
                )}
                {renderStatCard(
                  <Building2 size={24} color="#f97316" strokeWidth={1.5} />,
                  'Pharmacies Partenaires',
                  totalPharmacies,
                  '#f97316'
                )}
              </View>

              <View style={styles.fullWidthCard}>
                {renderStatCard(
                  <TrendingUp size={24} color="#fbbf24" strokeWidth={1.5} />,
                  'Volume Financier du Mois',
                  formatXOF(monthlyRevenue),
                  '#fbbf24'
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Commandes Récentes</Text>
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alertes Système</Text>
              {alerts.length > 0 ? (
                <FlatList
                  data={alerts}
                  renderItem={renderAlertItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.alertsList}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Aucune alerte</Text>
                </View>
              )}
            </View>
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  godModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fbbf24',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  centerContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fullWidthCard: {
    width: '100%',
  },
  statCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  orderInfo: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  orderStatus: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  orderAmount: {
    alignItems: 'flex-end',
  },
  orderAmountValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#3b82f6',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 9,
    color: '#64748b',
  },
  alertsList: {
    gap: 8,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    borderLeftWidth: 3,
    gap: 10,
  },
  alertText: {
    flex: 1,
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
    lineHeight: 16,
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  bottomPadding: {
    height: 20,
  },
});

export default DashboardScreen;