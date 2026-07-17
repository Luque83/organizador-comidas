import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { useHouseholdStore } from '@/store/useHouseholdStore';
import * as Clipboard from 'expo-clipboard';

export default function HouseholdSettingsScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { activeHousehold, membersProfiles, role } = useHouseholdStore();
  const [copied, setCopied] = useState(false);

  if (!activeHousehold) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Gestión del Hogar</Text>
        </View>
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>No perteneces a ningún hogar.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleCopyCode = async () => {
    // El ID del hogar es el código de invitación (simplificado para este ejemplo)
    // En un sistema real podría ser un código de 6 letras generado.
    const inviteCode = activeHousehold.id.split('-')[0].toUpperCase();
    await Clipboard.setStringAsync(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case 'owner': return 'Propietario';
      case 'admin': return 'Administrador';
      case 'member': return 'Miembro';
      default: return 'Invitado';
    }
  };

  const inviteCode = activeHousehold.id.split('-')[0].toUpperCase();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.backgroundCard, borderBottomColor: colors.separator }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Mi Hogar</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{activeHousehold.name}</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
            Creado el {new Date(activeHousehold.created_at).toLocaleDateString('es-ES')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Invitar a otros</Text>
          <Text style={[styles.inviteDescription, { color: colors.textSecondary }]}>
            Comparte este código con tu familia o compañeros de piso para que puedan unirse a tu despensa.
          </Text>
          
          <TouchableOpacity 
            style={[styles.codeContainer, { backgroundColor: colors.backgroundSecondary, borderColor: colors.primary }]}
            onPress={handleCopyCode}
            activeOpacity={0.7}
          >
            <Text style={[styles.inviteCode, { color: colors.primary }]}>{inviteCode}</Text>
            <View style={[styles.copyBadge, { backgroundColor: copied ? colors.success : colors.primary }]}>
              <Ionicons name={copied ? "checkmark" : "copy-outline"} size={16} color="white" />
              <Text style={styles.copyText}>{copied ? 'Copiado' : 'Copiar'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.backgroundCard }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Miembros ({Object.keys(membersProfiles).length})</Text>
          
          {Object.entries(membersProfiles).map(([userId, profile], index) => (
            <View key={userId} style={[styles.memberRow, index > 0 && { borderTopWidth: 1, borderTopColor: colors.separator }]}>
              <View style={[styles.avatar, { backgroundColor: colors.primarySurface }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
                  {profile.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.memberInfo}>
                <Text style={[styles.memberName, { color: colors.text }]}>{profile.display_name}</Text>
                <Text style={[styles.memberRole, { color: colors.textTertiary }]}>{getRoleLabel(profile.role)}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: { marginRight: 16 },
  title: { fontSize: 24, fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, gap: 16 },
  card: {
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  cardSubtitle: { fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
  inviteDescription: { fontSize: 14, marginBottom: 16, lineHeight: 20 },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  inviteCode: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: 4,
  },
  copyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  copyText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: 'bold' },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 16, fontWeight: '600' },
  memberRole: { fontSize: 13, marginTop: 2 },
});
