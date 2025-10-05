# Pan Marketplace Setup Guide

## 1. Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for your project to be ready
3. Go to Settings > API to get your project URL and anon key

## 2. Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Replace the values with your actual Supabase project URL and anon key.

## 3. Database Setup

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database-setup.sql`
4. Run the SQL script to create tables and set up Row Level Security

## 4. Install Dependencies

```bash
npm install
```

## 5. Run the Development Server

```bash
npm run dev
```

## 6. Test the Application

1. Open http://localhost:3000
2. Try signing up for a new account
3. Check if listings load from the database
4. Test the authentication flow

## Features Implemented

- ✅ User authentication (sign up, sign in, sign out)
- ✅ Real-time database connection with Supabase
- ✅ Listings CRUD operations
- ✅ Row Level Security for data protection
- ✅ Responsive design
- ✅ Search and filter functionality
- ✅ User profile management

## Next Steps

- Add image upload functionality
- Implement the "Add Listing" feature
- Add user profiles page
- Add messaging between users
- Add payment integration
- Add location-based search

## Troubleshooting

If you encounter issues:

1. Check your environment variables are correct
2. Ensure your Supabase project is active
3. Verify the database tables were created successfully
4. Check the browser console for any errors
