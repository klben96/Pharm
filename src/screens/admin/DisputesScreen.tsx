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
import { formatDate } from '../../lib/utils';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  Send,
  X,
} from 'lucide-react-native';

type Dispute = {
  id: string;
  order_id: string;
  reason: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
  reporter_id?: string;
  reporter_name?: string;
  resolution_notes?: string;
};

const DisputesScreen: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResolutionModal, setShowResolutionModal] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('disputes')
        .select('id, order_id, reason, status, created_at, updated_at, reporter_id, resolution_notes')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch reporter names
      const enrichedDisputes = await Promise.all(
        (data || []).map(async (dispute) => {
          let reporterName = 'Inconnu';

          if (dispute.reporter_id) {
            const { data: reporterData } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', dispute.reporter_id)
              .maybeSingle();
            reporterName = reporterData?.full_name || 'Inconnu';
          }

          return {
            ...dispute,
            reporter_name: reporterName,
          };
        })
      );

      setDisputes(enrichedDisputes);
      applyFilters(enrichedDisputes, selectedStatus);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      Alert.alert('Erreur', 'Impossible de charger les litiges');
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  useEffect(() => {
    applyFilters(disputes, selectedStatus);
  }, [selectedStatus, disputes]);

  const applyFilters = (disputeList: Dispute[], status: string | null) => {
    let filtered = disputeList;

    if (status && status !== 'Tous') {
      const statusMap: Record<string, Dispute['status']> = {
        Ouverts: 'open',
        'En cours': 'in_progress',
        Résolus: 'resolved',
      };
      filtered = filtered.filter((d) => d.status === statusMap[status]);
    }

    setFilteredDisputes(filtered);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDisputes();
    setRefreshing(false);
  }, [fetchDisputes]);

  const updateDisputeStatus = async (disputeId: string, newStatus: Dispute['status']) => {
    setProcessingId(disputeId);
    try {
      const { error } = await supabase
        .from('disputes')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      if (error) throw error;

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === disputeId ? { ...d, status: newStatus } : d
        )
      );

      Alert.alert('Succès', `Litige mis à jour (${newStatus})`);
    } catch (error) {
      console.error('Error updating dispute:', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour le litige');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResolve = async () => {
    if (!selectedDispute) return;
    if (!resolutionText.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une note de résolution');
      return;
    }

    setProcessingId(selectedDispute.id);
    try {
      const { error } = await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolution_notes: resolutionText,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedDispute.id);

      if (error) throw error;

      setDisputes((prev) =>
        prev.map((d) =>
          d.id === selectedDispute.id
            ? {
                ...d,
                status: 'resolved',
                resolution_notes: resolutionText,
              }
            : d
        )
      );

      setShowResolutionModal(false);
      setResolutionText('');
      setSelectedDispute(null);
      Alert.alert('Succès', 'Litige résolu');
    } catch (error) {
      console.error('Error resolving dispute:', error);
      Alert.alert('Erreur', 'Impossible de résoudre le litige');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusIcon = (status: Dispute['status']) => {
    switch (status) {
      case 'open':
        return <AlertCircle size={16} color="#ef4444" strokeWidth={2} />;
      case 'in_progress':
        return <Loader size={16} color="#f59e0b" strokeWidth={2} />;
      case 'resolved':
        return <CheckCircle size={16} color="#10b981" strokeWidth={2} />;
    }
  };

  const getStatusColor = (status: Dispute['status']): string => {
    switch (status) {
      case 'open':
        return '#991b1b';
      case 'in_progress':
        return '#7c2d12';
      case 'resolved':
        return '#166534';
    }
  };

  const getStatusLabel = (status: Dispute['status']): string => {
    const labels: Record<Dispute['status'], string> = {
      open: 'Ouvert',
      in_progress: 'En cours',
      resolved: 'Résolu',
    };
    return labels[status];
  };

  const calculateDaysSince = (createdAt: string): number => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const renderDisputeItem = ({ item }: { item: Dispute }) => {
    const daysSince = calculateDaysSince(item.created_at);

    return (
      <View style={styles.disputeCard}>
        <View style={styles.disputeHeader}>
          <View style={styles.disputeIconContainer}>
            {getStatusIcon(item.status)}
          </View>
          <View style={styles.disputeInfo}>
            <Text style={styles.disputeReason}>{item.reason}</Text>
            <Text style={styles.disputeOrderId}>
              Commande: {item.order_id.substring(0, 8).toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.disputeDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Signalé par</Text>
            <Text style={styles.detailValue}>{item.reporter_name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Ouvert depuis</Text>
            <Text style={styles.detailValue}>{daysSince} jour(s)</Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusBadgeText}>{getStatusLabel(item.status)}</Text>
        </View>

        <View style={styles.disputeActions}>
          {item.status !== 'resolved' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, styles.resolveButton]}
                onPress={() => {
                  setSelectedDispute(item);
                  setShowResolutionModal(true);
                }}
                disabled={processingId === item.id}
              >
                {processingId === item.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <CheckCircle size={14} color="#ffffff" strokeWidth={2} />
                    <Text style={styles.actionButtonText}>Résoudre</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, styles.inProgressButton]}
                onPress={() => updateDisputeStatus(item.id, 'in_progress')}
                disabled={processingId === item.id || item.status === 'in_progress'}
              >
                {processingId === item.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Loader size={14} color="#ffffff" strokeWidth={2} />
                    <Text style={styles.actionButtonText}>En cours</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.closeButton]}
            onPress={() => updateDisputeStatus(item.id, 'resolved')}
            disabled={processingId === item.id || item.status === 'resolved'}
          >
            {processingId === item.id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <XCircle size={14} color="#ffffff" strokeWidth={2} />
                <Text style={styles.actionButtonText}>Clore</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {item.resolution_notes && (
          <View style={styles.resolutionNotes}>
            <Text style={styles.resolutionLabel}>Résolution</Text>
            <Text style={styles.resolutionText}>{item.resolution_notes}</Text>
          </View>
        )}
      </View>
    );
  };

  const statusFilters = ['Tous', 'Ouverts', 'En cours', 'Résolus'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Module Litiges</Text>
        <Text style={styles.headerSubtitle}>
          Total: {filteredDisputes.length} litige(s)
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {statusFilters.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              selectedStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(selectedStatus === status ? null : status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedStatus === status && styles.filterButtonTextActive,
              ]}
            >
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredDisputes.length > 0 ? (
        <FlatList
          data={filteredDisputes}
          renderItem={renderDisputeItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun litige</Text>
        </View>
      )}

      <Modal visible={showResolutionModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Résoudre le Litige</Text>
              <TouchableOpacity onPress={() => setShowResolutionModal(false)}>
                <X size={24} color="#f1f5f9" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>
                  Litige: {selectedDispute?.reason}
                </Text>
                <Text style={styles.modalSubLabel}>
                  Commande: {selectedDispute?.order_id.substring(0, 8).toUpperCase()}
                </Text>
              </View>

              <View style={styles.modalSection}>
                <Text style={styles.modalLabel}>Note de Résolution</Text>
                <TextInput
                  style={styles.resolutionInput}
                  placeholder="Entrez votre note de résolution..."
                  placeholderTextColor="#64748b"
                  value={resolutionText}
                  onChangeText={setResolutionText}
                  multiline
                  numberOfLines={5}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowResolutionModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleResolve}
                disabled={processingId === selectedDispute?.id}
              >
                {processingId === selectedDispute?.id ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Send size={16} color="#ffffff" strokeWidth={2} />
                    <Text style={styles.confirmButtonText}>Confirmer</Text>
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
  filterScroll: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  filterButtonTextActive: {
    color: '#ffffff',
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
  disputeCard: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#1e293b',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 10,
  },
  disputeHeader: {
    flexDirection: 'row',
    gap: 10,
  },
  disputeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disputeInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  disputeReason: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  disputeOrderId: {
    fontSize: 10,
    color: '#94a3b8',
  },
  disputeDetails: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#334155',
  },
  detailRow: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  disputeActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 6,
  },
  resolveButton: {
    backgroundColor: '#10b981',
  },
  inProgressButton: {
    backgroundColor: '#f59e0b',
  },
  closeButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#ffffff',
  },
  resolutionNotes: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#0f172a',
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#10b981',
  },
  resolutionLabel: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 2,
  },
  resolutionText: {
    fontSize: 10,
    color: '#cbd5e1',
    lineHeight: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
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
    marginBottom: 4,
  },
  modalSubLabel: {
    fontSize: 11,
    color: '#94a3b8',
  },
  resolutionInput: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#f1f5f9',
    fontSize: 12,
    textAlignVertical: 'top',
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

export default DisputesScreen;