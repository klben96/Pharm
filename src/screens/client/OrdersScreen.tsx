import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate, ORDER_STATUSES } from '../../lib/utils';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivering' | 'delivered' | 'cancelled';

type Order = {
  id: string;
  created_at: string;
  total_amount: number;
  status: OrderStatus;
};

type TabType = 'active' | 'history';

const OrdersScreen: React.FC = () => {
  const { session } = useAuth();
  const [selectedTab, setSelectedTab] = useState<TabType>('active');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [session?.user?.id, selectedTab]);

  const fetchOrders = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('id, created_at, total_amount, status')
        .eq('client_id', session.user.id);

      if (selectedTab === 'active') {
        query = query.in('status', ['pending', 'confirmed', 'preparing', 'ready', 'delivering']);
      } else {
        query = query.in('status', ['delivered', 'cancelled']);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    const statusStyles: Record<OrderStatus, { bg: string; text: string }> = {
      pending: { bg: '#fef3c7', text: '#92400e' },
      confirmed: { bg: '#dbeafe', text: '#1e40af' },
      preparing: { bg: '#e0e7ff', text: '#3730a3' },
      ready: { bg: '#dcfce7', text: '#166534' },
      delivering: { bg: '#fed7aa', text: '#92400e' },
      delivered: { bg: '#dcfce7', text: '#166534' },
      cancelled: { bg: '#fee2e2', text: '#991b1b' },
    };
    return statusStyles[status] || { bg: '#f3f4f6', text: '#374151' };
  };

  const getStatusLabel = (status: OrderStatus): string => {
    const statusLabels: Record<OrderStatus, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      preparing: 'En préparation',
      ready: 'Prête',
      delivering: 'En livraison',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return statusLabels[status] || status;
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const statusStyle = getStatusBadgeStyle(item.status);
    const shortId = item.id.substring(0, 8).toUpperCase();

    return (
      <TouchableOpacity style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Commande #{shortId}</Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          >
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>{formatXOF(item.total_amount)}</Text>
          <TouchableOpacity style={styles.detailsButton}>
            <Text style={styles.detailsButtonText}>Détails</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {selectedTab === 'active'
          ? 'Aucune commande en cours'
          : 'Aucune commande terminée'}
      </Text>
      <Text style={styles.emptySubtext}>
        {selectedTab === 'active'
          ? 'Commencez à acheter des médicaments'
          : 'Vos commandes livrées apparaîtront ici'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mes commandes</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'active' && styles.tabActive]}
          onPress={() => setSelectedTab('active')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'active' && styles.tabTextActive,
            ]}
          >
            En cours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'history' && styles.tabActive]}
          onPress={() => setSelectedTab('history')}
        >
          <Text
            style={[
              styles.tabText,
              selectedTab === 'history' && styles.tabTextActive,
            ]}
          >
            Historique
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        renderEmpty()
      )}
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#2563eb',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#2563eb',
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  orderCard: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  orderDate: {
    fontSize: 12,
    color: '#64748b',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
  },
  detailsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  detailsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
});

export default OrdersScreen;