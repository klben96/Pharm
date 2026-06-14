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

type UserProfile = {
  id: string;
  full_name: string;
  role: 'client' | 'pharmacy' | 'deliverer' | 'admin';
  phone: string | null;
  created_at: string;
};

const UsersScreen: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, phone, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
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

  const renderUserItem = ({ item }: { item: UserProfile }) => {
    const roleBadgeStyle = getRoleBadgeStyle(item.role);

    return (
      <View style={styles.userItem}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{getInitial(item.full_name)}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.full_name}</Text>
          <Text style={styles.userPhone}>
            {item.phone || 'Non renseigné'}
          </Text>
        </View>

        <View
          style={[styles.roleBadge, { backgroundColor: roleBadgeStyle.bg }]}
        >
          <Text style={[styles.roleBadgeText, { color: roleBadgeStyle.text }]}>
            {getRoleLabel(item.role)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Utilisateurs</Text>
        <Text style={styles.headerSubtitle}>
          Total: {users.length} utilisateurs
        </Text>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#e11d48" />
        </View>
      ) : users.length > 0 ? (
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aucun utilisateur</Text>
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
  userItem: {
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
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 11,
    color: '#94a3b8',
  },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
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