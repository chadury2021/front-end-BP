import React, { createContext, useContext, useState, useMemo } from 'react';

const KeyManagementModalContext = createContext();

export function KeyManagementModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  const value = useMemo(() => ({
    isOpen,
    openModal,
    closeModal,
  }), [isOpen]);

  return (
    <KeyManagementModalContext.Provider value={value}>
      {children}
    </KeyManagementModalContext.Provider>
  );
}

export function useKeyManagementModal() {
  const context = useContext(KeyManagementModalContext);
  if (!context) {
    throw new Error('useKeyManagementModal must be used within a KeyManagementModalProvider');
  }
  return context;
}