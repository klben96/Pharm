import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { formatXOF, formatDateShort } from '../../lib/utils';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  Check,
} from 'lucide-react-native';

type WalletTransaction = {
  id: string;
  type: 'credit' | 'debit' | 'withdrawal';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  created_at: string;
};

const EarningsScreen: React.FC = () => {
  const { session, profile, refreshProfile } = useAuth();
  const [walletBalance, setWalletBalance] = useState(0);
  const [monthlyEarnings, setMonthlyEarnings] = useState(0);
  const [deliveriesCount, setDeliveriesCount] = useState(0);
  const [tipsReceived, setTipsReceived] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [selectedOperator, setSelectedOperator] = useState<
    'orange' | 'mtn' | 'wave'
  >('orange');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchEarningsData();
    }, [session?.user?.id])
  );

  const fetchEarningsData = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const delivererId = session.user.id;

      // Fetch wallet balance
      const { data: profileData } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', delivererId)
        .single();

      if (profileData) {
        setWalletBalance(profileData.wallet_balance || 0);
      }

      // Fetch monthly earnings
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];

      const { data: monthlyOrders } = await supabase
        .from('orders')
        .select('delivery_fee')
        .eq('deliverer_id', delivererId)
        .eq('status', 'delivered')
        .gte('created_at', `${monthStart}T00:00:00`)
        .lte('created_at', `${monthEnd}T23:59:59`);

      const monthlyTotal = (monthlyOrders || []).reduce(
        (sum, order) => sum + (order.delivery_fee || 0),
        0
      );
      setMonthlyEarnings(monthlyTotal);
      setDeliveriesCount(monthlyOrders?.length || 0);

      // Fetch tips
      const { data: tipsData } = await supabase
        .from('wallet_transactions')
        .select('amount')
        .eq('deliverer_id', delivererId)
        .eq('type', 'credit')
        .ilike('description', '%pourboire%');

      const tipsTotal = (tipsData || []).reduce(
        (sum, tip) => sum + (tip.amount || 0),
        0
      );
      setTipsReceived(tipsTotal);

      // Fetch transactions
      const { data: transData, error: transError } = await supabase
        .from('wallet_transactions')
        .select('id, type, amount, description, status, created_at')
        .eq('deliverer_id', delivererId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (transError) throw transError;

      setTransactions(transData || []);
    } catch (error) {
      console.error('Error fetching earnings data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!withdrawalAmount || !phoneNumber) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    const amount = parseFloat(withdrawalAmount);
    if (amount <= 0 || amount > walletBalance) {
      Alert.alert(
        'Erreur',
        'Montant invalide. Vérifiez votre solde disponible.'
      );
      return;
    }

    setSubmitting(true);
    try {
      // Create withdrawal transaction
      const { error: transError } = await supabase
        .from('wallet_transactions')
        .insert({
          deliverer_id: session?.user?.id,
          type: 'withdrawal',
          amount,
          description: `Retrait ${selectedOperator.toUpperCase()} - ${phoneNumber}`,
          status: 'pending',
          operator: selectedOperator,
          phone_number: phoneNumber,
          created_at: new Date().toISOString(),
        });

      if (transError) throw transError;

      // Update wallet balance
      await supabase
        .from('profiles')
        .update({ wallet_balance: walletBalance - amount })
        .eq('id', session?.user?.id);

      setWalletBalance(walletBalance - amount);

      Alert.alert(
        'Succès',
        `Demande de retrait de ${formatXOF(amount)} envoyée. Vous recevrez votre argent dans 5-10 minutes.`
      );

      setShowWithdrawalModal(false);
      setWithdrawalAmount('');
      setPhoneNumber('');
      fetchEarningsData();
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      Alert.alert('Erreur', 'Impossible de traiter le retrait');
    } finally {
      setSubmitting(false);
    }
  };

  const renderTransactionItem = ({ item }: { item: WalletTransaction }) => {
    const isCredit = item.type === 'credit';
    const isWithdrawal = item.type === 'withdrawal';

    return (
      <View style={styles.transactionItem}>
        <View style={[styles.transactionIcon, isCredit && styles.transactionIconCredit]}>
          {isCredit ? (
            <ArrowDownLeft size={18} color="#ffffff" strokeWidth={2} />
          ) : (
            <ArrowUpRight size={18} color="#ffffff" strokeWidth={2} />
          )}
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionDate}>
              {formatDateShort(item.created_at)}
            </Text>
            {item.status === 'pending' && (
              <Text style={styles.transactionStatus}>En attente</Text>
            )}
            {item.status === 'failed' && (
              <Text style={[styles.transactionStatus, { color: '#dc2626' }]}>
                Échoué
              </Text>
            )}
          </View>
        </View>
        <Text
          style={[
            styles.transactionAmount,
            isCredit
              ? styles.transactionAmountPositive
              : styles.transactionAmountNegative,
          ]}
        >
          {isCredit ? '+' : '-'}
          {formatXOF(item.amount)}
        </Text>
      </View>
    );
  };

  const renderWithdrawalModal = () => (
    <Modal
      visible={showWithdrawalModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowWithdrawalModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Retrait Mobile Money</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowWithdrawalModal(false)}
              disabled={submitting}
            >
              <X size={24} color="#0f172a" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.modalBody}
          >
            {/* Current Balance */}
            <View style={styles.balanceBox}>
              <Wallet size={20} color="#ea580c" strokeWidth={1.5} />
              <View>
                <Text style={styles.balanceLabel}>Solde disponible</Text>
                <Text style={styles.balanceAmount}>{formatXOF(walletBalance)}</Text>
              </View>
            </View>

            {/* Amount Input */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Montant à retirer</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="#cbd5e1"
                value={withdrawalAmount}
                onChangeText={setWithdrawalAmount}
                keyboardType="decimal-pad"
                editable={!submitting}
              />
            </View>

            {/* Operator Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Opérateur</Text>
              <View style={styles.operatorGrid}>
                {['orange', 'mtn', 'wave'].map((operator) => (
                  <TouchableOpacity
                    key={operator}
                    style={[
                      styles.operatorButton,
                      selectedOperator === operator &&
                        styles.operatorButtonActive,
                    ]}
                    onPress={() => setSelectedOperator(operator as any)}
                    disabled={submitting}
                  >
                    <Text
                      style={[
                        styles.operatorButtonText,
                        selectedOperator === operator &&
                          styles.operatorButtonTextActive,
                      ]}
                    >
                      {operator === 'orange'
                        ? 'Orange Money'
                        : operator === 'mtn'
                          ? 'MTN Moov'
                          : 'Wave'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Phone Number Input */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Numéro de téléphone</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="Exemple: +225 01 23 45 67 89"
                placeholderTextColor="#cbd5e1"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                editable={!submitting}
              />
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                Votre argent sera crédité dans 5 à 10 minutes sur le numéro spécifié.
              </Text>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!withdrawalAmount || !phoneNumber || submitting) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleWithdrawal}
              disabled={!withdrawalAmount || !phoneNumber || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={20} color="#ffffff" strokeWidth={2} />
                  <Text style={styles.submitButtonText}>Confirmer le retrait</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowWithdrawalModal(false)}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Annuler</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Portefeuille</Text>
        </View>

        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#ea580c" />
          </View>
        ) : (
          <>
            {/* Wallet Card */}
            <View style={styles.walletCard}>
              <View style={styles.walletIcon}>
                <Wallet size={32} color="#ffffff" strokeWidth={1.5} />
              </View>
              <View style={styles.walletContent}>
                <Text style={styles.walletLabel}>Solde disponible</Text>
                <Text style={styles.walletAmount}>{formatXOF(walletBalance)}</Text>
              </View>
              <View style={styles.walletButtons}>
                <TouchableOpacity
                  style={styles.walletButtonPrimary}
                  onPress={() => setShowWithdrawalModal(true)}
                >
                  <Text style={styles.walletButtonPrimaryText}>Retirer</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.walletButtonSecondary}>
                  <Text style={styles.walletButtonSecondaryText}>Historique</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Gains du mois</Text>
                <Text style={styles.statValue}>{formatXOF(monthlyEarnings)}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Courses effectuées</Text>
                <Text style={styles.statValue}>{deliveriesCount}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Pourboires reçus</Text>
                <Text style={styles.statValue}>{formatXOF(tipsReceived)}</Text>
              </View>
            </View>

            {/* Transactions Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Transactions récentes</Text>
              {transactions.length > 0 ? (
                <FlatList
                  data={transactions}
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
          </>
        )}
      </ScrollView>

      {/* Withdrawal Modal */}
      {renderWithdrawalModal()}
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
    paddingVertical: 60,
  },
  walletCard: {
    marginHorizontal: 16,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  walletIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  walletContent: {
    marginBottom: 14,
  },
  walletLabel: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ea580c',
  },
  walletButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  walletButtonPrimary: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#ea580c',
    borderRadius: 8,
    alignItems: 'center',
  },
  walletButtonPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  walletButtonSecondary: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    alignItems: 'center',
  },
  walletButtonSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ea580c',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ea580c',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 10,
  },
  transactionsList: {
    gap: 8,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconCredit: {
    backgroundColor: '#dcfce7',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 3,
  },
  transactionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transactionDate: {
    fontSize: 11,
    color: '#64748b',
  },
  transactionStatus: {
    fontSize: 10,
    color: '#f59e0b',
    fontWeight: '500',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  transactionAmountPositive: {
    color: '#16a34a',
  },
  transactionAmountNegative: {
    color: '#dc2626',
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 32,
  },
  balanceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fef3f2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginBottom: 16,
    gap: 12,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ea580c',
  },
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 8,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
  },
  operatorGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  operatorButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    alignItems: 'center',
  },
  operatorButtonActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  operatorButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  operatorButtonTextActive: {
    color: '#ffffff',
  },
  phoneInput: {
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0f172a',
  },
  infoBox: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#dbeafe',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 12,
    color: '#1e40af',
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#ea580c',
    borderRadius: 8,
    gap: 8,
    marginBottom: 10,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  cancelButton: {
    paddingVertical: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748b',
  },
});

export default EarningsScreen;