import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { ChevronLeft, Check, CheckCircle } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import { formatXOF } from '../../lib/utils';

type Operator = 'orange' | 'mtn' | 'wave';

interface OperatorConfig {
  id: Operator;
  name: string;
  color: string;
  bgColor: string;
  popular?: boolean;
}

const OPERATORS: OperatorConfig[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    color: '#ea7317',
    bgColor: '#fed7aa',
    popular: true,
  },
  {
    id: 'mtn',
    name: 'MTN Moov',
    color: '#f59e0b',
    bgColor: '#fef3c7',
  },
  {
    id: 'wave',
    name: 'Wave',
    color: '#2563eb',
    bgColor: '#dbeafe',
  },
];

const DELIVERY_FEE = 500;

const CheckoutScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { session } = useAuth();
  const { items, total, clearCart } = useCart();

  const [selectedOperator, setSelectedOperator] = useState<Operator>('orange');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successState, setSuccessState] = useState<{
    orderId: string;
    pin: string;
  } | null>(null);

  const finalTotal = total + DELIVERY_FEE;

  const generatePIN = (): string => {
    return Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
  };

  const generatePickupCode = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleConfirmPayment = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre numéro Mobile Money');
      return;
    }

    if (items.length === 0) {
      Alert.alert('Erreur', 'Votre panier est vide');
      return;
    }

    setProcessing(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (!session?.user?.id) {
        throw new Error('Utilisateur non authentifié');
      }

      const pin = generatePIN();
      const pickupCode = generatePickupCode();
      const itemsForOrder = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        price_xof: item.price_xof,
      }));

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          client_id: session.user.id,
          total_amount: finalTotal,
          status: 'pending',
          payment_method: 'mobile_money',
          payment_operator: selectedOperator,
          payment_phone: phoneNumber,
          delivery_fee: DELIVERY_FEE,
          delivery_pin: pin,
          pickup_code: pickupCode,
          order_items: itemsForOrder,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      clearCart();
      setSuccessState({
        orderId: orderData.id,
        pin,
      });
    } catch (error) {
      console.error('Erreur de paiement:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors du paiement');
      setProcessing(false);
    }
  };

  const handleViewOrders = () => {
    clearCart();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Orders' }],
    });
  };

  if (successState) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.successContainer}>
            <View style={styles.successIconContainer}>
              <CheckCircle size={64} color="#16a34a" strokeWidth={1.5} />
            </View>

            <Text style={styles.successTitle}>Commande confirmée !</Text>

            <View style={styles.orderIdCard}>
              <Text style={styles.orderIdLabel}>Numéro de commande</Text>
              <Text style={styles.orderId}>#{successState.orderId.substring(0, 8).toUpperCase()}</Text>
            </View>

            <View style={styles.pinCard}>
              <Text style={styles.pinLabel}>Votre Code PIN de Livraison</Text>
              <View style={styles.pinDigitsContainer}>
                {successState.pin.split('').map((digit, idx) => (
                  <View key={idx} style={styles.pinDigitBox}>
                    <Text style={styles.pinDigit}>{digit}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.pinSubtext}>
                Communiquez ce code au livreur pour confirmer la livraison
              </Text>
            </View>

            <View style={styles.totalCard}>
              <Text style={styles.totalCardLabel}>Montant total payé</Text>
              <Text style={styles.totalCardAmount}>{formatXOF(finalTotal)}</Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleViewOrders}>
              <Text style={styles.primaryButtonText}>Voir mes commandes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color="#2563eb" strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Paiement</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{items.length} article(s)</Text>
            <Text style={styles.summaryValue}>{formatXOF(total)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Livraison</Text>
            <Text style={styles.summaryValue}>{formatXOF(DELIVERY_FEE)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalLabel}>Total</Text>
            <Text style={styles.summaryTotalValue}>{formatXOF(finalTotal)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choisir votre opérateur</Text>

          {OPERATORS.map(operator => (
            <TouchableOpacity
              key={operator.id}
              style={[
                styles.operatorCard,
                selectedOperator === operator.id && styles.operatorCardSelected,
              ]}
              onPress={() => setSelectedOperator(operator.id)}
            >
              <View
                style={[
                  styles.operatorIcon,
                  { backgroundColor: operator.bgColor },
                ]}
              >
                <View
                  style={[
                    styles.operatorDot,
                    { backgroundColor: operator.color },
                  ]}
                />
              </View>

              <View style={styles.operatorInfo}>
                <Text style={styles.operatorName}>{operator.name}</Text>
                {operator.popular && (
                  <Text style={styles.popularBadge}>Populaire</Text>
                )}
              </View>

              {selectedOperator === operator.id && (
                <View style={styles.selectedCheckmark}>
                  <Check size={20} color="#2563eb" strokeWidth={2} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Numéro Mobile Money</Text>
          <View style={styles.phoneInputContainer}>
            <Text style={styles.countryCode}>+225</Text>
            <TextInput
              style={styles.phoneInput}
              placeholder="Entrez votre numéro"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              editable={!processing}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, processing && styles.confirmButtonDisabled]}
          onPress={handleConfirmPayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmer le paiement</Text>
          )}
        </TouchableOpacity>

        {processing && (
          <View style={styles.processingContainer}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.processingText}>Traitement en cours...</Text>
          </View>
        )}
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
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
  },
  operatorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    marginBottom: 10,
    gap: 12,
  },
  operatorCardSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  operatorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  operatorInfo: {
    flex: 1,
  },
  operatorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  popularBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f59e0b',
    marginTop: 2,
  },
  selectedCheckmark: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  countryCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    padding: 0,
  },
  confirmButton: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingVertical: 14,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  processingContainer: {
    marginVertical: 20,
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  successContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 24,
  },
  orderIdCard: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginBottom: 16,
    alignItems: 'center',
  },
  orderIdLabel: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
  },
  pinCard: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fed7aa',
    marginBottom: 20,
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 12,
  },
  pinDigitsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pinDigitBox: {
    width: 48,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#fed7aa',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinDigit: {
    fontSize: 24,
    fontWeight: '700',
    color: '#92400e',
  },
  pinSubtext: {
    fontSize: 12,
    color: '#92400e',
    textAlign: 'center',
    lineHeight: 18,
  },
  totalCard: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#f0f9ff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    marginBottom: 20,
    alignItems: 'center',
  },
  totalCardLabel: {
    fontSize: 12,
    color: '#1e40af',
    marginBottom: 4,
  },
  totalCardAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2563eb',
  },
  primaryButton: {
    width: '100%',
    paddingVertical: 14,
    backgroundColor: '#2563eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default CheckoutScreen;
