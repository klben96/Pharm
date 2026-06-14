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
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate } from '../../lib/utils';
import { CheckCircle, MapPin, Package } from 'lucide-react-native';

type DeliveryOrder = {
  id: string;
  client_id: string;
  total_amount: number;
  status: string;
  created_at: string;
  delivery_address?: string;
};

const ActiveDeliveryScreen: React.FC = () => {
  const { session } = useAuth();
  const [activeDelivery, setActiveDelivery] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    fetchActiveDelivery();
  }, [session?.user?.id]);

  const fetchActiveDelivery = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, client_id, total_amount, status, created_at, delivery_address')
        .eq('deliverer_id', session.user.id)
        .eq('status', 'delivering')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setActiveDelivery(data || null);
    } catch (error) {
      console.error('Error fetching active delivery:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async () => {
    if (!activeDelivery) return;

    setConfirming(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered', delivered_at: new Date().toISOString() })
        .eq('id', activeDelivery.id);

      if (error) throw error;

      Alert.alert(
        'Succès',
        'Livraison confirmée avec succès!',
        [
          {
            text: 'OK',
            onPress: () => {
              setActiveDelivery(null);
              fetchActiveDelivery();
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

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Package size={64} color="#cbd5e1" strokeWidth={1} />
      <Text style={styles.emptyTitle}>Aucune livraison en cours</Text>
      <Text style={styles.emptySubtext}>
        Acceptez une commande pour commencer
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Livraison en cours</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#ea580c" />
        </View>
      ) : activeDelivery ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.deliveryCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.orderId}>
                Commande #{activeDelivery.id.substring(0, 8).toUpperCase()}
              </Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>En livraison</Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Détails de la commande</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Montant:</Text>
                <Text style={styles.infoValue}>
                  {formatXOF(activeDelivery.total_amount)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Date:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(activeDelivery.created_at)}
                </Text>
              </View>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.addressSection}>
              <View style={styles.addressHeader}>
                <MapPin size={20} color="#ea580c" strokeWidth={1.5} />
                <Text style={styles.addressTitle}>Adresse de livraison</Text>
              </View>
              <Text style={styles.addressText}>
                {activeDelivery.delivery_address || 'Adresse non disponible'}
              </Text>
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.confirmationSection}>
              <View style={styles.confirmationBox}>
                <Text style={styles.confirmationCode}>
                  Code: {activeDelivery.id.substring(0, 6).toUpperCase()}
                </Text>
                <Text style={styles.confirmationText}>
                  Montrez ce code au client
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                confirming && styles.confirmButtonDisabled,
              ]}
              onPress={confirmDelivery}
              disabled={confirming}
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
  deliveryCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#fed7aa',
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400e',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#fed7aa',
    marginVertical: 12,
  },
  infoSection: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  addressSection: {
    marginBottom: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  addressTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  addressText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
  },
  confirmationSection: {
    marginVertical: 12,
  },
  confirmationBox: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fef3f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
    alignItems: 'center',
  },
  confirmationCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ea580c',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  confirmationText: {
    fontSize: 11,
    color: '#64748b',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 14,
    backgroundColor: '#ea580c',
    borderRadius: 8,
    gap: 8,
  },
  confirmButtonDisabled: {
    opacity: 0.7,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default ActiveDeliveryScreen;