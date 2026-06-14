import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate } from '../../lib/utils';
import { Search } from 'lucide-react-native';

type Order = {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  client_id?: string;
  client_name?: string;
  pharmacy_id?: string;
  pharmacy_name?: string;
};

const OrdersScreen: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(
          `id, total_amount, status, created_at,
           client_id,
           pharmacy_id`
        )
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch client and pharmacy names for each order
      const enrichedOrders = await Promise.all(
        (data || []).map(async (order) => {
          let clientName = 'Inconnu';
          let pharmacyName = 'Inconnu';

          if (order.client_id) {
            const { data: clientData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', order.client_id)
              .maybeSingle();
            clientName = clientData?.full_name || 'Inconnu';
          }

          if (order.pharmacy_id) {
            const { data: pharmacyData } = await supabase
              .from('pharmacies')
              .select('name')
              .eq('id', order.pharmacy_id)
              .maybeSingle();
            pharmacyName = pharmacyData?.name || 'Inconnu';
          }

          return {
            ...order,
            client_name: clientName,
            pharmacy_name: pharmacyName,
          };
        })
      );

      setOrders(enrichedOrders);
      applyFilters(enrichedOrders, searchText, selectedStatus);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Alert.alert('Erreur', 'Impossible de charger les commandes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    applyFilters(orders, searchText, selectedStatus);
  }, [searchText, selectedStatus, orders]);

  const applyFilters = (
    orderList: Order[],
    search: string,
    status: string | null
  ) => {
    let filtered = orderList;

    if (search.trim()) {
      const searchUpper = search.toUpperCase();
      filtered = filtered.filter(
        (o) =>
          o.id.toUpperCase().includes(searchUpper) ||
          o.client_name?.toUpperCase().includes(searchUpper)
      );
    }

    if (status && status !== 'Tous') {
      const statusMap: Record<string, string> = {
        'En attente': 'pending',
        'En cours': 'validated',
        Livrées: 'delivered',
        Annulées: 'cancelled',
      };
      filtered = filtered.filter((o) => o.status === statusMap[status]);
    }

    setFilteredOrders(filtered);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [fetchOrders]);

  const getStatusBadgeStyle = (status: string) => {
    const statusStyles: Record<string, { bg: string; text: string; icon: string }> = {
      pending: { bg: '#fef3c7', text: '#92400e', icon: '⏳' },
      validated: { bg: '#dbeafe', text: '#1e40af', icon: '✓' },
      preparing: { bg: '#e0e7ff', text: '#3730a3', icon: '⚙️' },
      ready: { bg: '#dcfce7', text: '#166534', icon: '📦' },
      picked_up: { bg: '#f3e8ff', text: '#6b21a8', icon: '🚚' },
      delivering: { bg: '#fed7aa', text: '#92400e', icon: '📍' },
      delivered: { bg: '#dcfce7', text: '#166534', icon: '✅' },
      cancelled: { bg: '#fee2e2', text: '#991b1b', icon: '✖' },
    };
    return statusStyles[status] || { bg: '#334155', text: '#f1f5f9', icon: '?' };
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      pending: 'En attente',
      validated: 'Validée',
      preparing: 'En préparation',
      ready: 'Prête',
      picked_up: 'Récupérée',
      delivering: 'En livraison',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status;
  };

  const renderOrderItem = ({ item }: { item: Order }) => {
    const statusStyle = getStatusBadgeStyle(item.status);

    return (
      <View style={styles.orderItem}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>{item.id.substring(0, 12).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View>
            <Text style={styles.detailLabel}>Client</Text>
            <Text style={styles.detailValue}>{item.client_name || 'Inconnu'}</Text>
          </View>
          <View>
            <Text style={styles.detailLabel}>Pharmacie</Text>
            <Text style={styles.detailValue}>{item.pharmacy_name || 'Inconnu'}</Text>
          </View>
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.orderAmount}>{formatXOF(item.total_amount)}</Text>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>
      </View>
    );
  };

  const statusFilters = ['Tous', 'En attente', 'En cours', 'Livrées', 'Annulées'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Supervision Commandes</Text>
        <Text style={styles.headerSubtitle}>
          Total: {filteredOrders.length} commandes
        </Text>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94a3b8" strokeWidth={2} />
          <Text
            style={styles.searchInput}
            placeholder="Rechercher par ID ou client..."
            placeholderTextColor="#64748b"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {statusFilters.map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                selectedStatus === status && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedStatus(selectedStatus === status ? null : status)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedStatus === status && styles.filterButtonTextActive,
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredOrders.length > 0 ? (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune commande trouvée</Text>
        </View>
      )}
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
  filterSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#f1f5f9',
  },
  filterScroll: {
    marginBottom: 0,
  },
  filterContainer: {
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterButtonTextActive: {
    color: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  orderItem: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  orderId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3b82f6',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  orderDetails: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  detailLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3b82f6',
  },
  orderDate: {
    fontSize: 10,
    color: '#64748b',
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