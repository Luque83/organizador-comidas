import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/components/ui/useThemeColors';
import { useHouseholdStore } from '@/store/useHouseholdStore';
import { supabase } from '@/lib/supabase';

export default function HouseholdsScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { createHousehold, joinHousehold } = useHouseholdStore();
  
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/auth/login');
  };

  const handleCreate = async () => {
    setErrorMessage('');
    if (!householdName.trim()) {
      setErrorMessage('El nombre no puede estar vacío');
      return;
    }
    setLoading(true);
    try {
      await createHousehold(householdName.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error('Error al crear hogar:', e);
      setErrorMessage(e.message || 'No se pudo crear el hogar');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setErrorMessage('');
    if (!inviteCode.trim()) {
      setErrorMessage('El código no puede estar vacío');
      return;
    }
    setLoading(true);
    try {
      await joinHousehold(inviteCode.trim().toUpperCase());
      router.replace('/(tabs)');
    } catch (e: any) {
      console.error('Error al unirse:', e);
      setErrorMessage(e.message || 'No se pudo unir al hogar. Comprueba que el código es válido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.header}>
          <Ionicons name="home" size={48} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Tus Hogares</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Parece que no perteneces a ningún hogar todavía. Crea uno nuevo o únete al de tu familia/compañeros usando un código.
          </Text>
        </View>

        {errorMessage ? (
          <View style={[styles.errorBox, { backgroundColor: colors.error + '20', borderColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.error }]}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.cardsContainer}>
          {/* Card para Crear */}
          <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.cardHeader} 
              onPress={() => { setIsCreating(true); setIsJoining(false); }}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primarySurface }]}>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Crear un nuevo Hogar</Text>
              <Ionicons name={isCreating ? "chevron-down" : "chevron-forward"} size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            
            {isCreating && (
              <View style={styles.cardContent}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Nombre del hogar</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Ej: Casa de Ana y Juan"
                  placeholderTextColor={colors.textTertiary}
                  value={householdName}
                  onChangeText={setHouseholdName}
                  autoFocus
                />
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: colors.primary }]}
                  onPress={handleCreate}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Card para Unirse */}
          <View style={[styles.card, { backgroundColor: colors.backgroundCard, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.cardHeader} 
              onPress={() => { setIsJoining(true); setIsCreating(false); }}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.secondarySurface }]}>
                <Ionicons name="people" size={24} color={colors.secondary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Unirse con un código</Text>
              <Ionicons name={isJoining ? "chevron-down" : "chevron-forward"} size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            
            {isJoining && (
              <View style={styles.cardContent}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Código de invitación</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, textTransform: 'uppercase' }]}
                  placeholder="Ej: ABC-123-XYZ"
                  placeholderTextColor={colors.textTertiary}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  autoFocus
                />
                <TouchableOpacity 
                  style={[styles.button, { backgroundColor: colors.secondary }]}
                  onPress={handleJoin}
                  disabled={loading}
                >
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Unirse</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    padding: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
    paddingTop: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
