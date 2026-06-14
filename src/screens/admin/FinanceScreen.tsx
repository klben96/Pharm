import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  RefreshControl,
  Alert,
  ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDate } from '../../lib/utils';
import {
  TrendingUp,
  Wallet,
  Send,
  Check,
  X,
  Gift,
} from 'lucide-react-native';

type WalletTransaction = {
  id: string;
  user_id: string;
  type: 'withdrawal' | 'bonus' | 'commission' | 'refund';
  amount: number;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  user_name?: string;
  user_phone?: string;
};

type FinancialSummary = {
  totalRevenue: number;
  totalCommissions: number;
  totalRefunds: number;
};

const FinanceScreen: React.FC = () => {
  const [summary, setSummary] = useState<FinancialSummary>({
    totalRevenue: 0,
    totalCommissions: 0,
    totalRefunds: 0,
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusUserId, setBonusUserId] = useState('');
  const [bonusAmount, setBonusAmount] = useState('');
  const [bonusNote, setBonusNote] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [allUsers, setAllUsers] = useState<{ id: string; full_name: string }[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch financial summary from orders
      const { data: ordersData } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('status', 'delivered');

      const totalRevenue = (ordersData || []).reduce(
        (sum, order) => sum + (order.total_amount || 0),
        0
      );

      // Fetch all wallet transactions
      const { data: transData } = await supabase
        .from('wallet_transactions')
        .select('id, user_id, type, amount, status, created_at')
        .order('created_at', { ascending: false });

      const allTransactions = transData || [];

      const totalCommissions = allTransactions
        .filter((t) => t.type === 'commission')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      const totalRefunds = allTransactions
        .filter((t) => t.type === 'refund')
        .reduce((sum, t) => sum + (t.amount || 0), 0);

      setSummary({
        totalRevenue,
        totalCommissions,
        totalRefunds,
      });

      // Enrich transactions with user names
      const enrichedTransactions = await Promise.all(
        allTransactions.map(async (trans) => {
          let userName = 'Inconnu';
          let userPhone = '';

          if (trans.user_id) {
            const { data: userData } = await supabase
              .from('profiles')
              .select('full_name, phone')
              .eq('id', trans.user_id)
              .maybeSingle();

            userName = userData?.full_name || 'Inconnu';
            userPhone = userData?.phone || '';
          }

          return {
            ...trans,
            user_name: userName,
            user_phone: userPhone,
          };
        })
      );

      setTransactions(enrichedTransactions);

      // Get pending withdrawals
      const pending = enrichedTransactions.filter(
        (t) => t.type === 'withdrawal' && t.status === 'pending'
      );
      setPendingWithdrawals(pending);

      // Fetch all users for bonus dropdown
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name', { ascending: true });

      setAllUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      Alert.alert('Erreur', 'Impossible de charger les données financières');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const updateWithdrawalStatus = async (
    transactionId: string,
    newStatus: 'completed' | 'rejected'
  ) => {
    setProcessingId(transactionId);
    try {
      const { error } = await supabase
        .from('wallet_transactions')
        .update({ status: newStatus })
        .eq('id', transactionId);

      if (error) throw error;

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, status: newStatus } : t
        )
      );

      setPendingWithdrawals((prev) =>
        prev.filter((t) => t.id !== transactionId)
      );

      Alert.alert(
        'Succès',
        `Retrait ${newStatus === 'completed' ? 'validé' : 'rejeté'}`
      );
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le retrait');
    } finally {
      setProcessingId(null);
    }
  };

  const handleValidateAll = async () => {
    if (pendingWithdrawals.length === 0) {
      Alert.alert('Info', 'Aucun retrait en attente');
      return;
    }

    Alert.alert(
      'Confirmation',
      `Valider ${pendingWithdrawals.length} retrait(s)?`,
      [
        { text: 'Annuler', onPress: () => {}, style: 'cancel' },
        {
          text: 'Valider tout',
          onPress: async () => {
            setProcessingId('all');
            try {
              for (const withdrawal of pendingWithdrawals) {
                await supabase
                  .from('wallet_transactions')
                  .update({ status: 'completed' })
                  .eq('id', withdrawal.id);
              }

              await fetchData();
              Alert.alert('Succès', 'Tous les retraits ont été validés');
            } catch (error) {
              console.error('Error validating withdrawals:', error);
              Alert.alert('Erreur', 'Impossible de valider les retraits');
            } finally {
              setProcessingId(null);
            }
          },
          style: 'default',
        },
      ]
    );
  };

  const handleSendBonus = async () => {
    if (!bonusUserId) {
      Alert.alert('Erreur', 'Sélectionnez un utilisateur');
      return;
    }
    if (!bonusAmount || parseFloat(bonusAmount) <= 0) {
      Alert.alert('Erreur', 'Entrez un montant valide');
      return;
    }

    setProcessingId('bonus');
    try {
      const { error } = await supabase.from('wallet_transactions').insert([
        {
          user_id: bonusUserId,
          type: 'bonus',
          amount: parseFloat(bonusAmount),
          status: 'completed',
          notes: bonusNote,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Update user's wallet balance
      const { data: userData } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', bonusUserId)
        .maybeSingle();

      const newBalance = (userData?.wallet_balance || 0) + parseFloat(bonusAmount);

      await supabase
        .from('profiles')
        .update({ wallet_balance: newBalance })
        .eq('id', bonusUserId);

      setShowBonusModal(false);
      setBonusUserId('');
      setBonusAmount('');
      setBonusNote('');
      await fetchData();
      Alert.alert('Succès', 'Bonus attribué avec succès');
    } catch (error) {
      console.error('Error sending bonus:', error);
      Alert.alert('Erreur', 'Impossible d\'attribuer le bonus');
    } finally {
      setProcessingId(null);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return <Send size={14} color="#f59e0b" strokeWidth={2} />;
      case 'bonus':
        return <Gift size={14} color="#10b981" strokeWidth={2} />;
      case 'commission':
        return <TrendingUp size={14} color="#3b82f6" strokeWidth={2} />;
      case 'refund':
        return <X size={14} color="#ef4444" strokeWidth={2} />;
      default:
        return <Wallet size={14} color="#94a3b8" strokeWidth={2} />;
    }
  };

  const getTransactionLabel = (type: string): string => {
    const labels: Record<string, string> = {
      withdrawal: 'Retrait',
      bonus: 'Bonus',
      commission: 'Commission',
      refund: 'Remboursement',
    };
    return labels[type] || type;
  };

  const renderPendingWithdrawal = ({ item }: { item: WalletTransaction }) => (
    <View style={styles.withdrawalCard}>
      <View style={styles.withdrawalInfo}>
        <Text style={styles.withdrawalName}>{item.user_name}</Text>
        <Text style={styles.withdrawalPhone}>{item.user_phone}</Text>
      </View>

      <Text style={styles.withdrawalAmount}>{formatXOF(item.amount)}</Text>

      <View style={styles.withdrawalActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.validateButton]}
          onPress={() => updateWithdrawalStatus(item.id, 'completed')}
          disabled={processingId === item.id}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Check size={12} color="#ffffff" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Valider</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => updateWithdrawalStatus(item.id, 'rejected')}
          disabled={processingId === item.id}
        >
          {processingId === item.id ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <X size={12} color="#ffffff" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Rejeter</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => {
    const isPositive = item.type === 'bonus' || item.type === 'commission';

    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionIcon}>{getTransactionIcon(item.type)}</View>

        <View style={styles.transactionInfo}>
          <Text style={styles.transactionLabel}>
            {getTransactionLabel(item.type)}
          </Text>
          <Text style={styles.transactionUser}>{item.user_name}</Text>
        </View>

        <View style={styles.transactionAmount}>
          <Text
            style={[
              styles.amount,
              isPositive ? styles.amountPositive : styles.amountNegative,
            ]}
          >
            {isPositive ? '+' : '-'}
            {formatXOF(item.amount)}
          </Text>
          <View
            style={[
              styles.statusBadge,
              item.status === 'completed' && styles.completedBadge,
              item.status === 'pending' && styles.pendingBadge,
              item.status === 'rejected' && styles.rejectedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {item.status === 'completed' ? 'OK' : item.status === 'pending' ? 'Attente' : 'Rejeté'}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion Financière</Text>
        <Text style={styles.headerSubtitle}>Supervision des transactions</Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Revenue Summary */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Revenu Total</Text>
              <Text style={styles.summaryValue}>{formatXOF(summary.totalRevenue)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Commissions</Text>
              <Text style={styles.summaryValue}>{formatXOF(summary.totalCommissions)}</Text>
            </View>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Remboursements</Text>
              <Text style={styles.summaryValue}>{formatXOF(summary.totalRefunds)}</Text>
            </View>
          </View>

          {/* Pending Withdrawals Section */}
          {pendingWithdrawals.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Retraits en Attente</Text>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{pendingWithdrawals.length}</Text>
                </View>
              </View>

              <FlatList
                data={pendingWithdrawals}
                renderItem={renderPendingWithdrawal}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.withdrawalsList}
              />

              <TouchableOpacity
                style={styles.validateAllButton}
                onPress={handleValidateAll}
                disabled={processingId === 'all'}
              >
                {processingId === 'all' ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Check size={16} color="#ffffff" strokeWidth={2} />
                    <Text style={styles.validateAllButtonText}>Valider tout</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Bonus Management Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Attribuer un Bonus</Text>
            <TouchableOpacity
              style={styles.bonusButton}
              onPress={() => setShowBonusModal(true)}
            >
              <Gift size={16} color="#ffffff" strokeWidth={2} />
              <Text style={styles.bonusButtonText}>Nouveau Bonus</Text>
            </TouchableOpacity>
          </View>

          {/* Recent Transactions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transactions Récentes</Text>
            {transactions.length > 0 ? (
              <FlatList
                data={transactions.slice(0, 20)}
                renderItem={renderTransactionItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.transactionsList}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>Aucune transaction</Text>
              </View>
            )}
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      )}

      {/* Bonus Modal */}
      <Modal visible={showBonusModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Attribuer un Bonus</Text>
              <TouchableOpacity onPress={() => setShowBonusModal(false)}>
                <X size={24} color="#f1f5f9" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Utilisateur</Text>
                <ScrollView
                  style={styles.userList}
                  nestedScrollEnabled={true}
                >
                  {allUsers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        styles.userOption,
                        bonusUserId === user.id && styles.userOptionSelected,
                      ]}
                      onPress={() => setBonusUserId(user.id)}
                    >
                      <Text
                        style={[
                          styles.userOptionText,
                          bonusUserId === user.id && styles.userOptionTextSelected,
                        ]}
                      >
                        {user.full_name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Montant (XOF)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0"
                  placeholderTextColor="#64748b"
                  value={bonusAmount}
                  onChangeText={setBonusAmount}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Note (optionnel)</Text>
                <TextInput
                  style={[styles.modalInput, styles.noteInput]}
                  placeholder="Raison du bonus..."
                  placeholderTextColor="#64748b"
                  value={bonusNote}
                  onChangeText={setBonusNote}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowBonusModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleSendBonus}
                disabled={processingId === 'bonus'}
              >
                {processingId === 'bonus' ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Send size={16} color="#ffffff" strokeWidth={2} />
                    <Text style={styles.confirmButtonText}>Envoyer</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  summaryGrid: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  summaryCard: {
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3b82f6',
  },
  section: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f1f5f9',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pendingBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  pendingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  withdrawalsList: {
    gap: 8,
    marginBottom: 10,
  },
  withdrawalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  withdrawalInfo: {
    flex: 1,
  },
  withdrawalName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  withdrawalPhone: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  withdrawalAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f59e0b',
    marginRight: 8,
  },
  withdrawalActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  validateButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  validateAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#10b981',
    borderRadius: 8,
    marginBottom: 10,
  },
  validateAllButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  bonusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    marginBottom: 10,
  },
  bonusButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  transactionsList: {
    gap: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  transactionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  transactionUser: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontSize: 12,
    fontWeight: '800',
  },
  amountPositive: {
    color: '#10b981',
  },
  amountNegative: {
    color: '#f59e0b',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: '#166534',
  },
  pendingBadgeStatus: {
    backgroundColor: '#7c2d12',
  },
  rejectedBadge: {
    backgroundColor: '#7f1d1d',
  },
  statusText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyState: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 12,
    color: '#64748b',
  },
  bottomPadding: {
    height: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 8,
  },
  userList: {
    maxHeight: 150,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userOption: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  userOptionSelected: {
    backgroundColor: '#334155',
  },
  userOptionText: {
    fontSize: 12,
    color: '#cbd5e1',
  },
  userOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f1f5f9',
    fontSize: 12,
  },
  noteInput: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  confirmButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
});

export default FinanceScreen;