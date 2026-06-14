import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  CheckCircle,
  Package,
  Bike,
  MapPin,
  Home,
  Copy,
  Clock,
} from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate, ORDER_STATUSES } from '../../lib/utils';
import * as Clipboard from 'expo-clipboard';

type OrderStatus = 'pending' | 'validated' | 'preparing' | 'ready' | 'picked_up' | 'delivering' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  status: OrderStatus;
  total_amount: number;
  delivery_pin: string;
  pickup_code: string;
  created_at: string;
  pharmacy: {
    name: string;
  };
  order_items: Array<{
    id: string;
    quantity: number;
    products: {
      name: string;
    };
  }>;
}

const StatusSteps = [
  { id: 'pending', label: 'Confirmée', icon: CheckCircle },
  { id: 'preparing', label: 'En préparation', icon: Package },
  { id: 'picked_up', label: 'Livreur assigné', icon: Bike },
  { id: 'delivering', label: 'En livraison', icon: MapPin },
  { id: 'delivered', label: 'Livrée', icon: Home },
];

const OrderTrackingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { orderId } = route.params || {};

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [pinCopied, setPinCopied] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
      const interval = setInterval(fetchOrder, 10000);
      return () => clearInterval(interval);
    }
  }, [orderId]);

  const fetchOrder = async () => {
    if (!orderId) return;

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          status,
          total_amount,
          delivery_pin,
          pickup_code,
          created_at,
          pharmacy:pharmacies(name),
          order_items(
            id,
            quantity,
            products(name)
          )
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      setOrder(data as Order);
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPin = async () => {
    if (order?.delivery_pin) {
      await Clipboard.setStringAsync(order.delivery_pin);
      setPinCopied(true);
      Alert.alert('Copié', 'PIN copié dans le presse-papiers');
      setTimeout(() => setPinCopied(false), 2000);
    }
  };

  const getStepStatus = (stepId: string): 'completed' | 'current' | 'pending' => {
    if (!order?.status) return 'pending';

    const steps = ['pending', 'preparing', 'picked_up', 'delivering', 'delivered'];
    const currentIndex = steps.indexOf(order.status);
    const stepIndex = steps.indexOf(stepId as any);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#2563eb" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Suivi de Commande</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Commande non trouvée</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = ORDER_STATUSES[order.status] || ORDER_STATUSES.pending;
  const showPin = ['delivering', 'delivered'].includes(order.status);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#2563eb" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Suivi de Commande #{order.id.substring(0, 8).toUpperCase()}
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.statusProgressContainer}>
          <View style={styles.stepsContainer}>
            {StatusSteps.map((step, idx) => {
              const Icon = step.icon;
              const status = getStepStatus(step.id);
              const isCompleted = status === 'completed';
              const isCurrent = status === 'current';

              return (
                <View key={step.id} style={styles.stepWrapper}>
                  <View
                    style={[
                      styles.stepCircle,
                      isCompleted && styles.stepCircleCompleted,
                      isCurrent && styles.stepCircleCurrent,
                    ]}
                  >
                    <Icon
                      size={20}
                      color={isCompleted || isCurrent ? '#ffffff' : '#cbd5e1'}
                      strokeWidth={2}
                    />
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      (isCompleted || isCurrent) && styles.stepLabelActive,
                    ]}
                  >
                    {step.label}
                  </Text>

                  {idx < StatusSteps.length - 1 && (
                    <View
                      style={[
                        styles.stepConnector,
                        isCompleted && styles.stepConnectorCompleted,
                      ]}
                    />
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.detailsCard}>
          <Text style={styles.detailsTitle}>Détails de la commande</Text>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Pharmacie</Text>
            <Text style={styles.detailValue}>{order.pharmacy?.name || 'Pharmacie'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(order.created_at)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Montant</Text>
            <Text style={styles.detailValue}>{formatXOF(order.total_amount)}</Text>
          </View>

          <View style={styles.detailsDivider} />

          <View style={styles.itemsSection}>
            <Text style={styles.itemsSectionTitle}>Articles ({order.order_items?.length || 0})</Text>
            {order.order_items?.map(item => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={styles.itemName}>{item.products?.name}</Text>
                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
              </View>
            ))}
          </View>
        </View>

        {showPin && (
          <View style={styles.pinCard}>
            <Text style={styles.pinTitle}>Votre Code PIN de Livraison</Text>
            <View style={styles.pinDisplayContainer}>
              <View style={styles.pinDigitsContainer}>
                {order.delivery_pin.split('').map((digit, idx) => (
                  <View key={idx} style={styles.pinDigitBox}>
                    <Text style={styles.pinDigit}>{digit}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={styles.copyButton}
                onPress={handleCopyPin}
              >
                <Copy size={18} color="#ffffff" strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <Text style={styles.pinSubtext}>
              Communiquez ce code au livreur pour confirmer la livraison
            </Text>
          </View>
        )}

        {order.status === 'delivered' && (
          <View style={styles.deliveredCard}>
            <CheckCircle size={40} color="#16a34a" strokeWidth={1.5} />
            <Text style={styles.deliveredText}>Livraison confirmée !</Text>
          </View>
        )}

        <View style={styles.pickupCodeCard}>
          <View style={styles.pickupCodeHeader}>
            <Clock size={18} color="#2563eb" strokeWidth={2} />
            <Text style={styles.pickupCodeLabel}>Code de récupération</Text>
          </View>
          <Text style={styles.pickupCodeValue}>{order.pickup_code}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#64748b',
  },
  statusProgressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    marginVertical: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepWrapper: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleCompleted: {
    backgroundColor: '#16a34a',
  },
  stepCircleCurrent: {
    backgroundColor: '#2563eb',
  },
  stepLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 14,
  },
  stepLabelActive: {
    color: '#0f172a',
    fontWeight: '600',
  },
  stepConnector: {
    position: 'absolute',
    height: 2,
    backgroundColor: '#e2e8f0',
    top: 19,
    left: '50%',
    right: '-50%',
    zIndex: -1,
  },
  stepConnectorCompleted: {
    backgroundColor: '#16a34a',
  },
  detailsCard: {
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  itemsSection: {
    marginTop: 12,
  },
  itemsSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  itemName: {
    fontSize: 12,
    color: '#0f172a',
    flex: 1,
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563eb',
  },
  pinCard: {
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fed7aa',
    alignItems: 'center',
  },
  pinTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  pinDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  pinDigitsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  pinDigitBox: {
    width: 40,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDigit: {
    fontSize: 20,
    fontWeight: '700',
    color: '#92400e',
  },
  copyButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinSubtext: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 18,
  },
  deliveredCard: {
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    gap: 8,
  },
  deliveredText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#16a34a',
  },
  pickupCodeCard: {
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pickupCodeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  pickupCodeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  pickupCodeValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
    textAlign: 'center',
    paddingVertical: 8,
  },
});

export default OrderTrackingScreen;
