-- Arreglar recursión infinita en las políticas de household_members

-- 1. Borramos la política problemática que aplica a TODO (incluyendo SELECT, lo que causaba el bucle)
DROP POLICY IF EXISTS "Solo Admins y Owners pueden gestionar miembros" ON public.household_members;

-- 2. Creamos una función segura (SECURITY DEFINER ignora las políticas y evita bucles) para comprobar si es admin
CREATE OR REPLACE FUNCTION public.is_household_admin(check_household_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.household_members 
        WHERE household_id = check_household_id 
        AND user_id = auth.uid() 
        AND status = 'active'
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Creamos políticas separadas solo para modificar (dejando la de SELECT intacta)
CREATE POLICY "Admins pueden actualizar miembros" 
ON public.household_members FOR UPDATE 
USING (public.is_household_admin(household_id));

CREATE POLICY "Admins pueden borrar miembros" 
ON public.household_members FOR DELETE 
USING (public.is_household_admin(household_id));

-- Nota: El INSERT de nuevos miembros ya está cubierto para el creador por "003_rls_fix", 
-- y para las invitaciones se usa la función RPC "join_household" que ignora RLS.
