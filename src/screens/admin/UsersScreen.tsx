import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { formatXOF } from '../../lib/utils';
import { Search, Lock, Unlock } from 'lucide-react-native';

type UserProfile = {
  id: string;
  full_name: string;
  role: 'client' | 'pharmacy' | 'deliverer' | 'admin';
  phone: string | null;
  wallet_balance: number;
  is_frozen: boolean;
  created_at: string;
};

const UsersScreen: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, wallet_balance, is_frozen, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
      applyFilters(data || [], searchText, selectedRole);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    applyFilters(users, searchText, selectedRole);
  }, [searchText, selectedRole, users]);

  const applyFilters = (
    userList: UserProfile[],
    search: string,
    role: string | null
  ) => {
    let filtered = userList;

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (u) =>
          u.full_name.toLowerCase().includes(searchLower) ||
          u.phone?.includes(search)
      );
    }

    if (role && role !== 'Tous') {
      const roleMap: Record<string, UserProfile['role']> = {
        Clients: 'client',
        Pharmacies: 'pharmacy',
        Livreurs: 'deliverer',
      };
      filtered = filtered.filter((u) => u.role === roleMap[role]);
    }

    setFilteredUsers(filtered);
  };

  const toggleFreezeAccount = async (user: UserProfile) => {
    Alert.alert(
      user.is_frozen ? 'Débloquer le compte' : 'Bloquer le compte',
      `Êtes-vous certain de vouloir ${user.is_frozen ? 'débloquer' : 'bloquer'} le compte de ${user.full_name}?`,
      [
        { text: 'Annuler', onPress: () => {}, style: 'cancel' },
        {
          text: user.is_frozen ? 'Débloquer' : 'Bloquer',
          onPress: async () => {
            setUpdatingId(user.id);
            try {
              const { error } = await supabase
                .from('profiles')
                .update({ is_frozen: !user.is_frozen })
                .eq('id', user.id);

              if (error) throw error;

              setUsers((prev) =>
                prev.map((u) =>
                  u.id === user.id ? { ...u, is_frozen: !u.is_frozen } : u
                )
              );

              Alert.alert(
                'Succès',
                `Compte ${user.is_frozen ? 'débloqué' : 'bloqué'} avec succès`
              );
            } catch (error) {
              console.error('Error updating user freeze status:', error);
              Alert.alert('Erreur', 'Impossible de mettre à jour le compte');
            } finally {
              setUpdatingId(null);
            }
          },
          style: user.is_frozen ? 'default' : 'destructive',
        },
      ]
    );
  };

  const getRoleBadgeStyle = (role: UserProfile['role']) => {
    const roleStyles: Record<UserProfile['role'], { bg: string; text: string }> = {
      client: { bg: '#3b82f6', text: '#ffffff' },
      pharmacy: { bg: '#16a34a', text: '#ffffff' },
      deliverer: { bg: '#ea580c', text: '#ffffff' },
      admin: { bg: '#475569', text: '#ffffff' },
    };
    return roleStyles[role];
  };

  const getRoleLabel = (role: UserProfile['role']): string => {
    const roleLabels: Record<UserProfile['role'], string> = {
      client: 'Client',
      pharmacy: 'Pharmacie',
      deliverer: 'Livreur',
      admin: 'Admin',
    };
    return roleLabels[role];
  };

  const getInitial = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }, [fetchUsers]);

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const roleBadgeStyle = getRoleBadgeStyle(item.role);
    const isFrozen = item.is_frozen;

    return (
      <View
        style={[
          styles.userItem,
          isFrozen && { backgroundColor: '#1f1a1a', borderColor: '#7f1d1d' },
        ]}
      >
        {isFrozen && <View style={styles.frozenOverlay} />}

        <View
          style={[
            styles.avatarContainer,
            isFrozen && { backgroundColor: '#991b1b' },
          ]}
        >
          {isFrozen ? (
            <Lock size={20} color="#fca5a5" strokeWidth={2} />
          ) : (
            <Text style={styles.avatarText}>{getInitial(item.full_name)}</Text>
          )}
        </View>

        <View style={styles.userInfo}>
          <View style={styles.userNameRow}>
            <Text style={[styles.userName, isFrozen && { color: '#cbd5e1' }]}>
              {item.full_name}
            </Text>
            {isFrozen && (
              <View style={styles.frozenBadge}>
                <Text style={styles.frozenBadgeText}>GELÉ</Text>
              </View>
            )}
          </View>
          <Text style={styles.userPhone}>{item.phone || 'Pas de téléphone'}</Text>
          <Text style={styles.userWallet}>{formatXOF(item.wallet_balance)}</Text>
        </View>

        <View style={styles.userActions}>
          <View
            style={[styles.roleBadge, { backgroundColor: roleBadgeStyle.bg }]}
          >
            <Text style={[styles.roleBadgeText, { color: roleBadgeStyle.text }]}>
              {getRoleLabel(item.role)}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.freezeButton,
              isFrozen
                ? styles.unfreezeButton
                : styles.freezeButtonActive,
            ]}
            onPress={() => toggleFreezeAccount(item)}
            disabled={updatingId === item.id}
          >
            {updatingId === item.id ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : isFrozen ? (
              <>
                <Unlock size={16} color="#ffffff" strokeWidth={2} />
                <Text style={styles.freezeButtonText}>Débloquer</Text>
              </>
            ) : (
              <>
                <Lock size={16} color="#ffffff" strokeWidth={2} />
                <Text style={styles.freezeButtonText}>Bloquer</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const roleButtons = ['Tous', 'Clients', 'Pharmacies', 'Livreurs'];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gestion des Utilisateurs</Text>
        <Text style={styles.headerSubtitle}>
          Total: {filteredUsers.length} utilisateurs
        </Text>
      </View>

      <View style={styles.filterSection}>
        <View style={styles.searchContainer}>
          <Search size={18} color="#94a3b8" strokeWidth={2} />
          <Text
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor="#64748b"
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.rolesScroll}
          contentContainerStyle={styles.rolesContainer}
        >
          {roleButtons.map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleButton,
                selectedRole === role && styles.roleButtonActive,
              ]}
              onPress={() => setSelectedRole(selectedRole === role ? null : role)}
            >
              <Text
                style={[
                  styles.roleButtonText,
                  selectedRole === role && styles.roleButtonTextActive,
                ]}
              >
                {role}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : filteredUsers.length > 0 ? (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
        </View>
      )}
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
  filterSection: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#1e293b',
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: '#f1f5f9',
  },
  rolesScroll: {
    marginBottom: 0,
  },
  rolesContainer: {
    gap: 8,
    paddingHorizontal: 0,
  },
  roleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  roleButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  roleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  roleButtonTextActive: {
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
    gap: 10,
  },
  userItem: {
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
  frozenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    opacity: 0.1,
    borderRadius: 10,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  userInfo: {
    flex: 1,
    zIndex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  frozenBadge: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  frozenBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fca5a5',
    letterSpacing: 0.5,
  },
  userPhone: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 2,
  },
  userWallet: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3b82f6',
  },
  userActions: {
    gap: 8,
    alignItems: 'flex-end',
    zIndex: 1,
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  freezeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#166534',
  },
  freezeButtonActive: {
    backgroundColor: '#991b1b',
  },
  unfreezeButton: {
    backgroundColor: '#166534',
  },
  freezeButtonText: {
    fontSize: 10,
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

export default UsersScreen;