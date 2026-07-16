-- Permitir a los creadores leer la casa que acaban de crear 
-- para que el '.select()' no falle antes de añadirles como miembros.

CREATE POLICY "Creadores pueden ver sus hogares" 
ON public.households 
FOR SELECT 
USING (auth.uid() = created_by);
