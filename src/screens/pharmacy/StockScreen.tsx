import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF } from '../../lib/utils';
import { AlertCircle, Plus, Minus } from 'lucide-react-native';

type StockItem = {
  id: string;
  product_id: string;
  product_name: string;
  category: string;
  brand?: string;
  price_xof: number;
  quantity: number;
  pharmacy_id: string;
};

const StockScreen: React.FC = () => {
  const { session } = useAuth();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filteredStock, setFilteredStock] = useState<StockItem[]>([]);
  const [filterLowStock, setFilterLowStock] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchStock = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      const { data, error } = await supabase
        .from('pharmacy_stock')
        .select('id, product_id, quantity, pharmacy_id')
        .eq('pharmacy_id', session.user.id)
        .order('quantity', { ascending: true });

      if (error) throw error;

      const stockWithDetails = await Promise.all(
        (data || []).map(async (stockItem) => {
          const { data: product } = await supabase
            .from('products')
            .select('name, category, brand, price_xof')
            .eq('id', stockItem.product_id)
            .single();

          return {
            ...stockItem,
            product_name: product?.name || 'Produit inconnu',
            category: product?.category || 'Autres',
            brand: product?.brand || '',
            price_xof: product?.price_xof || 0,
          };
        })
      );

      setStock(stockWithDetails);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  useFocusEffect(
    useCallback(() => {
      fetchStock();
    }, [fetchStock])
  );

  useEffect(() => {
    if (filterLowStock) {
      setFilteredStock(stock.filter(item => item.quantity < 5));
    } else {
      setFilteredStock(stock);
    }
  }, [stock, filterLowStock]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStock();
  }, [fetchStock]);

  const updateQuantity = async (stockId: string, delta: number) => {
    const item = stock.find(s => s.id === stockId);
    if (!item) return;

    const newQuantity = Math.max(0, item.quantity + delta);

    setUpdatingId(stockId);
    try {
      const { error } = await supabase
        .from('pharmacy_stock')
        .update({ quantity: newQuantity })
        .eq('id', stockId);

      if (error) throw error;

      setStock(stock.map(s =>
        s.id === stockId ? { ...s, quantity: newQuantity } : s
      ));
    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le stock');
    } finally {
      setUpdatingId(null);
    }
  };

  const getQuantityStyle = (quantity: number) => {
    if (quantity < 5) return styles.quantityLow;
    if (quantity < 20) return styles.quantityMedium;
    return styles.quantityGood;
  };

  const getQuantityBadgeStyle = (quantity: number) => {
    if (quantity < 5) return styles.quantityBadgeLow;
    if (quantity < 20) return styles.quantityBadgeMedium;
    return styles.quantityBadgeGood;
  };

  const renderStockItem = ({ item }: { item: StockItem }) => {
    const isLowStock = item.quantity < 5;
    const isMediumStock = item.quantity >= 5 && item.quantity < 20;

    return (
      <View style={styles.stockItem}>
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleSection}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
            </View>
            {isLowStock && (
              <View style={styles.lowStockBadge}>
                <AlertCircle size={13} color="#dc2626" strokeWidth={2.5} />
                <Text style={styles.lowStockText}>Rupture</Text>
              </View>
            )}
          </View>

          <View style={styles.itemMetaRow}>
            <Text style={styles.itemCategory}>{item.category}</Text>
            <Text style={styles.itemPrice}>{formatXOF(item.price_xof)}</Text>
          </View>
        </View>

        <View style={styles.quantitySection}>
          <View style={[styles.quantityBadge, getQuantityBadgeStyle(item.quantity)]}>
            <Text style={[styles.quantity, getQuantityStyle(item.quantity)]}>
              {item.quantity}
            </Text>
            <Text style={styles.quantityLabel}>u</Text>
          </View>

          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={[styles.controlButton, styles.controlButtonMinus, updatingId === item.id && styles.controlButtonDisabled]}
              onPress={() => updateQuantity(item.id, -1)}
              disabled={updatingId === item.id || item.quantity === 0}
            >
              <Minus size={14} color="#dc2626" strokeWidth={2.5} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.controlButton, styles.controlButtonPlus, updatingId === item.id && styles.controlButtonDisabled]}
              onPress={() => updateQuantity(item.id, 1)}
              disabled={updatingId === item.id}
            >
              <Plus size={14} color="#16a34a" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <AlertCircle size={48} color="#cbd5e1" strokeWidth={1.2} />
      <Text style={styles.emptyText}>
        {filterLowStock ? 'Aucun produit en rupture' : 'Aucun produit en stock'}
      </Text>
    </View>
  );

  const lowStockCount = stock.filter(item => item.quantity < 5).length;
  const totalProducts = stock.length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion du Stock</Text>
        <Text style={styles.headerSubtitle}>
          {totalProducts} produits - {lowStockCount} en rupture imminente
        </Text>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, !filterLowStock && styles.filterButtonActive]}
          onPress={() => setFilterLowStock(false)}
        >
          <Text
            style={[
              styles.filterButtonText,
              !filterLowStock && styles.filterButtonTextActive,
            ]}
          >
            Tous ({totalProducts})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterLowStock && styles.filterButtonActive]}
          onPress={() => setFilterLowStock(true)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterLowStock && styles.filterButtonTextActive,
            ]}
          >
            Ruptures ({lowStockCount})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#16a34a" />
        </View>
      ) : filteredStock.length > 0 ? (
        <FlatList
          data={filteredStock}
          renderItem={renderStockItem}
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
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
    gap: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dcfce7',
    backgroundColor: '#f0fdf4',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  filterButtonTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  itemContent: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemTitleSection: {
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  itemBrand: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: '#fee2e2',
    borderRadius: 5,
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#dc2626',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemCategory: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  quantitySection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  quantityBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 50,
  },
  quantityBadgeGood: {
    backgroundColor: '#dcfce7',
  },
  quantityBadgeMedium: {
    backgroundColor: '#fed7aa',
  },
  quantityBadgeLow: {
    backgroundColor: '#fee2e2',
  },
  quantity: {
    fontSize: 16,
    fontWeight: '800',
  },
  quantityGood: {
    color: '#16a34a',
  },
  quantityMedium: {
    color: '#f97316',
  },
  quantityLow: {
    color: '#dc2626',
  },
  quantityLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 1,
  },
  quantityControls: {
    flexDirection: 'row',
    gap: 4,
  },
  controlButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  controlButtonPlus: {
    backgroundColor: '#dcfce7',
    borderColor: '#16a34a',
  },
  controlButtonMinus: {
    backgroundColor: '#fee2e2',
    borderColor: '#dc2626',
  },
  controlButtonDisabled: {
    opacity: 0.5,
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
  },
  emptyText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 12,
    fontWeight: '500',
  },
});

export default StockScreen;