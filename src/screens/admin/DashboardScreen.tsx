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
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate } from '../../lib/utils';
import { BarChart3, Users, Building2, TrendingUp } from 'lucide-react-native';

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
};

const DashboardScreen: React.FC = () => {
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalPharmacies, setTotalPharmacies] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { count: ordersCount } = await supabase
        .from('orders')
        .select('id', { count: 'exact' });

      setTotalOrders(ordersCount || 0);

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
        (sum, order) => sum + order.total_amount,
        0
      );
      setMonthlyRevenue(revenue);

      const { data: orders } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      setRecentOrders(orders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStatCard = (icon: React.ReactNode, label: string, value: number | string) => (
    <View style={styles.statCard}>
      <View style={styles.statIcon}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  const renderOrderItem = ({ item }: { item: Order }) => (
    <View style={styles.orderItem}>
      <View style={styles.orderInfo}>
        <Text style={styles.orderLabel}>
          Commande #{item.id.substring(0, 8).toUpperCase()}
        </Text>
        <Text style={styles.orderStatus}>{item.status}</Text>
      </View>
      <View style={styles.orderAmount}>
        <Text style={styles.orderAmountValue}>{formatXOF(item.total_amount)}</Text>
        <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tableau de Bord Admin</Text>
          <Text style={styles.headerSubtitle}>Vue d'ensemble du système</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#e11d48" />
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                {renderStatCard(
                  <BarChart3 size={24} color="#e11d48" strokeWidth={1.5} />,
                  'Commandes',
                  totalOrders
                )}
                {renderStatCard(
                  <Users size={24} color="#e11d48" strokeWidth={1.5} />,
                  'Utilisateurs',
                  totalUsers
                )}
              </View>
              <View style={styles.statsRow}>
                {renderStatCard(
                  <Building2 size={24} color="#e11d48" strokeWidth={1.5} />,
                  'Pharmacies',
                  totalPharmacies
                )}
                {renderStatCard(
                  <TrendingUp size={24} color="#e11d48" strokeWidth={1.5} />,
                  'Revenu ce mois',
                  formatXOF(monthlyRevenue)
                )}
              </View>
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
    backgroundColor: '#1e293b',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6,
    textAlign: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f1f5f9',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f1f5f9',
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
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  orderInfo: {
    flex: 1,
  },
  orderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  orderStatus: {
    fontSize: 11,
    color: '#94a3b8',
  },
  orderAmount: {
    alignItems: 'flex-end',
  },
  orderAmountValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f87171',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 10,
    color: '#64748b',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default DashboardScreen;