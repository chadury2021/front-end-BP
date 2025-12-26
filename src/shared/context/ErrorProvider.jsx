import React, { useCallback, createContext, useMemo, useRef } from 'react';
import { useToast } from './ToastProvider';

export const ErrorContext = createContext('');

/**
 * @deprecated Use ToastProvider instead
 */
export function ErrorProvider(props) {
  const { children } = props;

  const { showToastMessage } = useToast();
  // Track recently shown alerts to prevent duplicates within a short window
  const lastShownRef = useRef({});
  const DEDUPE_WINDOW_MS = 8000; // 8s window to avoid spamming on brief disconnects

  const showAlert = useCallback(
    ({ severity, message }) => {
      if (!message) return;
      const now = Date.now();
      const key = `${severity}|${message}`;
      const last = lastShownRef.current[key];
      if (!last || now - last > DEDUPE_WINDOW_MS) {
        lastShownRef.current[key] = now;
        showToastMessage({ message, type: severity, anchor: 'bottom-center' });
      }
    },
    [showToastMessage]
  );

  const memomizedErrorStates = useMemo(() => ({ showAlert }), [showAlert]);

  return <ErrorContext.Provider value={memomizedErrorStates}>{children}</ErrorContext.Provider>;
}
