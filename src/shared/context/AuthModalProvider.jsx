import React, { createContext, useState, useContext, useMemo } from 'react';

export const MODAL_TYPES = {
  NONE: 'none',
  LOGIN: 'login',
  SIGNUP: 'signup',
  FORGOT_PASSWORD: 'forgotPassword',
  TWO_FACTOR: 'twoFactor',
};

const AuthModalContext = createContext();

export function AuthModalProvider({ children }) {
  const [modalType, setModalType] = useState(MODAL_TYPES.NONE);
  const [modalData, setModalData] = useState(null);
  const [messageDetails, setMessageDetails] = useState({ messages: [], messageType: null });

  const openLoginModal = () => {
    setModalType(MODAL_TYPES.LOGIN);
    setModalData(null);
  };

  const openSignupModal = (data = null) => {
    setModalType(MODAL_TYPES.SIGNUP);
    setModalData(data);
  };

  const openForgotPasswordModal = () => {
    setModalType(MODAL_TYPES.FORGOT_PASSWORD);
    setModalData(null);
  };

  const openTwoFactorModal = (data) => {
    setModalType(MODAL_TYPES.TWO_FACTOR);
    setModalData(data);
  };

  const closeModal = () => {
    setModalType(MODAL_TYPES.NONE);
    setModalData(null);
  };

  const updateMessageDetails = ({ messages, messageType }) => {
    setMessageDetails({ messages, messageType });
  };

  // Use useMemo to prevent creating a new object on every render
  const contextValue = useMemo(
    () => ({
      modalType,
      modalData,
      openLoginModal,
      openSignupModal,
      openForgotPasswordModal,
      openTwoFactorModal,
      closeModal,
      MODAL_TYPES,
      messageDetails,
      updateMessageDetails,
    }),
    [modalType, modalData, messageDetails]
  );

  return <AuthModalContext.Provider value={contextValue}>{children}</AuthModalContext.Provider>;
}

export function useAuthModal() {
  return useContext(AuthModalContext);
}
