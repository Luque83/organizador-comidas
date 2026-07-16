CREATE POLICY "Creadores de hogar pueden añadirse a sí mismos" 
ON public.household_members 
FOR INSERT 
WITH CHECK (
    auth.uid() = user_id 
    AND EXISTS (
        SELECT 1 FROM public.households 
        WHERE id = household_id 
        AND created_by = auth.uid()
    )
);
