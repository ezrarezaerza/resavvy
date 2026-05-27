import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthScreen } from './AuthScreen';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, showLoginModal, setShowLoginModal } = useAuth();

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-950">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <>
      {children}
      {showLoginModal && <AuthScreen onClose={() => setShowLoginModal(false)} />}
    </>
  );
}
