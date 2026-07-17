import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export type Household = {
  id: string;
  name: string;
  created_at: string;
};

export type HouseholdMember = {
  id: string;
  household_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'active' | 'pending';
};

interface HouseholdState {
  activeHousehold: Household | null;
  households: Household[];
  role: 'owner' | 'admin' | 'member' | 'viewer' | null;
  isLoading: boolean;
  membersProfiles: Record<string, { display_name: string; role: string }>;
  loadHouseholds: () => Promise<void>;
  setActiveHousehold: (householdId: string) => Promise<void>;
  createHousehold: (name: string) => Promise<void>;
  joinHousehold: (inviteCode: string) => Promise<void>;
  loadHouseholdProfiles: () => Promise<void>;
}

export const useHouseholdStore = create<HouseholdState>((set, get) => ({
  activeHousehold: null,
  households: [],
  role: null,
  isLoading: true,
  membersProfiles: {},

  loadHouseholds: async () => {
    set({ isLoading: true });
    
    // Obtener las casas a las que pertenece el usuario
    const { data: members, error: membersError } = await supabase
      .from('household_members')
      .select('household_id, role, households(id, name, created_at)')
      .eq('status', 'active');

    if (membersError) {
      console.error('Error cargando hogares:', membersError);
      set({ isLoading: false });
      return;
    }

    if (!members || members.length === 0) {
      set({ households: [], activeHousehold: null, role: null, isLoading: false });
      return;
    }

    const loadedHouseholds = members.map((m: any) => m.households);
    
    // Si ya había una casa activa, intentamos mantenerla
    const currentActiveId = get().activeHousehold?.id;
    let newActive = loadedHouseholds.find((h: any) => h.id === currentActiveId);
    let newRole = null;

    if (!newActive) {
      // Si no hay ninguna o fue borrada, seleccionamos la primera
      newActive = loadedHouseholds[0];
    }

    if (newActive) {
      const memberInfo = members.find(m => m.household_id === newActive.id);
      newRole = memberInfo?.role || 'member';
    }

    set({ 
      households: loadedHouseholds, 
      activeHousehold: newActive || null, 
      role: newRole,
      isLoading: false 
    });

    if (newActive) {
      get().loadHouseholdProfiles();
    }
  },

  setActiveHousehold: async (householdId: string) => {
    const { households } = get();
    const target = households.find(h => h.id === householdId);
    if (!target) return;

    // Buscar el rol
    const { data: member } = await supabase
      .from('household_members')
      .select('role')
      .eq('household_id', householdId)
      .single();

    set({ activeHousehold: target, role: member?.role || 'member' });
    get().loadHouseholdProfiles();
  },

  loadHouseholdProfiles: async () => {
    const activeId = get().activeHousehold?.id;
    if (!activeId) return;

    const { data, error } = await supabase
      .from('household_members')
      .select(`
        user_id,
        role,
        profiles ( display_name )
      `)
      .eq('household_id', activeId)
      .eq('status', 'active');

    if (!error && data) {
      const profilesMap: Record<string, { display_name: string; role: string }> = {};
      for (const member of data) {
        profilesMap[member.user_id] = {
          display_name: (member.profiles as any)?.display_name || 'Usuario',
          role: member.role
        };
      }
      set({ membersProfiles: profilesMap });
    }
  },

  createHousehold: async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No estás autenticado');

    // 1. Crear el hogar
    const { data: newHousehold, error: hError } = await supabase
      .from('households')
      .insert([{ name, created_by: user.id }])
      .select()
      .single();

    if (hError) throw hError;

    // 2. Añadirse a sí mismo como owner (en realidad ya se puede hacer con un trigger, pero lo forzamos por si acaso)
    const { error: mError } = await supabase
      .from('household_members')
      .insert([{ household_id: newHousehold.id, user_id: user.id, role: 'owner', status: 'active' }]);
    
    if (mError) throw mError;

    // Recargar hogares y seleccionar el nuevo
    await get().loadHouseholds();
    await get().setActiveHousehold(newHousehold.id);
  },

  joinHousehold: async (inviteCode: string) => {
    // Llamar a la función RPC
    const { data: householdId, error } = await supabase.rpc('join_household', { invite_code: inviteCode });
    if (error) throw error;

    // Recargar y seleccionar
    await get().loadHouseholds();
    if (householdId) {
      await get().setActiveHousehold(householdId);
    }
  }
}));
