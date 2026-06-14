import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate } from '../../lib/utils';
import { TrendingUp } from 'lucide-react-native';

type Earning = {
  id: string;
  amount: number;
  order_id: string;
  created_at: string;
};

const EarningsScreen: React.FC = () => {
  const { session } = useAuth();
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [earnings, setEarnings] = useState<Earning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, [session?.user?.id]);

  const fetchEarnings = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deliverer_earnings')
        .select('id, amount, order_id, created_at')
        .eq('deliverer_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setEarnings(data || []);

      const total = (data || []).reduce((sum, e) => sum + e.amount, 0);
      setTotalEarnings(total);
    } catch (error) {
      console.error('Error fetching earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderEarningItem = ({ item }: { item: Earning }) => (
    <View style={styles.earningItem}>
      <View style={styles.earningInfo}>
        <Text style={styles.earningLabel}>
          Commande #{item.order_id.substring(0, 8).toUpperCase()}
        </Text>
        <Text style={styles.earningDate}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.earningAmount}>{formatXOF(item.amount)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mes gains</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : (
          <>
            <View style={styles.totalCard}>
              <View style={styles.totalIcon}>
                <TrendingUp size={32} color="#ffffff" strokeWidth={1.5} />
              </View>
              <View>
                <Text style={styles.totalLabel}>Gains totaux</Text>
                <Text style={styles.totalAmount}>
                  {formatXOF(totalEarnings)}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Gains récents</Text>
              {earnings.length > 0 ? (
                <FlatList
                  data={earnings}
                  renderItem={renderEarningItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  contentContainerStyle={styles.earningsList}
                />
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>Aucun gain enregistré</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
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
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#fef3f2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    gap: 12,
  },
  totalIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ea580c',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10,
  },
  earningsList: {
    gap: 8,
  },
  earningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  earningInfo: {
    flex: 1,
  },
  earningLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 2,
  },
  earningDate: {
    fontSize: 11,
    color: '#64748b',
  },
  earningAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ea580c',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
  },
});

export default EarningsScreen;