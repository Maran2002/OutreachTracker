'use client';

import React, { createContext, useContext, useState } from 'react';

const AdminContext = createContext(null);

export default function AdminProvider({ admin: initialAdmin, children }) {
  const [admin, setAdmin] = useState(initialAdmin);

  return (
    <AdminContext.Provider value={{ admin, setAdmin }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context?.admin ?? context;
}

export function useAdminActions() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdminActions must be used within an AdminProvider');
  }
  return context?.setAdmin ?? null;
}
