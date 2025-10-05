import React from 'react';
import { HashRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import HomePage from './pages/HomePage';
import PostDetailPage from './pages/PostDetailPage';
import ProfilePage from './pages/ProfilePage';
import CreatePostPage from './pages/CreatePostPage';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import EditProfilePage from './pages/EditProfilePage';
import EditPostPage from './pages/EditPostPage';
import VerificationPage from './pages/VerificationPage';
import SavedPage from './pages/SavedPage';
import AdminModerationPage from './pages/AdminModerationPage';
import SettingsPage from './pages/SettingsPage';


// Main layout with new monochrome Header and BottomNav
const AppLayout: React.FC = () => {
    return (
        <div className="bg-white dark:bg-pan-black min-h-screen font-sans text-gray-900 dark:text-pan-white transition-colors duration-300">
            <Header />
            <main className="transition-all duration-300 pt-16 pb-24">
                <Outlet /> {/* Child routes will render here */}
            </main>
            <BottomNav />
        </div>
    );
};


const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes with the main layout */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="post/:id" element={<PostDetailPage />} />
          <Route path="post/:id/edit" element={<EditPostPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:userId" element={<ProfilePage />} />
          <Route path="profile/edit" element={<EditProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="create" element={<CreatePostPage />} />
          <Route path="saved" element={<SavedPage />} />
          <Route path="verification" element={<VerificationPage />} />
          <Route path="admin/moderation" element={<AdminModerationPage />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;