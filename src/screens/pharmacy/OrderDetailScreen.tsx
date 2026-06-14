import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate, ORDER_STATUSES } from '../../lib/utils';
import QRCode from 'react-native-qrcode-svg';
import { ChevronLeft, MapPin, Phone, AlertCircle } from 'lucide-react-native';

type OrderItem = {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
};

type Order = {
  id: string;
  client_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  prescription_url?: string;
  pickup_code?: string;
  profiles?: {
    full_name: string;
    phone: string;
    address: string;
  };
  order_items?: OrderItem[];
};

const OrderDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  const { orderId } = route.params;

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    if (!orderId) return;

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('id, client_id, total_amount, status, created_at, prescription_url, pickup_code, profiles(full_name, phone, address)')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // Fetch order items with product details
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('product_id, quantity, unit_price, products(name)')
        .eq('order_id', orderId);

      const itemsWithDetails = (itemsData || []).map((item: any) => ({
        product_id: item.product_id,
        product_name: (item.products as any)?.name || 'Produit inconnu',
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      setOrderItems(itemsWithDetails);
    } catch (error) {
      console.error('Error fetching order detail:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la commande');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // If marking as ready, generate pickup code if not exists
      if (newStatus === 'ready' && !order?.pickup_code) {
        const pickupCode = 'PKP' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase
          .from('orders')
          .update({ pickup_code: pickupCode })
          .eq('id', orderId);
        setOrder(prev => prev ? { ...prev, pickup_code: pickupCode, status: newStatus } : null);
      } else {
        setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }

      Alert.alert('Succès', 'Statut mis à jour');
      fetchOrderDetail();
    } catch (error) {
      console.error('Error updating status:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleStatusAction = () => {
    if (!order) return;

    switch (order.status) {
      case 'pending':
        Alert.alert(
          'Valider la commande',
          'Confirmez-vous que l\'ordonnance est conforme ?',
          [
            { text: 'Annuler', style: 'cancel' },
            {
              text: 'Valider',
              onPress: () => updateOrderStatus('validated'),
            },
          ]
        );
        break;
      case 'validated':
        updateOrderStatus('preparing');
        break;
      case 'preparing':
        updateOrderStatus('ready');
        break;
      default:
        break;
    }
  };

  const renderStatusAction = () => {
    if (!order) return null;

    switch (order.status) {
      case 'pending':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary, updatingStatus && styles.actionButtonDisabled]}
            onPress={handleStatusAction}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Valider la commande</Text>
            )}
          </TouchableOpacity>
        );
      case 'validated':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary, updatingStatus && styles.actionButtonDisabled]}
            onPress={handleStatusAction}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Commencer la préparation</Text>
            )}
          </TouchableOpacity>
        );
      case 'preparing':
        return (
          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonPrimary, updatingStatus && styles.actionButtonDisabled]}
            onPress={handleStatusAction}
            disabled={updatingStatus}
          >
            {updatingStatus ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.actionButtonText}>Marquer comme prête</Text>
            )}
          </TouchableOpacity>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Commande non trouvée</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
  const clientProfile = (order.profiles as any);
  const subtotal = orderItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ChevronLeft size={24} color="#0f172a" strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>#{order.id.substring(0, 8).toUpperCase()}</Text>
          <Text style={styles.headerSubtitle}>{formatDate(order.created_at)}</Text>
        </View>
        <View style={[styles.statusBadgeLarge, { backgroundColor: statusInfo.bg }]}>
          <Text style={[styles.statusBadgeLargeText, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Client Information Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations client</Text>
          <View style={styles.card}>
            <View style={styles.clientHeader}>
              <Text style={styles.clientName}>{clientProfile?.full_name || 'Client'}</Text>
            </View>
            {clientProfile?.phone && (
              <View style={styles.infoRow}>
                <Phone size={16} color="#16a34a" strokeWidth={2} />
                <Text style={styles.infoText}>{clientProfile.phone}</Text>
              </View>
            )}
            {clientProfile?.address && (
              <View style={styles.infoRow}>
                <MapPin size={16} color="#16a34a" strokeWidth={2} />
                <Text style={[styles.infoText, { flex: 1 }]}>{clientProfile.address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Prescription Badge */}
        {order.prescription_url && (
          <View style={styles.section}>
            <View style={styles.prescriptionAlert}>
              <AlertCircle size={20} color="#f97316" strokeWidth={2} />
              <View style={styles.prescriptionAlertContent}>
                <Text style={styles.prescriptionAlertTitle}>Ordonnance fournie</Text>
                <Text style={styles.prescriptionAlertText}>Veuillez valider cette commande</Text>
              </View>
            </View>
          </View>
        )}

        {/* Order Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Articles</Text>
          {orderItems.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <Text style={styles.itemQty}>Quantité: {item.quantity}</Text>
              </View>
              <View style={styles.itemPrice}>
                <Text style={styles.itemPriceUnit}>{formatXOF(item.unit_price)}</Text>
                <Text style={styles.itemPriceTotal}>{formatXOF(item.quantity * item.unit_price)}</Text>
              </View>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatXOF(order.total_amount)}</Text>
          </View>
        </View>

        {/* QR Code Card - Only when ready */}
        {order.status === 'ready' && order.pickup_code && (
          <View style={styles.section}>
            <View style={styles.qrCard}>
              <Text style={styles.qrCardTitle}>QR Code de Sortie Stock</Text>
              <Text style={styles.qrCardSubtitle}>Unique pour cette commande</Text>

              <View style={styles.qrCodeContainer}>
                <QRCode
                  value={order.pickup_code}
                  size={160}
                  color="#16a34a"
                  backgroundColor="#ffffff"
                />
              </View>

              <View style={styles.pickupCodeSection}>
                <Text style={styles.pickupCodeLabel}>Code de retrait</Text>
                <Text style={styles.pickupCode}>{order.pickup_code}</Text>
              </View>

              <Text style={styles.qrCardInstructions}>
                Présentez ce QR code au livreur lors de la prise en charge de la commande
              </Text>
            </View>
          </View>
        )}

        {/* Action Button */}
        {renderStatusAction()}

        <View style={styles.spacer} />
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
    gap: 12,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  statusBadgeLarge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  statusBadgeLargeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  section: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 10,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  clientHeader: {
    marginBottom: 10,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  prescriptionAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#fed7aa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fdba74',
  },
  prescriptionAlertContent: {
    flex: 1,
  },
  prescriptionAlertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
  },
  prescriptionAlertText: {
    fontSize: 11,
    color: '#b45309',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 8,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  itemQty: {
    fontSize: 11,
    color: '#94a3b8',
  },
  itemPrice: {
    alignItems: 'flex-end',
  },
  itemPriceUnit: {
    fontSize: 11,
    color: '#64748b',
  },
  itemPriceTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#dcfce7',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#16a34a',
  },
  qrCard: {
    backgroundColor: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    alignItems: 'center',
    overflow: 'hidden',
  },
  qrCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    textAlign: 'center',
  },
  qrCardSubtitle: {
    fontSize: 12,
    color: '#dcfce7',
    marginBottom: 16,
    textAlign: 'center',
  },
  qrCodeContainer: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  pickupCodeSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  pickupCodeLabel: {
    fontSize: 11,
    color: '#dcfce7',
    marginBottom: 4,
    fontWeight: '500',
  },
  pickupCode: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 2,
  },
  qrCardInstructions: {
    fontSize: 11,
    color: '#dcfce7',
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
  actionButton: {
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  actionButtonPrimary: {
    backgroundColor: '#16a34a',
  },
  actionButtonSecondary: {
    backgroundColor: '#6366f1',
  },
  actionButtonDisabled: {
    opacity: 0.7,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  spacer: {
    height: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#94a3b8',
  },
});

export default OrderDetailScreen;
