import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView,
} from 'react-native'
import { Pill, Building2, Bike, Shield, ChevronRight } from 'lucide-react-native'

const ROLES = [
  {
    key: 'client',
    label: 'Client',
    description: 'Commandez vos médicaments',
    Icon: Pill,
    color: '#2563eb',
    bg: '#eff6ff',
  },
  {
    key: 'pharmacy',
    label: 'Pharmacie',
    description: 'Gérez vos commandes',
    Icon: Building2,
    color: '#16a34a',
    bg: '#f0fdf4',
  },
  {
    key: 'deliverer',
    label: 'Livreur',
    description: 'Effectuez des livraisons',
    Icon: Bike,
    color: '#ea580c',
    bg: '#fff7ed',
  },
  {
    key: 'admin',
    label: 'Administrateur',
    description: 'Tableau de bord',
    Icon: Shield,
    color: '#334155',
    bg: '#f8fafc',
  },
]

export default function WelcomeScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Pill size={40} color="#fff" />
          </View>
          <Text style={styles.heroTitle}>Pharmacie{'\n'}à Domicile</Text>
          <Text style={styles.heroSub}>Vos médicaments livrés chez vous</Text>
        </View>

        <View style={styles.body}>
          <Text style={styles.label}>Je suis...</Text>
          <View style={styles.grid}>
            {ROLES.map((role) => (
              <TouchableOpacity
                key={role.key}
                style={styles.card}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Login', { role: role.key })}
              >
                <View style={[styles.cardIcon, { backgroundColor: role.bg }]}>
                  <role.Icon size={28} color={role.color} />
                </View>
                <Text style={styles.cardLabel}>{role.label}</Text>
                <Text style={styles.cardDesc}>{role.description}</Text>
                <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#2563eb' },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: '#2563eb',
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    lineHeight: 38,
  },
  heroSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 8,
    textAlign: 'center',
  },
  body: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  label: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 20,
  },
  grid: {
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  cardDesc: {
    fontSize: 13,
    color: '#6b7280',
    position: 'absolute',
    left: 82,
    top: 32,
  },
  chevron: {},
})
