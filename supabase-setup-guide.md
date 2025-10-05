# Supabase Database Setup - Quick Fix

## Step 1: Create Database Tables

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor** (in the left sidebar)
4. Click **New Query**
5. Copy and paste this simplified SQL script:

```sql
-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create listings table
CREATE TABLE IF NOT EXISTS listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price TEXT NOT NULL,
  location TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_sold BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Listings policies
CREATE POLICY "Anyone can view active listings" ON listings
  FOR SELECT USING (is_sold = false);

CREATE POLICY "Users can view their own listings" ON listings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create listings" ON listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" ON listings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings" ON listings
  FOR DELETE USING (auth.uid() = user_id);
```

6. Click **Run** to execute the script

## Step 2: Add Sample Data (Optional)

After creating the tables, run this to add some sample listings:

```sql
-- Insert sample user (this will be replaced when you sign up)
INSERT INTO users (id, email, full_name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'demo@example.com', 'Demo User')
ON CONFLICT (id) DO NOTHING;

-- Insert sample listings
INSERT INTO listings (title, description, price, location, category, user_id) VALUES 
  ('Vintage Camera', 'Beautiful vintage camera in excellent condition', '€120', 'Dublin', 'Electronics', '00000000-0000-0000-0000-000000000001'),
  ('Acoustic Guitar', 'Great for beginners, comes with case', '€250', 'Cork', 'Music', '00000000-0000-0000-0000-000000000001'),
  ('Mountain Bike', 'Perfect for city riding and light trails', '€180', 'Galway', 'Sports', '00000000-0000-0000-0000-000000000001'),
  ('Book Collection', 'Various fiction and non-fiction books', '€15', 'Dublin', 'Books', '00000000-0000-0000-0000-000000000001'),
  ('Wooden Table', 'Solid oak dining table, seats 6', '€300', 'Limerick', 'Home', '00000000-0000-0000-0000-000000000001'),
  ('Abstract Painting', 'Original artwork by local artist', '€85', 'Dublin', 'Art', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;
```

## Step 3: Test the Connection

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000
3. You should now see the sample listings
4. Try signing up for a new account

## Troubleshooting

If you still get errors:

1. **Check Authentication Settings:**
   - Go to Authentication > Settings in Supabase
   - Make sure "Enable email confirmations" is turned OFF for testing
   - Set "Site URL" to `http://localhost:3000`

2. **Check API Settings:**
   - Go to Settings > API
   - Verify your URL and anon key match your `.env.local` file

3. **Check Database Tables:**
   - Go to Table Editor in Supabase
   - You should see `users` and `listings` tables
   - The `listings` table should have sample data

Let me know if you need help with any of these steps!

