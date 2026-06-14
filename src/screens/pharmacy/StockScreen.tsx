import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF } from '../../lib/utils';
import { AlertCircle } from 'lucide-react-native';

type StockItem = {
  id: string;
  product_id: string;
  product_name: string;
  category: string;
  price_xof: number;
  quantity: number;
  pharmacy_id: string;
};

const StockScreen: React.FC = () => {
  const { session } = useAuth();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredStock, setFilteredStock] = useState<StockItem[]>([]);
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);

  useEffect(() => {
    fetchStock();
  }, [session?.user?.id]);

  useEffect(() => {
    if (filterOutOfStock) {
      setFilteredStock(stock.filter(item => item.quantity < 5));
    } else {
      setFilteredStock(stock);
    }
  }, [stock, filterOutOfStock]);

  const fetchStock = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pharmacy_stock')
        .select('id, product_id, quantity, pharmacy_id')
        .eq('pharmacy_id', session.user.id)
        .order('quantity', { ascending: true });

      if (error) throw error;

      const stockWithDetails = await Promise.all(
        (data || []).map(async (stock) => {
          const { data: product } = await supabase
            .from('products')
            .select('name, category, price_xof')
            .eq('id', stock.product_id)
            .single();

          return {
            ...stock,
            product_name: product?.name || 'Produit inconnu',
            category: product?.category || 'Autres',
            price_xof: product?.price_xof || 0,
          };
        })
      );

      setStock(stockWithDetails);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStockItem = ({ item }: { item: StockItem }) => {
    const isLowStock = item.quantity < 5;

    return (
      <TouchableOpacity style={styles.stockItem}>
        <View style={styles.itemInfo}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemName}>{item.product_name}</Text>
            {isLowStock && (
              <View style={styles.lowStockBadge}>
                <AlertCircle size={14} color="#dc2626" strokeWidth={2} />
                <Text style={styles.lowStockText}>Rupture</Text>
              </View>
            )}
          </View>
          <Text style={styles.itemCategory}>{item.category}</Text>
          <Text style={styles.itemPrice}>{formatXOF(item.price_xof)}</Text>
        </View>

        <View style={styles.quantitySection}>
          <Text style={[styles.quantity, isLowStock && styles.quantityLow]}>
            {item.quantity}
          </Text>
          <Text style={styles.quantityUnit}>unités</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Aucun produit en stock</Text>
    </View>
  );

  const lowStockCount = stock.filter(item => item.quantity < 5).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stock</Text>
        <Text style={styles.headerSubtitle}>
          {stock.length} produits | {lowStockCount} en rupture
        </Text>
      </View>

      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, !filterOutOfStock && styles.filterButtonActive]}
          onPress={() => setFilterOutOfStock(false)}
        >
          <Text
            style={[
              styles.filterButtonText,
              !filterOutOfStock && styles.filterButtonTextActive,
            ]}
          >
            Tous les produits
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterOutOfStock && styles.filterButtonActive]}
          onPress={() => setFilterOutOfStock(true)}
        >
          <Text
            style={[
              styles.filterButtonText,
              filterOutOfStock && styles.filterButtonTextActive,
            ]}
          >
            En rupture ({lowStockCount})
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
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
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
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  itemName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#fee2e2',
    borderRadius: 4,
  },
  lowStockText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#dc2626',
  },
  itemCategory: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16a34a',
  },
  quantitySection: {
    alignItems: 'flex-end',
  },
  quantity: {
    fontSize: 18,
    fontWeight: '700',
    color: '#16a34a',
  },
  quantityLow: {
    color: '#dc2626',
  },
  quantityUnit: {
    fontSize: 10,
    color: '#64748b',
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
  },
});

export default StockScreen;