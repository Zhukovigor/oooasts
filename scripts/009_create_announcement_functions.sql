-- Function to increment announcement views
CREATE OR REPLACE FUNCTION increment_announcement_views(announcement_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.announcements
    SET views_count = views_count + 1
    WHERE id = announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
