import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('rb_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  function signIn(userData) {
    setUser(userData);
    localStorage.setItem('rb_user', JSON.stringify(userData));
  }

  function signOut() {
    setUser(null);
    localStorage.removeItem('rb_user');
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
