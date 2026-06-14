import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate, ORDER_STATUSES } from '../../lib/utils';
import { AlertCircle, CheckCircle2, Clock, Package } from 'lucide-react-native';

type Order = {
  id: string;
  client_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  prescription_url?: string;
  profiles?: {
    full_name: string;
  };
  order_items?: Array<{ quantity: number }>;
};

type TabType = 'nouveau' | 'en_cours' | 'termine';

const OrdersScreen: React.FC = () => {
  const { session } = useAuth();
  const navigation = useNavigation<any>();
  const [selectedTab, setSelectedTab] = useState<TabType>('nouveau');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      let query = supabase
        .from('orders')
        .select('id, client_id, total_amount, status, created_at, prescription_url, profiles(full_name), order_items(quantity)')
        .eq('pharmacy_id', session.user.id);

      if (selectedTab === 'nouveau') {
        query = query.eq('status', 'pending');
      } else if (selectedTab === 'en_cours') {
        query = query.in('status', ['validated', 'preparing', 'ready', 'picked_up']);
      } else if (selectedTab === 'termine') {
        query = query.in('status', ['delivering', 'delivered', 'cancelled']);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id, selectedTab]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, [fetchOrders])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchOrders();
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // If marking as ready, generate pickup code
      if (newStatus === 'ready') {
        const pickupCode = 'PKP' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase
          .from('orders')
          .update({ pickup_code: pickupCode })
          .eq('id', orderId);
      }

      setOrders(orders.map(order =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      Alert.alert('Succès', `Commande mise à jour`);
    } catch (error) {
      console.error('Error updating order:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour la commande');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleValidateOrder = (order: Order) => {
    Alert.alert(
      'Valider la commande',
      'Confirmez-vous que l\'ordonnance est conforme ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Valider',
          onPress: () => updateOrderStatus(order.id, 'validated'),
          style: 'default',
        },
        {
          text: 'Refuser',
          onPress: () => {
            Alert.prompt(
              'Motif du refus',
              'Veuillez indiquer le motif :',
              [
                { text: 'Annuler', style: 'cancel' },
                {
                  text: 'Refuser',
                  onPress: (reason) => {
                    updateOrderStatus(order.id, 'cancelled');
                  },
                  style: 'destructive',
                },
              ]
            );
          },
          style: 'destructive',
        },
      ]
    );
  };

  const renderActionButtons = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <View style={styles.actionButtonsGroup}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary, updatingId === order.id && styles.actionButtonLoading]}
              onPress={() => handleValidateOrder(order)}
              disabled={updatingId === order.id}
            >
              {updatingId === order.id ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.actionButtonText}>Valider</Text>
              )}
            </TouchableOpacity>
          </View>
        );
      case 'validated':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary, updatingId === order.id && styles.actionButtonLoading]}
            onPress={() => updateOrderStatus(order.id, 'preparing')}
            disabled={updatingId === order.id}
          >
            {updatingId === order.id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Préparer</Text>
            )}
          </TouchableOpacity>
        );
      case 'preparing':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary, updatingId === order.id && styles.actionButtonLoading]}
            onPress={() => updateOrderStatus(order.id, 'ready')}
            disabled={updatingId === order.id}
          >
            {updatingId === order.id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Marquer Prêt</Text>
            )}
          </TouchableOpacity>
        );
      case 'ready':
        return (
          <View style={styles.readyBadge}>
            <CheckCircle2 size={16} color="#16a34a" strokeWidth={2} />
            <Text style={styles.readyBadgeText}>En attente livreur</Text>
          </View>
        );
      default:
        return null;
    }
  };

  const renderOrderCard = ({ item }: { item: Order }) => {
    const statusInfo = ORDER_STATUSES[item.status] || ORDER_STATUSES.pending;
    const clientName = (item.profiles as any)?.full_name || 'Client';
    const itemCount = (item.order_items as any)?.length || 0;

    return (
      <TouchableOpacity
        style={styles.orderCard}
        onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
      >
        <View style={styles.orderHeader}>
          <View style={styles.orderIdentity}>
            <Text style={styles.orderId}>#{item.id.substring(0, 8).toUpperCase()}</Text>
            <Text style={styles.orderDateTime}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{clientName}</Text>
            <View style={styles.itemsRow}>
              <Text style={styles.itemsCount}>{itemCount} article{itemCount > 1 ? 's' : ''}</Text>
              {item.prescription_url && (
                <View style={styles.prescriptionBadge}>
                  <AlertCircle size={12} color="#ffffff" strokeWidth={2} />
                  <Text style={styles.prescriptionBadgeText}>Ordonnance</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.orderTotal}>{formatXOF(item.total_amount)}</Text>
        </View>

        <View style={styles.orderFooter}>
          {renderActionButtons(item)}
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          >
            <Text style={styles.viewButtonText}>Voir</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Package size={48} color="#cbd5e1" strokeWidth={1} />
      <Text style={styles.emptyTitle}>
        {selectedTab === 'nouveau'
          ? 'Aucune nouvelle commande'
          : selectedTab === 'en_cours'
            ? 'Aucune commande en cours'
            : 'Aucune commande terminée'}
      </Text>
      <Text style={styles.emptySubtext}>
        Les commandes apparaîtront ici
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Console Commandes</Text>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'nouveau' && styles.tabActive]}
          onPress={() => setSelectedTab('nouveau')}
        >
          <Text style={[styles.tabText, selectedTab === 'nouveau' && styles.tabTextActive]}>
            Nouveau
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'en_cours' && styles.tabActive]}
          onPress={() => setSelectedTab('en_cours')}
        >
          <Text style={[styles.tabText, selectedTab === 'en_cours' && styles.tabTextActive]}>
            En cours
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'termine' && styles.tabActive]}
          onPress={() => setSelectedTab('termine')}
        >
          <Text style={[styles.tabText, selectedTab === 'termine' && styles.tabTextActive]}>
            Terminé
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : orders.length > 0 ? (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
          }
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
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
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
    borderBottomColor: '#16a34a',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  tabTextActive: {
    color: '#16a34a',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderIdentity: {
    flex: 1,
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  orderDateTime: {
    fontSize: 11,
    color: '#94a3b8',
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
  orderDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  itemsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemsCount: {
    fontSize: 11,
    color: '#64748b',
  },
  prescriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#f97316',
    borderRadius: 4,
  },
  prescriptionBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
  orderTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#16a34a',
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  actionButtonsGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  actionButtonPrimary: {
    backgroundColor: '#16a34a',
  },
  actionButtonSecondary: {
    backgroundColor: '#6366f1',
  },
  actionButtonLoading: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  readyBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#dcfce7',
    borderRadius: 6,
  },
  readyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16a34a',
  },
  viewButton: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
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
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
  },
});

export default OrdersScreen;