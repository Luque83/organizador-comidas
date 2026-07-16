-- =========================================================================================
-- MIGRACIÓN 001: Arquitectura Base y Hogares (Supabase PostgreSQL)
-- =========================================================================================

-- ============================================================
-- 1. EXTENSIONES Y FUNCIONES BASE
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Función para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 2. TABLAS DE USUARIOS Y HOGARES
-- ============================================================

-- Tabla de Perfiles Públicos (Vinculada a auth.users)
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_sign_in_at TIMESTAMPTZ
);

-- Hogares (Households)
CREATE TABLE public.households (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    default_members_count INTEGER DEFAULT 2,
    currency TEXT DEFAULT 'EUR',
    timezone TEXT DEFAULT 'Europe/Madrid',
    language TEXT DEFAULT 'es'
);

CREATE TRIGGER update_households_updated_at
BEFORE UPDATE ON public.households
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Miembros del Hogar
CREATE TABLE public.household_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('invited', 'active', 'suspended')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    UNIQUE(household_id, user_id)
);

-- Invitaciones
CREATE TABLE public.household_invitations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    invited_email TEXT,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    invitation_code TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

-- ============================================================
-- 3. TABLAS DE DOMINIO (DATOS COMPARTIDOS)
-- ============================================================
-- Todas las tablas heredan la estructura anterior pero añaden:
-- household_id, created_by, updated_by

-- Catálogo de Ingredientes
CREATE TABLE public.ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    category TEXT NOT NULL,
    default_unit TEXT NOT NULL DEFAULT 'g',
    image_uri TEXT,
    calories NUMERIC,
    protein NUMERIC,
    carbs NUMERIC,
    fat NUMERIC,
    is_basic BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recetas
CREATE TABLE public.recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    image_uri TEXT,
    category TEXT NOT NULL,
    meal_type TEXT NOT NULL DEFAULT 'almuerzo',
    prep_time INTEGER NOT NULL DEFAULT 15,
    cook_time INTEGER NOT NULL DEFAULT 30,
    difficulty TEXT NOT NULL DEFAULT 'facil',
    servings INTEGER NOT NULL DEFAULT 2,
    tags JSONB DEFAULT '[]'::jsonb,
    nutrition_notes TEXT,
    notes TEXT,
    is_favorite BOOLEAN DEFAULT false,
    diet_tags JSONB DEFAULT '[]'::jsonb,
    allergens JSONB DEFAULT '[]'::jsonb,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ingredientes de Recetas
CREATE TABLE public.recipe_ingredients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    optional BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Pasos de Recetas
CREATE TABLE public.recipe_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    duration_minutes INTEGER,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Planes de menú semanal
CREATE TABLE public.meal_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    notes TEXT,
    budget NUMERIC,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(household_id, week_start)
);

-- Comidas Planificadas
CREATE TABLE public.planned_meals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    meal_plan_id UUID NOT NULL REFERENCES public.meal_plans(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    meal_type TEXT NOT NULL,
    custom_meal_type_name TEXT,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
    custom_description TEXT,
    servings INTEGER NOT NULL DEFAULT 2,
    is_prepared BOOLEAN DEFAULT false,
    has_leftovers BOOLEAN DEFAULT false,
    leftover_servings NUMERIC,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Almacén (Despensa)
CREATE TABLE public.pantry_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
    custom_name TEXT,
    quantity NUMERIC NOT NULL DEFAULT 0,
    unit TEXT NOT NULL,
    min_quantity NUMERIC,
    location TEXT NOT NULL DEFAULT 'despensa',
    purchase_date DATE,
    expiry_date DATE,
    brand TEXT,
    price NUMERIC,
    notes TEXT,
    is_open BOOLEAN DEFAULT false,
    opened_date DATE,
    batch_id TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Listas de Compra
CREATE TABLE public.shopping_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    week_start DATE,
    is_active BOOLEAN DEFAULT true,
    total_estimated NUMERIC,
    total_actual NUMERIC,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ítems de la Lista de Compra
CREATE TABLE public.shopping_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    shopping_list_id UUID NOT NULL REFERENCES public.shopping_lists(id) ON DELETE CASCADE,
    ingredient_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    needed_quantity NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'otros',
    source_recipes JSONB DEFAULT '[]'::jsonb,
    is_auto_generated BOOLEAN DEFAULT false,
    is_bought BOOLEAN DEFAULT false,
    bought_quantity NUMERIC,
    price NUMERIC,
    store TEXT,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sobras (Leftovers)
CREATE TABLE public.leftovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    planned_meal_id UUID NOT NULL REFERENCES public.planned_meals(id) ON DELETE CASCADE,
    recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    servings NUMERIC NOT NULL,
    date DATE NOT NULL,
    is_consumed BOOLEAN DEFAULT false,
    consumed_date DATE,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers para updated_at en las tablas de dominio
CREATE TRIGGER update_ingredients_updated_at BEFORE UPDATE ON public.ingredients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_recipes_updated_at BEFORE UPDATE ON public.recipes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meal_plans_updated_at BEFORE UPDATE ON public.meal_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_planned_meals_updated_at BEFORE UPDATE ON public.planned_meals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pantry_items_updated_at BEFORE UPDATE ON public.pantry_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_lists_updated_at BEFORE UPDATE ON public.shopping_lists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON public.shopping_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leftovers_updated_at BEFORE UPDATE ON public.leftovers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. POLÍTICAS RLS (ROW LEVEL SECURITY)
-- ============================================================

-- Activar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.households ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planned_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leftovers ENABLE ROW LEVEL SECURITY;

-- Funciones de ayuda para RLS
CREATE OR REPLACE FUNCTION public.is_household_member(check_household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.household_members 
        WHERE household_id = check_household_id 
        AND user_id = auth.uid() 
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.has_household_write_access(check_household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.household_members 
        WHERE household_id = check_household_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin', 'member')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas de Perfiles
CREATE POLICY "Usuarios pueden leer todos los perfiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Políticas de Hogares
CREATE POLICY "Miembros pueden ver sus hogares" ON public.households FOR SELECT USING (is_household_member(id));
CREATE POLICY "Usuarios pueden crear hogares" ON public.households FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Admins y Owners pueden actualizar el hogar" ON public.households FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.household_members WHERE household_id = id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Políticas de Miembros
CREATE POLICY "Miembros pueden ver otros miembros" ON public.household_members FOR SELECT USING (is_household_member(household_id));
CREATE POLICY "Solo Admins y Owners pueden gestionar miembros" ON public.household_members FOR ALL USING (
    EXISTS (SELECT 1 FROM public.household_members WHERE household_id = household_members.household_id AND user_id = auth.uid() AND role IN ('owner', 'admin'))
);

-- Políticas Generales para Datos de Dominio (Todas las tablas con household_id)
-- Aplicaremos la misma lógica de lectura y escritura a las tablas de dominio

-- Plantilla dinámica para políticas:
DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'ingredients', 'recipes', 'recipe_ingredients', 'recipe_steps', 
        'meal_plans', 'planned_meals', 'pantry_items', 'shopping_lists', 
        'shopping_items', 'leftovers', 'household_invitations'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('CREATE POLICY "Miembros pueden leer %I" ON public.%I FOR SELECT USING (public.is_household_member(household_id))', t, t);
        EXECUTE format('CREATE POLICY "Miembros (no viewers) pueden insertar %I" ON public.%I FOR INSERT WITH CHECK (public.has_household_write_access(household_id))', t, t);
        EXECUTE format('CREATE POLICY "Miembros (no viewers) pueden actualizar %I" ON public.%I FOR UPDATE USING (public.has_household_write_access(household_id))', t, t);
        EXECUTE format('CREATE POLICY "Miembros (no viewers) pueden borrar %I" ON public.%I FOR DELETE USING (public.has_household_write_access(household_id))', t, t);
    END LOOP;
END;
$$;

-- ============================================================
-- 5. FUNCIONES TRANSACCIONALES (RPC)
-- ============================================================

-- RPC para unirse a un hogar usando un código de invitación
CREATE OR REPLACE FUNCTION public.join_household(invite_code TEXT)
RETURNS UUID AS $$
DECLARE
    target_invite RECORD;
BEGIN
    -- Buscar la invitación válida
    SELECT * INTO target_invite FROM public.household_invitations 
    WHERE invitation_code = invite_code 
      AND status = 'pending' 
      AND expires_at > NOW();

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Código de invitación inválido o caducado.';
    END IF;

    -- Verificar si ya es miembro
    IF EXISTS (SELECT 1 FROM public.household_members WHERE household_id = target_invite.household_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'Ya eres miembro de este hogar.';
    END IF;

    -- Añadir como miembro
    INSERT INTO public.household_members (household_id, user_id, role, status)
    VALUES (target_invite.household_id, auth.uid(), 'member', 'active');

    -- Marcar invitación como aceptada
    UPDATE public.household_invitations 
    SET status = 'accepted', accepted_at = NOW() 
    WHERE id = target_invite.id;

    RETURN target_invite.household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- RPC Atómico para descontar/ajustar inventario
CREATE OR REPLACE FUNCTION public.adjust_pantry_quantity(item_id UUID, amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    current_quantity NUMERIC;
    new_quantity NUMERIC;
BEGIN
    -- Bloquear la fila para actualización concurrente
    SELECT quantity INTO current_quantity 
    FROM public.pantry_items 
    WHERE id = item_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Ítem no encontrado';
    END IF;

    new_quantity := current_quantity + amount;

    IF new_quantity < 0 THEN
        new_quantity := 0;
    END IF;

    UPDATE public.pantry_items 
    SET quantity = new_quantity, updated_by = auth.uid() 
    WHERE id = item_id;

    RETURN new_quantity;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. PUBLICACIONES DE SUPABASE REALTIME
-- ============================================================

-- Activar Realtime solo para tablas que requieran UI reactiva rápida
ALTER PUBLICATION supabase_realtime ADD TABLE public.pantry_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.meal_plans;
ALTER PUBLICATION supabase_realtime ADD TABLE public.planned_meals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_lists;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shopping_items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.recipes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leftovers;
