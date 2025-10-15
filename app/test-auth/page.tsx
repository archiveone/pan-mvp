'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { signInWithGoogle } from '@/services/authService';

export default function TestAuthPage() {
  const [result, setResult] = useState<any>(null);
  const [session, setSession] = useState<any>(null);

  const testGoogleDirect = async () => {
    console.log('🧪 Testing Google OAuth directly...');
    setResult({ status: 'loading', message: 'Testing Google OAuth...' });

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      console.log('📊 OAuth Response:', { data, error });
      setResult({
        status: error ? 'error' : 'success',
        data,
        error: error?.message || null
      });
    } catch (err: any) {
      console.error('❌ OAuth Error:', err);
      setResult({
        status: 'error',
        error: err.message || 'Unknown error'
      });
    }
  };

  const testGoogleService = async () => {
    console.log('🧪 Testing via authService...');
    setResult({ status: 'loading', message: 'Testing via authService...' });

    const result = await signInWithGoogle();
    console.log('📊 Service Response:', result);
    setResult({
      status: result.success ? 'success' : 'error',
      data: result.data,
      error: result.error || null
    });
  };

  const checkSession = async () => {
    console.log('🔍 Checking current session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('📊 Session:', { session, error });
    setSession({ session, error: error?.message });
  };

  const testConfig = () => {
    const config = {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      currentUrl: window.location.origin,
      callbackUrl: `${window.location.origin}/auth/callback`
    };
    console.log('⚙️ Configuration:', config);
    setResult({ status: 'info', config });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Google Auth Debugger</h1>
        <p className="text-gray-600 mb-8">Test your Google OAuth setup</p>

        {/* Config Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <div className="space-y-2 text-sm">
            <div className="flex gap-2">
              <span className="font-medium w-40">Supabase URL:</span>
              <span className="text-gray-600 font-mono text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_URL}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium w-40">Current Origin:</span>
              <span className="text-gray-600 font-mono text-xs">
                {typeof window !== 'undefined' ? window.location.origin : 'Loading...'}
              </span>
            </div>
            <div className="flex gap-2">
              <span className="font-medium w-40">Callback URL:</span>
              <span className="text-green-600 font-mono text-xs">
                {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'Loading...'}
              </span>
            </div>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Tests</h2>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={testGoogleDirect}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Test Direct OAuth
            </button>
            <button
              onClick={testGoogleService}
              className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            >
              Test via Service
            </button>
            <button
              onClick={checkSession}
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              Check Session
            </button>
            <button
              onClick={testConfig}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Show Config
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Result</h2>
            <div className={`p-4 rounded-lg ${
              result.status === 'error' ? 'bg-red-50 border border-red-200' :
              result.status === 'success' ? 'bg-green-50 border border-green-200' :
              result.status === 'loading' ? 'bg-blue-50 border border-blue-200' :
              'bg-gray-50 border border-gray-200'
            }`}>
              <div className="font-mono text-sm whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </div>
            </div>
          </div>
        )}

        {/* Session Info */}
        {session && (
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Current Session</h2>
            <div className={`p-4 rounded-lg ${
              session.session ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <div className="font-mono text-sm whitespace-pre-wrap">
                {JSON.stringify(session, null, 2)}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>Open browser DevTools (F12) → Console tab</li>
            <li>Click "Test Direct OAuth" button</li>
            <li>Check console for detailed logs</li>
            <li>If redirect happens, you should go to Google</li>
            <li>After signing in, check the callback URL</li>
          </ol>
        </div>

        {/* Quick Fixes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mt-6">
          <h3 className="font-semibold mb-2">⚠️ Common Issues:</h3>
          <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
            <li>Redirect URL not whitelisted in Supabase</li>
            <li>Google Console redirect URI doesn't match</li>
            <li>Cached old redirect URL (try incognito mode)</li>
            <li>Google OAuth not enabled in Supabase</li>
          </ul>
          <div className="mt-4 p-3 bg-white rounded border border-yellow-300">
            <p className="text-xs font-semibold mb-1">Expected callback URL:</p>
            <code className="text-xs text-green-600">
              {typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : 'Loading...'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

