'use client';

import React, { createContext, useContext, useState } from 'react';

const UserContext = createContext(null);

export default function UserProvider({ user: initialUser, children }) {
  const [user, setUser] = useState(initialUser);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context?.user ?? context;
}

export function useUserActions() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserActions must be used within a UserProvider');
  }
  return context?.setUser ?? null;
}
