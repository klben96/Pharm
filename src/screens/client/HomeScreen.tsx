import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
} from 'react-native';
import {
  Bell,
  MapPin,
  Search,
  Camera,
  Pill,
  Zap,
  Shield,
  Heart,
  Sun,
  FileText,
} from 'lucide-react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { supabase } from '../../lib/supabase';
import { formatXOF } from '../../lib/utils';

type Product = {
  id: string;
  name: string;
  brand: string;
  price_xof: number;
  requires_prescription: boolean;
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
  route?: string;
};

const CATEGORIES: Category[] = [
  { id: '1', name: 'Paracétamol', icon: <Pill size={24} color="#ffffff" />, color: '#2563eb' },
  { id: '2', name: 'Vitamines', icon: <Zap size={24} color="#ffffff" />, color: '#06b6d4' },
  { id: '3', name: 'Antibiotiques', icon: <Shield size={24} color="#ffffff" />, color: '#dc2626' },
  { id: '4', name: 'Antalgiques', icon: <Heart size={24} color="#ffffff" />, color: '#ec4899' },
  { id: '5', name: 'Ordonnance', icon: <FileText size={24} color="#ffffff" />, color: '#7c3aed', route: 'Ordonnance' },
  { id: '6', name: 'Dermatologie', icon: <Sun size={24} color="#ffffff" />, color: '#f97316' },
];

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { profile } = useAuth();
  const { addItem } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingPharmacies, setLoadingPharmacies] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchProducts();
      fetchPharmacies();
    }, [])
  );

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, price_xof, requires_prescription')
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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchProducts(), fetchPharmacies()]).finally(() => setRefreshing(false));
  }, []);

  const handleAddProduct = (product: Product) => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      brand: product.brand,
      price_xof: product.price_xof,
      quantity: 1,
      image_url: null,
      requires_prescription: product.requires_prescription,
      pharmacy_id: 'demo-pharmacy',
      pharmacy_name: 'Pharmacie Demo',
    });
  };

  const handleCategoryPress = (category: Category) => {
    if (category.route) {
      navigation.navigate(category.route);
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
        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.productBrand} numberOfLines={1}>{item.brand}</Text>
        <Text style={styles.productPrice}>{formatXOF(item.price_xof)}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => handleAddProduct(item)}
        >
          <Text style={styles.addButtonText}>Ajouter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCategoryChip = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryChip}
      onPress={() => handleCategoryPress(item)}
    >
      <View style={[styles.categoryIcon, { backgroundColor: item.color }]}>
        {item.icon}
      </View>
      <Text style={styles.categoryName} numberOfLines={1}>{item.name}</Text>
    </TouchableOpacity>
  );

  const renderPharmacyCard = ({ item }: { item: Pharmacy }) => (
    <View style={styles.pharmacyCard}>
      <View style={styles.pharmacyHeader}>
        <View style={styles.pharmacyTitleSection}>
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
      </View>
      <Text style={styles.pharmacyAddress}>{item.address}</Text>
      <Text style={styles.pharmacyDistance}>0.8 km</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>
              Bonjour {profile?.full_name || 'Client'}
            </Text>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Bell size={24} color="#2563eb" strokeWidth={1.5} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        <View style={styles.locationChip}>
          <MapPin size={16} color="#2563eb" strokeWidth={2} />
          <Text style={styles.locationText}>Abidjan, Cocody</Text>
        </View>

        <View style={styles.searchRowContainer}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate('Search')}
          >
            <Search size={20} color="#94a3b8" strokeWidth={2} />
            <Text style={styles.searchPlaceholder}>Rechercher un médicament...</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cameraButton}
            onPress={() => navigation.navigate('Ordonnance')}
          >
            <Camera size={20} color="#ffffff" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <FlatList
            data={CATEGORIES}
            renderItem={renderCategoryChip}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
            scrollEnabled={false}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Médicaments populaires</Text>
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
              scrollEnabled={false}
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
              <ActivityIndicator size="large" color="#2563eb" />
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
  notificationButton: {
    padding: 8,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
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
  searchRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
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
  cameraButton: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'space-between',
  },
  categoryChip: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 11,
    color: '#1e293b',
    fontWeight: '500',
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
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
    marginBottom: 8,
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
    marginBottom: 8,
  },
  pharmacyTitleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 6,
  },
  pharmacyDistance: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
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