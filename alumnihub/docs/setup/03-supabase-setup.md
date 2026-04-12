# Supabase Setup

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Choose your organization, name it `alumnihub`, set a database password
4. Select the region closest to your users (e.g., Singapore for Philippines)
5. Wait for the project to finish provisioning

## 2. Get Your API Keys

1. Go to **Settings > API** in your Supabase dashboard
2. Copy these values into your `.env` file:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon/public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Run Database Migrations

Go to **SQL Editor** in your Supabase dashboard and run these scripts in order:

1. `scripts/001_create_tables.sql` — Creates all tables, indexes, and triggers
2. `scripts/003_rls_policies.sql` — Sets up Row-Level Security policies
3. `scripts/002_seed_data.sql` — (Optional) Reference for creating test data

## 4. Create Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Click **New Bucket**
3. Name it `cv-uploads`
4. Set it to **Public** (so CV files can be accessed via URL)
5. Add a storage policy to allow authenticated users to upload:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload CVs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'cv-uploads'
    AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Allow anyone to read (for profile views by faculty)
CREATE POLICY "Public CV access"
ON storage.objects FOR SELECT
USING (bucket_id = 'cv-uploads');
```

## 5. Configure Authentication

1. Go to **Authentication > Providers**
2. Ensure **Email** provider is enabled
3. Optional: Disable email confirmation for development:
   - Go to **Authentication > Settings**
   - Turn off **Enable email confirmations**

## 6. Enable Realtime (for messaging)

1. Go to **Database > Replication**
2. Enable realtime for the `messages` table
3. This allows the inbox to update in real-time when new messages arrive

## Supabase Free Tier Limits

- 500 MB database storage
- 1 GB file storage
- 50,000 monthly active users
- 2 GB bandwidth

These limits are more than sufficient for capstone development and testing.
