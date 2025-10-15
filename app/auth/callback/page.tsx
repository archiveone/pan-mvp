'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔍 Auth callback triggered');
        console.log('Current URL:', window.location.href);
        
        // For implicit flow, check hash for access_token
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        
        if (accessToken) {
          console.log('✅ Found access token in hash (implicit flow)');
          // Let Supabase handle the session from hash automatically
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('❌ Session error:', error);
            setStatus('error');
            setMessage('Authentication failed. Please try again.');
            setTimeout(() => router.push('/login'), 3000);
            return;
          }

          if (data.session) {
            console.log('✅ Session created from implicit flow!');
            setStatus('success');
            setMessage('Successfully signed in! Redirecting...');
            setTimeout(() => router.push('/'), 2000);
            return;
          }
        }
        
        // Fallback: check existing session
        const { data, error } = await supabase.auth.getSession();
        
        console.log('📊 Session check:', { data, error });
        
        if (error) {
          console.error('❌ Session error:', error);
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        if (data.session) {
          console.log('✅ Session found!');
          setStatus('success');
          setMessage('Successfully signed in! Redirecting...');
          setTimeout(() => router.push('/'), 2000);
        } else {
          console.warn('⚠️ No session found');
          setStatus('error');
          setMessage('No session found. Please try signing in again.');
          setTimeout(() => router.push('/login'), 3000);
        }
      } catch (error) {
        console.error('💥 Auth callback error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authenticating...</h1>
            <p className="text-gray-600">Please wait while we sign you in</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Authentication Failed</h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
