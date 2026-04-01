-- Add missing RLS policies for UPDATE and DELETE operations on announcements table

-- Policy: Allow all updates (needed for moderation and admin operations)
CREATE POLICY "Allow all updates on announcements"
    ON public.announcements
    FOR UPDATE
    USING (true)
    WITH CHECK (true);

-- Policy: Allow all deletes (needed for admin operations)
CREATE POLICY "Allow all deletes on announcements"
    ON public.announcements
    FOR DELETE
    USING (true);

-- Note: In production, these policies should be restricted to authenticated admin users only
-- For now, we allow all operations to enable admin functionality
