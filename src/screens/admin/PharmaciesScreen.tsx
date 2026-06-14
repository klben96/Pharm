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
  Animated,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import {
  Building2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';

type PharmacyStock = {
  id: string;
  product_id: string;
  quantity: number;
  product_name?: string;
};

type Pharmacy = {
  id: string;
  name: string;
  address: string;
  city?: string;
  phone: string | null;
  is_active: boolean;
  stock?: PharmacyStock[];
  stockCount?: number;
  hasLowStock?: boolean;
  expandedAnimated?: Animated.Value;
};

const PharmaciesScreen: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchPharmacies = useCallback(async () => {
    setLoading(true);
    try {
      const { data: pharmacyData, error } = await supabase
        .from('pharmacies')
        .select('id, name, address, city, phone, is_active')
        .order('name', { ascending: true });

      if (error) throw error;

      // Fetch stock for each pharmacy
      const pharmaciesWithStock = await Promise.all(
        (pharmacyData || []).map(async (pharmacy) => {
          const { data: stockData } = await supabase
            .from('pharmacy_stock')
            .select('id, product_id, quantity')
            .eq('pharmacy_id', pharmacy.id);

          const stock = stockData || [];
          const lowStockItems = stock.filter((s) => s.quantity < 5);

          return {
            ...pharmacy,
            stock,
            stockCount: stock.length,
            hasLowStock: lowStockItems.length > 0,
            expandedAnimated: new Animated.Value(0),
          };
        })
      );

      setPharmacies(pharmaciesWithStock);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
      Alert.alert('Erreur', 'Impossible de charger les pharmacies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPharmacies();
  }, [fetchPharmacies]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPharmacies();
    setRefreshing(false);
  }, [fetchPharmacies]);

  const toggleExpand = (pharmacyId: string) => {
    setExpandedId(expandedId === pharmacyId ? null : pharmacyId);
  };

  const renderPharmacyItem = ({ item }: { item: Pharmacy }) => {
    const isExpanded = expandedId === item.id;
    const lowStockItems = (item.stock || []).filter((s) => s.quantity < 5);

    return (
      <View style={styles.pharmacyCard}>
        <TouchableOpacity
          style={styles.pharmacyHeader}
          onPress={() => toggleExpand(item.id)}
        >
          <View style={styles.pharmacyIcon}>
            <Building2 size={24} color="#ffffff" strokeWidth={1.5} />
          </View>

          <View style={styles.pharmacyInfo}>
            <Text style={styles.pharmacyName}>{item.name}</Text>
            <Text style={styles.pharmacyAddress}>{item.address}</Text>
            {item.city && <Text style={styles.pharmacyCity}>{item.city}</Text>}
          </View>

          <View style={styles.pharmacyMeta}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: item.is_active ? '#10b981' : '#ef4444' },
              ]}
            >
              <Text style={styles.statusText}>
                {item.is_active ? 'Actif' : 'Inactif'}
              </Text>
            </View>

            {item.hasLowStock && (
              <View style={styles.warningBadge}>
                <AlertTriangle size={14} color="#f59e0b" strokeWidth={2} />
              </View>
            )}

            <View style={styles.expandIcon}>
              {isExpanded ? (
                <ChevronUp size={20} color="#94a3b8" strokeWidth={2} />
              ) : (
                <ChevronDown size={20} color="#94a3b8" strokeWidth={2} />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            <View style={styles.stockSummary}>
              <Text style={styles.stockLabel}>Articles en stock</Text>
              <Text style={styles.stockCount}>{item.stockCount || 0}</Text>
            </View>

            {lowStockItems.length > 0 && (
              <View style={styles.lowStockSection}>
                <View style={styles.lowStockHeader}>
                  <AlertTriangle size={14} color="#f59e0b" strokeWidth={2} />
                  <Text style={styles.lowStockTitle}>
                    Stock faible ({lowStockItems.length})
                  </Text>
                </View>
                {lowStockItems.slice(0, 5).map((item) => (
                  <View key={item.id} style={styles.lowStockItem}>
                    <View style={styles.lowStockItemDot} />
                    <View style={styles.lowStockItemContent}>
                      <Text style={styles.lowStockItemText}>
                        Produit: {item.product_id.substring(0, 8)}
                      </Text>
                      <Text style={styles.lowStockItemQuantity}>
                        Quantité: {item.quantity} unité(s)
                      </Text>
                    </View>
                  </View>
                ))}
                {lowStockItems.length > 5 && (
                  <Text style={styles.moreItems}>
                    +{lowStockItems.length - 5} autre(s)
                  </Text>
                )}
              </View>
            )}

            {item.phone && (
              <View style={styles.phoneSection}>
                <Text style={styles.phoneLabel}>Téléphone</Text>
                <Text style={styles.phoneValue}>{item.phone}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const getLowStockPharmacies = () => {
    return pharmacies.filter((p) => p.hasLowStock);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion des Pharmacies</Text>
        <Text style={styles.headerSubtitle}>
          {pharmacies.filter((p) => p.is_active).length} actives /{' '}
          {pharmacies.length} total
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <FlatList
          data={pharmacies}
          renderItem={renderPharmacyItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune pharmacie</Text>
            </View>
          }
          ListHeaderComponent={
            getLowStockPharmacies().length > 0 ? (
              <View style={styles.anomaliesSection}>
                <View style={styles.anomaliesHeader}>
                  <AlertTriangle size={16} color="#ef4444" strokeWidth={2} />
                  <Text style={styles.anomaliesTitle}>Anomalies Détectées</Text>
                </View>
                <Text style={styles.anomaliesSubtitle}>
                  {getLowStockPharmacies().length} pharmacie(s) avec stock faible
                </Text>
                {getLowStockPharmacies().map((pharmacy) => (
                  <View key={pharmacy.id} style={styles.anomalyItem}>
                    <Text style={styles.anomalyName}>{pharmacy.name}</Text>
                    <Text style={styles.anomalyDetail}>
                      Stock critique détecté
                    </Text>
                  </View>
                ))}
              </View>
            ) : null
          }
        />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  anomaliesSection: {
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444',
  },
  anomaliesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  anomaliesTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ef4444',
  },
  anomaliesSubtitle: {
    fontSize: 11,
    color: '#cbd5e1',
    marginBottom: 10,
  },
  anomalyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  anomalyName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  anomalyDetail: {
    fontSize: 10,
    color: '#f59e0b',
    marginTop: 2,
  },
  pharmacyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  pharmacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  pharmacyIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  pharmacyAddress: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  pharmacyCity: {
    fontSize: 10,
    color: '#64748b',
  },
  pharmacyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  warningBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7c2d12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    backgroundColor: '#0f172a',
    gap: 12,
  },
  stockSummary: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stockLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  stockCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#3b82f6',
  },
  lowStockSection: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#f59e0b',
  },
  lowStockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  lowStockTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f59e0b',
  },
  lowStockItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  lowStockItemDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f59e0b',
    marginTop: 4,
  },
  lowStockItemContent: {
    flex: 1,
  },
  lowStockItemText: {
    fontSize: 10,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  lowStockItemQuantity: {
    fontSize: 9,
    color: '#f59e0b',
    marginTop: 2,
    fontWeight: '600',
  },
  moreItems: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 6,
  },
  phoneSection: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#1e293b',
    borderRadius: 8,
  },
  phoneLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  phoneValue: {
    fontSize: 12,
    color: '#f1f5f9',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default PharmaciesScreen;