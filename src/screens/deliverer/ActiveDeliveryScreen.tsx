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
  TextInput,
  Modal,
  Keyboard,
} from 'react-native';
import { useRoute, useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate } from '../../lib/utils';
import {
  CheckCircle,
  MapPin,
  Package,
  Truck,
  Phone,
  AlertCircle,
  X,
  Check,
} from 'lucide-react-native';

type DeliveryOrder = {
  id: string;
  client_id: string;
  delivery_fee: number;
  status: string;
  created_at: string;
  delivery_address?: string;
  pickup_code?: string;
  delivery_pin?: string;
  pharmacy_id?: string;
  items?: any[];
  client_phone?: string;
};

type Pharmacy = {
  id: string;
  name: string;
  address: string;
};

type Client = {
  id: string;
  full_name: string;
  phone: string;
};

const ActiveDeliveryScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const route = useRoute<any>();
  const isFocused = useIsFocused();
  const { session } = useAuth();
  const orderId = route.params?.orderId;

  const [activeDelivery, setActiveDelivery] = useState<DeliveryOrder | null>(null);
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [step, setStep] = useState<'pickup' | 'delivery'>('pickup'); // Step 1 or Step 2
  const [pickupCodeInput, setPickupCodeInput] = useState('');
  const [deliveryPinInputs, setDeliveryPinInputs] = useState(['', '', '', '']);
  const [pickupConfirmed, setPickupConfirmed] = useState(false);

  useEffect(() => {
    if (isFocused) {
      fetchActiveDelivery();
    }
  }, [session?.user?.id, orderId, isFocused]);

  const fetchActiveDelivery = async () => {
    if (!session?.user?.id && !orderId) return;

    setLoading(true);
    try {
      let query = supabase.from('orders').select(
        'id, client_id, delivery_fee, status, created_at, delivery_address, pickup_code, delivery_pin, pharmacy_id, items, client_phone'
      );

      if (orderId) {
        // Accepting a new order
        query = query.eq('id', orderId).eq('status', 'ready');
      } else {
        // Fetching active delivery
        query = query
          .eq('deliverer_id', session?.user?.id)
          .in('status', ['picked_up', 'delivering']);
      }

      const { data, error } = await query.single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setActiveDelivery(data);

        // Determine step based on status
        if (data.status === 'picked_up' || data.status === 'delivering') {
          setStep('delivery');
          setPickupConfirmed(true);
        } else {
          setStep('pickup');
          setPickupConfirmed(false);
        }

        // Fetch pharmacy details
        if (data.pharmacy_id) {
          const { data: pharma } = await supabase
            .from('pharmacies')
            .select('id, name, address')
            .eq('id', data.pharmacy_id)
            .single();
          setPharmacy(pharma);
        }

        // Fetch client details
        if (data.client_id) {
          const { data: cli } = await supabase
            .from('profiles')
            .select('id, full_name, phone')
            .eq('id', data.client_id)
            .single();
          setClient(cli);
        }
      } else {
        setActiveDelivery(null);
      }
    } catch (error) {
      console.error('Error fetching active delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPickup = async () => {
    if (!activeDelivery) return;

    if (pickupCodeInput !== activeDelivery.pickup_code) {
      Alert.alert('Erreur', 'Le code de pharmacie est incorrect');
      return;
    }

    setConfirming(true);
    try {
      // Update order status to picked_up
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'picked_up',
          deliverer_id: session?.user?.id,
          picked_up_at: new Date().toISOString(),
        })
        .eq('id', activeDelivery.id);

      if (updateError) throw updateError;

      setPickupConfirmed(true);
      setStep('delivery');

      // Update local state
      setActiveDelivery({
        ...activeDelivery,
        status: 'picked_up',
      });

      // Clear input
      setPickupCodeInput('');

      Alert.alert(
        'Succès',
        'Prise en charge confirmée. Vous pouvez maintenant livrer la commande.'
      );
    } catch (error) {
      console.error('Error confirming pickup:', error);
      Alert.alert('Erreur', 'Impossible de confirmer la prise en charge');
    } finally {
      setConfirming(false);
    }
  };

  const confirmDelivery = async () => {
    if (!activeDelivery) return;

    const enteredPin = deliveryPinInputs.join('');
    if (enteredPin !== activeDelivery.delivery_pin) {
      Alert.alert('Erreur', 'Le code PIN est incorrect');
      return;
    }

    setConfirming(true);
    try {
      // Update order status to delivered
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          status: 'delivered',
          delivered_at: new Date().toISOString(),
        })
        .eq('id', activeDelivery.id);

      if (updateError) throw updateError;

      // Create wallet transaction for delivery fee
      const { error: transError } = await supabase
        .from('wallet_transactions')
        .insert({
          deliverer_id: session?.user?.id,
          order_id: activeDelivery.id,
          type: 'credit',
          amount: activeDelivery.delivery_fee,
          description: `Livraison - Commande ${activeDelivery.id.substring(0, 8)}`,
          status: 'completed',
          created_at: new Date().toISOString(),
        });

      if (transError) throw transError;

      // Update wallet balance
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', session?.user?.id)
        .single();

      if (profile) {
        await supabase
          .from('profiles')
          .update({
            wallet_balance: (profile.wallet_balance || 0) + activeDelivery.delivery_fee,
          })
          .eq('id', session?.user?.id);
      }

      Alert.alert(
        'Succès',
        `Livraison confirmée! +${formatXOF(activeDelivery.delivery_fee)} crédité à votre compte.`,
        [
          {
            text: 'OK',
            onPress: () => {
              setActiveDelivery(null);
              setPickupConfirmed(false);
              setPickupCodeInput('');
              setDeliveryPinInputs(['', '', '', '']);
              setStep('pickup');
              navigation.navigate('Courses');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error confirming delivery:', error);
      Alert.alert('Erreur', 'Impossible de confirmer la livraison');
    } finally {
      setConfirming(false);
    }
  };

  const handlePinInput = (index: number, value: string) => {
    if (value.length > 1) {
      value = value[value.length - 1];
    }

    const newInputs = [...deliveryPinInputs];
    newInputs[index] = value;
    setDeliveryPinInputs(newInputs);

    // Auto-advance to next field
    if (value && index < 3) {
      const nextField = document.getElementById(`pin-${index + 1}`);
      nextField?.focus?.();
    }
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Package size={64} color="#cbd5e1" strokeWidth={1} />
      <Text style={styles.emptyTitle}>Aucune livraison en cours</Text>
      <Text style={styles.emptySubtext}>
        Acceptez une course pour commencer
      </Text>
    </View>
  );

  const renderPickupStep = () => (
    <View style={styles.stepContainer}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepBadge, styles.stepBadgeActive]}>
          <Text style={styles.stepBadgeText}>1</Text>
        </View>
        <View style={styles.stepConnector} />
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>2</Text>
        </View>
      </View>

      {/* Pharmacy Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <Truck size={20} color="#ea580c" strokeWidth={1.5} />
          <Text style={styles.cardHeaderText}>Rendez-vous à la pharmacie</Text>
        </View>
        <Text style={styles.pharmacyName}>{pharmacy?.name || 'Pharmacie'}</Text>
        <View style={styles.addressRow}>
          <MapPin size={16} color="#64748b" strokeWidth={1.5} />
          <Text style={styles.addressText} numberOfLines={2}>
            {pharmacy?.address || 'Adresse pharmacie'}
          </Text>
        </View>
      </View>

      {/* Code Entry Section */}
      <View style={styles.codeSection}>
        <Text style={styles.codeLabel}>Code QR affiché par la pharmacie:</Text>
        <Text style={styles.codeDescription}>
          Entrez le code de la pharmacie
        </Text>
        <TextInput
          style={styles.codeInput}
          placeholder="000000"
          placeholderTextColor="#cbd5e1"
          value={pickupCodeInput}
          onChangeText={setPickupCodeInput}
          maxLength={6}
          keyboardType="numeric"
          editable={!confirming}
        />
        <Text style={styles.codeHelper}>Le code à 6 chiffres se trouve sur le QR code</Text>
      </View>

      {/* Items List */}
      {activeDelivery?.items && activeDelivery.items.length > 0 && (
        <View style={styles.itemsSection}>
          <Text style={styles.itemsTitle}>Articles à récupérer</Text>
          {activeDelivery.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <Package size={16} color="#64748b" strokeWidth={1.5} />
              <Text style={styles.itemName}>{item.name || 'Article'}</Text>
              <Text style={styles.itemQty}>x{item.quantity || 1}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Confirm Button */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          (!pickupCodeInput || confirming) && styles.confirmButtonDisabled,
        ]}
        onPress={confirmPickup}
        disabled={!pickupCodeInput || confirming}
      >
        {confirming ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <CheckCircle size={20} color="#ffffff" strokeWidth={2} />
            <Text style={styles.confirmButtonText}>
              Confirmer la prise en charge
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderDeliveryStep = () => (
    <View style={styles.stepContainer}>
      {/* Step indicator */}
      <View style={styles.stepIndicator}>
        <View style={[styles.stepBadge, styles.stepBadgeActive]}>
          <Check size={16} color="#ffffff" strokeWidth={2} />
        </View>
        <View style={styles.stepConnector} />
        <View style={[styles.stepBadge, styles.stepBadgeActive]}>
          <Text style={styles.stepBadgeText}>2</Text>
        </View>
      </View>

      {/* Status Badge */}
      <View style={styles.statusBanner}>
        <AlertCircle size={20} color="#ea580c" strokeWidth={1.5} />
        <Text style={styles.statusBannerText}>Livraison en cours...</Text>
      </View>

      {/* Client Info Card */}
      <View style={styles.infoCard}>
        <View style={styles.cardHeader}>
          <MapPin size={20} color="#ea580c" strokeWidth={1.5} />
          <Text style={styles.cardHeaderText}>Livrer au client</Text>
        </View>
        <Text style={styles.clientName}>{client?.full_name || 'Client'}</Text>
        <View style={styles.addressRow}>
          <MapPin size={16} color="#64748b" strokeWidth={1.5} />
          <Text style={styles.addressText} numberOfLines={2}>
            {activeDelivery?.delivery_address || 'Adresse de livraison'}
          </Text>
        </View>
        {client?.phone && (
          <TouchableOpacity style={styles.phoneButton}>
            <Phone size={16} color="#ea580c" strokeWidth={1.5} />
            <Text style={styles.phoneButtonText}>{client.phone}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Route Visualization */}
      <View style={styles.routeVisualization}>
        <View style={styles.routePoint}>
          <View style={styles.routeCircle} />
          <Text style={styles.routeLabel}>Pharmacie</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routePoint}>
          <View style={[styles.routeCircle, styles.routeCircleActive]} />
          <Text style={styles.routeLabel}>Client</Text>
        </View>
      </View>

      {/* PIN Entry Section */}
      <View style={styles.pinSection}>
        <Text style={styles.pinLabel}>Code de livraison client</Text>
        <Text style={styles.pinDescription}>
          Demandez le code PIN au client
        </Text>
        <View style={styles.pinInputContainer}>
          {deliveryPinInputs.map((digit, idx) => (
            <TextInput
              key={idx}
              id={`pin-${idx}`}
              style={styles.pinInput}
              placeholder="-"
              placeholderTextColor="#cbd5e1"
              value={digit}
              onChangeText={(value) => handlePinInput(idx, value)}
              maxLength={1}
              keyboardType="numeric"
              editable={!confirming}
              returnKeyType={idx < 3 ? 'next' : 'done'}
              onSubmitEditing={() => {
                if (idx < 3) {
                  const nextField = document.getElementById(`pin-${idx + 1}`);
                  nextField?.focus?.();
                }
              }}
            />
          ))}
        </View>
        <Text style={styles.pinHelper}>4 chiffres</Text>
      </View>

      {/* Delivery Details */}
      <View style={styles.detailsSection}>
        <Text style={styles.detailsTitle}>Détails de la livraison</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Gain à la livraison:</Text>
          <Text style={styles.detailValue}>
            +{formatXOF(activeDelivery?.delivery_fee || 0)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Date:</Text>
          <Text style={styles.detailValue}>
            {activeDelivery?.created_at ? formatDate(activeDelivery.created_at) : '-'}
          </Text>
        </View>
      </View>

      {/* Confirm Button */}
      <TouchableOpacity
        style={[
          styles.confirmButton,
          (deliveryPinInputs.join('').length !== 4 || confirming) &&
            styles.confirmButtonDisabled,
        ]}
        onPress={confirmDelivery}
        disabled={deliveryPinInputs.join('').length !== 4 || confirming}
      >
        {confirming ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <CheckCircle size={20} color="#ffffff" strokeWidth={2} />
            <Text style={styles.confirmButtonText}>
              Confirmer la livraison
            </Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Livraison Active</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : activeDelivery ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          {step === 'pickup' && !pickupConfirmed
            ? renderPickupStep()
            : renderDeliveryStep()}
        </ScrollView>
      ) : (
        renderEmpty()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef3f2',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#fed7aa',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
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
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  stepContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBadgeActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  stepBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  stepConnector: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 8,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fed7aa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    gap: 8,
  },
  statusBannerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  cardHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  pharmacyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  clientName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 8,
  },
  phoneButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ea580c',
  },
  codeSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  codeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  codeDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 10,
  },
  codeInput: {
    borderWidth: 2,
    borderColor: '#fed7aa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 24,
    fontWeight: '700',
    color: '#ea580c',
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  codeHelper: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  itemsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  itemsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  itemName: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
  },
  itemQty: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  routeVisualization: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  routePoint: {
    alignItems: 'center',
  },
  routeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    marginBottom: 6,
  },
  routeCircleActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  routeLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  routeLine: {
    width: '30%',
    height: 2,
    backgroundColor: '#e5e7eb',
  },
  pinSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  pinLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  pinDescription: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 12,
  },
  pinInputContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  pinInput: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderColor: '#fed7aa',
    borderRadius: 8,
    fontSize: 24,
    fontWeight: '700',
    color: '#ea580c',
    textAlign: 'center',
  },
  pinHelper: {
    fontSize: 11,
    color: '#94a3b8',
    textAlign: 'center',
  },
  detailsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  detailsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#ea580c',
    borderRadius: 8,
    gap: 8,
    marginBottom: 24,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ActiveDeliveryScreen;