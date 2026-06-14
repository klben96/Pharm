import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { Building2 } from 'lucide-react-native';

type Pharmacy = {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  is_active: boolean;
};

const PharmaciesScreen: React.FC = () => {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPharmacies();
  }, []);

  const fetchPharmacies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('pharmacies')
        .select('id, name, address, phone, is_active')
        .order('name', { ascending: true });

      if (error) throw error;
      setPharmacies(data || []);
    } catch (error) {
      console.error('Error fetching pharmacies:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderPharmacyItem = ({ item }: { item: Pharmacy }) => (
    <View style={styles.pharmacyItem}>
      <View style={styles.pharmacyIcon}>
        <Building2 size={24} color="#ffffff" strokeWidth={1.5} />
      </View>

      <View style={styles.pharmacyInfo}>
        <Text style={styles.pharmacyName}>{item.name}</Text>
        <Text style={styles.pharmacyAddress}>{item.address}</Text>
        {item.phone && (
          <Text style={styles.pharmacyPhone}>{item.phone}</Text>
        )}
      </View>

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
    </View>
  );

  const activeCount = pharmacies.filter(p => p.is_active).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pharmacies</Text>
        <Text style={styles.headerSubtitle}>
          {activeCount} actives / {pharmacies.length} total
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      ) : pharmacies.length > 0 ? (
        <FlatList
          data={pharmacies}
          renderItem={renderPharmacyItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucune pharmacie</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  pharmacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
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
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  pharmacyAddress: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  pharmacyPhone: {
    fontSize: 10,
    color: '#64748b',
  },
  statusIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#64748b',
  },
});

export default PharmaciesScreen;