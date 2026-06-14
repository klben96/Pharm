import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import {
  Bell,
  MapPin,
  Search,
  Pill,
  Thermometer,
  Heart,
  Zap,
  Droplet,
  Star,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF } from '../../lib/utils';

type Product = {
  id: string;
  name: string;
  brand: string;
  price_xof: number;
  rating: number;
  stock_quantity: number;
};

type Pharmacy = {
  id: string;
  name: string;
  address: string;
  is_active: boolean;
};

type Category = {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
};

const CATEGORIES: Category[] = [
  { id: '1', name: 'Paracétamol', icon: <Pill size={24} />, color: '#2563eb' },
  { id: '2', name: 'Vitamines', icon: <Thermometer size={24} />, color: '#06b6d4' },
  { id: '3', name: 'Antibiotiques', icon: <Heart size={24} />, color: '#ec4899' },
  { id: '4', name: 'Antalgiques', icon: <Zap size={24} />, color: '#f59e0b' },
  { id: '5', name: 'Dermato', icon: <Droplet size={24} />, color: '#14b8a6' },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { profile } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingPharmacies, setLoadingPharmacies] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchPharmacies();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, price_xof, rating, stock_quantity')
        .limit(10);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchPharmacies = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('id, name, address, is_active')
        .limit(5);

      if (error) throw error;
      setPharmacies(data || []);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    } finally {
      setLoadingPharmacies(false);
    }
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <View style={styles.productImagePlaceholder}>
        <Text style={styles.productInitial}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productBrand}>{item.brand}</Text>
        <View style={styles.productFooter}>
          <Text style={styles.productPrice}>{formatXOF(item.price_xof)}</Text>
          <View style={styles.rating}>
            <Star size={14} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryChip = ({ item }: { item: Category }) => (
    <TouchableOpacity style={styles.categoryChip}>
      <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
        {item.icon}
      </View>
      <Text style={styles.categoryName}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderPharmacyCard = ({ item }: { item: Pharmacy }) => (
    <View style={styles.pharmacyCard}>
      <View style={styles.pharmacyHeader}>
        <Text style={styles.pharmacyName}>{item.name}</Text>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.is_active ? '#dcfce7' : '#fee2e2' },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: item.is_active ? '#16a34a' : '#dc2626' },
            ]}
          >
            {item.is_active ? 'Ouvert' : 'Fermé'}
          </Text>
        </View>
      </View>
      <Text style={styles.pharmacyAddress}>{item.address}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              Bonjour, {profile?.full_name || 'Client'}
            </Text>
            <Text style={styles.greetingTime}>Trouvez vos médicaments</Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#2563eb" strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <View style={styles.locationChip}>
          <MapPin size={16} color="#2563eb" strokeWidth={2} />
          <Text style={styles.locationText}>Dakar, Sénégal</Text>
        </View>

        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('Search')}
        >
          <Search size={20} color="#64748b" strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Chercher un médicament</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catégories</Text>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produits en vedette</Text>
          {loadingProducts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
          ) : products.length > 0 ? (
            <FlatList
              data={products}
              renderItem={renderProductCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsContainer}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Aucun produit disponible</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pharmacies à proximité</Text>
          {loadingPharmacies ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#16a34a" />
            </View>
          ) : pharmacies.length > 0 ? (
            <FlatList
              data={pharmacies}
              renderItem={renderPharmacyCard}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Aucune pharmacie à proximité
              </Text>
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  greetingTime: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 4,
  },
  notificationButton: {
    padding: 8,
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    alignSelf: 'flex-start',
  },
  locationText: {
    marginLeft: 8,
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchPlaceholder: {
    marginLeft: 10,
    fontSize: 14,
    color: '#94a3b8',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryChip: {
    alignItems: 'center',
    gap: 8,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
    width: 60,
    textAlign: 'center',
  },
  productsContainer: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    width: 140,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  productImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInitial: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  productBrand: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 8,
  },
  productFooter: {
    marginBottom: 8,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  addButton: {
    paddingVertical: 6,
    backgroundColor: '#2563eb',
    borderRadius: 6,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  pharmacyCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  pharmacyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pharmacyName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  pharmacyAddress: {
    fontSize: 12,
    color: '#64748b',
  },
  loadingContainer: {
    marginHorizontal: 16,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    marginHorizontal: 16,
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});

export default HomeScreen;