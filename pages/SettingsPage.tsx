import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, LogOut, User, Bell, ShieldCheck, ShieldAlert, Moon, Sun } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/Button';
import { useTheme } from '../contexts/ThemeContext';
import ToggleSwitch from '../components/ToggleSwitch';

const SettingsPage: React.FC = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  const VerificationStatus = () => {
      if (currentUser?.verificationStatus === 'verified') {
          return <span className="flex items-center gap-1 text-xs text-green-500 dark:text-green-400"><ShieldCheck size={14} /> Verified</span>;
      }
      if (currentUser?.verificationStatus === 'pending') {
          return <span className="flex items-center gap-1 text-xs text-yellow-500 dark:text-yellow-400"><ShieldAlert size={14} /> Pending</span>;
      }
      return <span className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400"><ShieldAlert size={14} /> Unverified</span>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center mb-8">
        <Link to="/profile" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-pan-gray-dark mr-2">
          <ArrowLeft size={24} />
        </Link>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>
      
      <div className="space-y-6">
        <div className="bg-gray-100 dark:bg-pan-gray-dark p-4 rounded-xl">
          <h2 className="font-bold text-lg mb-2 px-2 text-gray-900 dark:text-pan-white">Account</h2>
          <Link to="/profile/edit" className="flex items-center justify-between py-3 rounded-lg px-2 hover:bg-gray-200 dark:hover:bg-black/20 transition-colors">
             <div className="flex items-center gap-3">
                <img src={currentUser?.avatarUrl} alt={currentUser?.name} className="w-12 h-12 rounded-full" />
                <div>
                    <p className="font-semibold text-gray-900 dark:text-pan-white">{currentUser?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-pan-gray-light">Edit Profile</p>
                </div>
            </div>
            <ChevronRight size={20} className="text-gray-500 dark:text-pan-gray-light" />
          </Link>
          <Link to="/verification" className="flex items-center justify-between py-3 rounded-lg px-2 hover:bg-gray-200 dark:hover:bg-black/20 transition-colors mt-1">
             <div className="flex items-center gap-3">
                 <div className="w-12 h-12 flex items-center justify-center">
                    {currentUser?.verificationStatus === 'verified' ? <ShieldCheck size={24} className="text-green-500 dark:text-green-400"/> : <ShieldAlert size={24} className="text-yellow-500 dark:text-yellow-400"/>}
                 </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-pan-white">Identity Verification</p>
                    <VerificationStatus />
                </div>
            </div>
            <ChevronRight size={20} className="text-gray-500 dark:text-pan-gray-light" />
          </Link>
        </div>

        <div className="bg-gray-100 dark:bg-pan-gray-dark p-4 rounded-xl">
          <h2 className="font-bold text-lg mb-2 px-2 text-gray-900 dark:text-pan-white">Appearance</h2>
           <div className="flex items-center justify-between py-3 rounded-lg px-2">
             <div className="flex items-center gap-3">
                 <div className="w-12 h-12 flex items-center justify-center">
                    {theme === 'dark' ? <Moon size={24} className="text-pan-gray-light"/> : <Sun size={24} className="text-gray-600"/>}
                 </div>
                <div>
                    <p className="font-semibold text-gray-900 dark:text-pan-white">Dark Mode</p>
                    <p className="text-sm text-gray-500 dark:text-pan-gray-light">Toggle between light and dark themes.</p>
                </div>
            </div>
            <ToggleSwitch id="dark-mode-toggle" checked={theme === 'dark'} onChange={toggleTheme} />
          </div>
        </div>

        <div className="bg-gray-100 dark:bg-pan-gray-dark p-4 rounded-xl">
          <h2 className="font-bold text-lg mb-2 px-2 text-gray-900 dark:text-pan-white">Preferences</h2>
          <div className="space-y-1">
            <button className="w-full flex items-center justify-between py-3 rounded-lg px-2 hover:bg-gray-200 dark:hover:bg-black/20 transition-colors text-left">
                <div className="flex items-center gap-3">
                    <Bell size={20} className="text-gray-500 dark:text-pan-gray-light" />
                    <span className="font-medium text-gray-900 dark:text-pan-white">Notifications</span>
                </div>
                <ChevronRight size={20} className="text-gray-500 dark:text-pan-gray-light" />
            </button>
          </div>
        </div>

        <div className="pt-4">
            <Button onClick={handleLogout} variant="outline">
                <div className="flex items-center justify-center gap-2">
                    <LogOut size={18} />
                    <span>Log Out</span>
                </div>
            </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;