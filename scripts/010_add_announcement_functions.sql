-- Function to increment announcement views
CREATE OR REPLACE FUNCTION increment_announcement_views(announcement_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.announcements
  SET views_count = views_count + 1
  WHERE id = announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment contact clicks
CREATE OR REPLACE FUNCTION increment_announcement_contact_clicks(announcement_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.announcements
  SET contact_clicks = contact_clicks + 1
  WHERE id = announcement_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically deactivate expired announcements
CREATE OR REPLACE FUNCTION deactivate_expired_announcements()
RETURNS void AS $$
BEGIN
  UPDATE public.announcements
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run the deactivation function daily
-- Note: This requires pg_cron extension which may need to be enabled
-- Alternatively, you can run this manually or via a cron job
