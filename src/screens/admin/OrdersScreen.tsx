import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate } from '../../lib/utils';

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
};

const OrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, total_amount, status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    const statusStyles: Record<string, { bg: string; text: string }> = {
      pending: { bg: '#fef3c7', text: '#92400e' },
      confirmed: { bg: '#dbeafe', text: '#1e40af' },
      preparing: { bg: '#e0e7ff', text: '#3730a3' },
      ready: { bg: '#dcfce7', text: '#166534' },
      delivering: { bg: '#fed7aa', text: '#92400e' },
      delivered: { bg: '#dcfce7', text: '#166534' },
      cancelled: { bg: '#fee2e2', text: '#991b1b' },
    };
    return statusStyles[status] || { bg: '#334155', text: '#f1f5f9' };
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusBadgeStyle(item.status);
    const shortId = item.id.substring(0, 12).toUpperCase();

    return (
      <View style={styles.orderItem}>
        <View style={styles.orderInfo}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderLabel}>{shortId}</Text>
            <View
              style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
            >
              <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                {item.status}
              </Text>
            </View>
          </View>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>

        <Text style={styles.orderAmount}>{formatXOF(item.total_amount)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Commandes</Text>
        <Text style={styles.headerSubtitle}>
          Total: {orders.length} commandes
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      ) : orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune commande</Text>
        </View>
      )}
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
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  orderInfo: {
    flex: 1,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  orderLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderDate: {
    fontSize: 11,
    color: '#94a3b8',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f87171',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default OrdersScreen;