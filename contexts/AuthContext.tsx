'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, Profile } from '@/lib/supabase'
import { signOut as authServiceSignOut } from '@/services/authService'

interface AuthContextType {
  user: SupabaseUser | null
  profile: Profile | null
  loading: boolean
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signInWithMagicLink: (email: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (profileData: Partial<Profile>) => Promise<{ error: any }>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.warn('Profile fetch failed (profiles table may not exist yet):', error.message)
        // Set a default profile if fetch fails
        setProfile({
          id: userId,
          name: 'New User',
          bio: 'Welcome to Pan!',
          is_verified: false,
          is_business: false,
          show_stats: true,
          show_followers: true,
          show_posts: true,
          bio_safety_checked: false,
          bio_is_safety_approved: false,
          created_at: new Date().toISOString()
        })
        return
      }

      if (!data) {
        console.warn('No profile found for user, creating default')
        // Create a default profile for the user
        const defaultProfile = {
          id: userId,
          name: 'New User',
          bio: 'Welcome to Pan!',
          is_verified: false,
          is_business: false,
          show_stats: true,
          show_followers: true,
          show_posts: true,
          bio_safety_checked: false,
          bio_is_safety_approved: false,
          created_at: new Date().toISOString()
        }
        
        // Try to insert the profile into the database
        try {
          const { error: insertError } = await supabase
            .from('profiles')
            .insert(defaultProfile)
          
          if (insertError) {
            console.warn('Failed to create profile in database:', insertError.message)
          }
        } catch (error) {
          console.warn('Error creating profile:', error)
        }
        
        setProfile(defaultProfile)
        return
      }

      setProfile(data)
    } catch (error) {
      console.warn('Profile fetch failed (user may not have profile yet):', error)
      // Set a default profile if fetch fails
      setProfile({
        id: userId,
        name: 'New User',
        bio: 'Welcome to Pan!',
        is_verified: false,
        is_business: false,
        show_stats: true,
        show_followers: true,
        show_posts: true,
        bio_safety_checked: false,
        bio_is_safety_approved: false,
        created_at: new Date().toISOString()
      })
    }
  }

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) {
        return { error }
      }

      // Create user profile (optional - don't fail auth if this fails)
      if (data.user) {
        try {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                name: fullName || data.user.user_metadata.full_name || 'New User',
                bio: 'Welcome to Pan!',
                is_verified: false,
                is_business: false,
                show_stats: true,
                show_followers: true,
                show_posts: true,
                bio_safety_checked: false,
                bio_is_safety_approved: false,
              },
            ])

          if (profileError) {
            console.warn('Profile creation failed (this is optional):', profileError.message)
            // Don't throw error - authentication should still succeed
          } else {
            console.log('Profile created successfully')
          }
        } catch (profileErr) {
          console.warn('Profile creation failed (this is optional):', profileErr)
          // Don't throw error - authentication should still succeed
        }
      }

      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signInWithMagicLink = async (email: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })
      return { error }
    } catch (error) {
      return { error }
    }
  }

  const signOut = async () => {
    const result = await authServiceSignOut()
    if (!result.success) {
      console.error('Sign out error:', result.error)
    }
  }

  const updateProfile = async (profileData: Partial<Profile>) => {
    if (!user) {
      return { error: new Error('No user logged in') }
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...profileData,
          updated_at: new Date().toISOString()
        })

      if (error) {
        return { error }
      }

      // Refresh profile data
      await fetchProfile(user.id)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    updateProfile,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}