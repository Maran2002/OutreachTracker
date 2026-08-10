'use client';

import React, { createContext, useContext } from 'react';

const AdminContext = createContext(null);

export default function AdminProvider({ admin, children }) {
  return (
    <AdminContext.Provider value={admin}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
