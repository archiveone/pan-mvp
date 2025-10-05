import { supabase } from '@/lib/supabase';
import { AuthError } from '@supabase/supabase-js';

export interface AuthResponse {
  success: boolean;
  error?: string;
  data?: any;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  username?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

// Sign up with email and password
export async function signUpWithEmail(data: SignUpData): Promise<AuthResponse> {
  try {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          username: data.username || `user_${Date.now()}`,
        }
      }
    });

    if (error) throw error;

    return {
      success: true,
      data: authData
    };
  } catch (error) {
    console.error('Sign up error:', error);
    return {
      success: false,
      error: error instanceof AuthError ? error.message : 'Failed to create account'
    };
  }
}

// Sign in with email and password
export async function signInWithEmail(data: SignInData): Promise<AuthResponse> {
  try {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password
    });

    if (error) throw error;

    return {
      success: true,
      data: authData
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return {
      success: false,
      error: error instanceof AuthError ? error.message : 'Failed to sign in'
    };
  }
}

// Sign in with Google OAuth
export async function signInWithGoogle(): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Google sign in error:', error);
    return {
      success: false,
      error: error instanceof AuthError ? error.message : 'Failed to sign in with Google'
    };
  }
}

// Sign in with magic link
export async function signInWithMagicLink(email: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Magic link error:', error);
    return {
      success: false,
      error: error instanceof AuthError ? error.message : 'Failed to send magic link'
    };
  }
}

// Reset password
export async function resetPassword(email: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Password reset error:', error);
    return {
      success: false,
      error: error instanceof AuthError ? error.message : 'Failed to send reset email'
    };
  }
}

// Update password
export async function updatePassword(newPassword: string): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Password update error:', error);
    return {
      success: false,
      error: error instanceof AuthError ? error.message : 'Failed to update password'
    };
  }
}

// Sign out
export async function signOut(): Promise<AuthResponse> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return {
      success: true
    };
  } catch (error) {
    console.error('Sign out error:', error);
    return {
      success: false,
      error: error instanceof AuthError ? error.message : 'Failed to sign out'
    };
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error('Get user error:', error);
    return {
      success: false,
      error: error instanceof AuthError ? error.message : 'Failed to get user'
    };
  }
}

// Update user profile
export async function updateUserProfile(updates: {
  full_name?: string;
  username?: string;
  avatar_url?: string;
}): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Profile update error:', error);
    return {
      success: false,
      error: error instanceof AuthError ? error.message : 'Failed to update profile'
    };
  }
}
