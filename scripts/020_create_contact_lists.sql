CREATE TABLE IF NOT EXISTS contact_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contact_list_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES contact_lists(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(list_id, email)
);

CREATE INDEX IF NOT EXISTS idx_contact_list_contacts_list_id ON contact_list_contacts(list_id);
CREATE INDEX IF NOT EXISTS idx_contact_list_contacts_email ON contact_list_contacts(email);

ALTER TABLE contact_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_list_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on contact_lists" ON contact_lists FOR ALL USING (true);
CREATE POLICY "Allow all operations on contact_list_contacts" ON contact_list_contacts FOR ALL USING (true);
