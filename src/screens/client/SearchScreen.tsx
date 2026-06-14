import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Search, X } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { formatXOF } from '../../lib/utils';

type Product = {
  id: string;
  name: string;
  brand: string;
  price_xof: number;
};

type Filter = 'all' | 'medicines' | 'vitamins' | 'prescription';

const SearchScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<Filter>('all');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (searchQuery.trim()) {
      searchProducts();
    } else {
      setProducts([]);
      setSearched(false);
    }
  }, [searchQuery, selectedFilter]);

  const searchProducts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('products')
        .select('id, name, brand, price_xof');

      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,brand.ilike.%${searchQuery}%`
        );
      }

      if (selectedFilter !== 'all') {
        const categoryMap: Record<Filter, string> = {
          all: '',
          medicines: 'Médicaments',
          vitamins: 'Vitamines',
          prescription: 'Ordonnance',
        };
        const category = categoryMap[selectedFilter];
        if (category) {
          query = query.eq('category', category);
        }
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setProducts(data || []);
      setSearched(true);
    } catch (error) {
      console.error('Error searching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity style={styles.productItem}>
      <View style={styles.productImageBox}>
        <Text style={styles.productInitial}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.productContent}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <Text style={styles.productPrice}>{formatXOF(item.price_xof)}</Text>
      </View>
      <TouchableOpacity style={styles.addToCartButton}>
        <Text style={styles.addToCartText}>Ajouter</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const filterChips: { label: string; value: Filter }[] = [
    { label: 'Tous', value: 'all' },
    { label: 'Médicaments', value: 'medicines' },
    { label: 'Vitamines', value: 'vitamins' },
    { label: 'Ordonnance', value: 'prescription' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputWrapper}>
          <Search size={20} color="#64748b" strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Chercher un médicament..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#64748b" strokeWidth={2} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <View style={styles.filterContainer}>
        <FlatList
          data={filterChips}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setSelectedFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedFilter === item.value && styles.filterChipTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.value}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : searched && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>Aucun produit trouvé</Text>
          <Text style={styles.emptySubtext}>
            Essayez une autre recherche
          </Text>
        </View>
      ) : products.length > 0 ? (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.centerContainer}>
          <Text style={styles.placeholderText}>
            Commencez votre recherche
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
  },
  filterContainer: {
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  filterChipActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  productImageBox: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInitial: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  productContent: {
    flex: 1,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2563eb',
  },
  addToCartButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#2563eb',
    borderRadius: 6,
  },
  addToCartText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#64748b',
  },
  placeholderText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});

export default SearchScreen;