import React, { useState } from 'react';
import Button from '../components/Button';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleIcon from '../components/GoogleIcon';
import { supabase } from '../services/supabaseClient';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  
  const from = location.state?.from?.pathname || "/";

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuthAction = (e: React.FormEvent) => {
    e.preventDefault();
    auth.login();
    navigate(from, { replace: true });
  };
  
  const handleGoogleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/#/'} });
    if (error) {
      console.error(error);
      auth.login();
      navigate(from, { replace: true });
    }
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setName('');
    setEmail('');
    setPassword('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-pan-black text-pan-white p-4">
      <div className="w-full max-w-sm mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold tracking-tighter text-pan-white">
              Pan
              <span className="text-pan-gray">.</span>
          </h1>
          <p className="text-pan-gray mt-2">
            {isLoginMode ? 'Welcome back.' : 'Join the community.'}
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center gap-3 py-3 px-4 rounded-xl font-semibold text-center transition-all duration-300 bg-pan-white border border-pan-gray text-pan-black hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-pan-black focus:ring-pan-white"
          >
            <GoogleIcon />
            Sign {isLoginMode ? 'in' : 'up'} with Google
          </button>

          <div className="flex items-center">
            <div className="flex-grow border-t border-pan-gray-dark"></div>
            <span className="flex-shrink mx-4 text-pan-gray text-sm">OR</span>
            <div className="flex-grow border-t border-pan-gray-dark"></div>
          </div>

          <form onSubmit={handleAuthAction} className="space-y-4">
            {!isLoginMode && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-pan-gray-light mb-1">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-pan-gray-dark border border-pan-gray rounded-xl focus:outline-none focus:ring-1 focus:ring-pan-white placeholder-pan-gray"
                  placeholder="John Doe"
                  required
                />
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-pan-gray-light mb-1">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-pan-gray-dark border border-pan-gray rounded-xl focus:outline-none focus:ring-1 focus:ring-pan-white placeholder-pan-gray"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password"className="block text-sm font-medium text-pan-gray-light mb-1">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-pan-gray-dark border border-pan-gray rounded-xl focus:outline-none focus:ring-1 focus:ring-pan-white placeholder-pan-gray"
                placeholder="••••••••"
                required
              />
            </div>
            <div className="pt-2">
              <Button type="submit">
                {isLoginMode ? 'Log In' : 'Create Account'}
              </Button>
            </div>
          </form>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-pan-gray-light">
            {isLoginMode ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button 
              type="button" 
              onClick={toggleMode} 
              className="font-semibold text-pan-white hover:underline focus:outline-none"
            >
              {isLoginMode ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;