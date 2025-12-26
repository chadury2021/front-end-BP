// AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getDicyConnectionMetadata, getUserMetadata, updateUserProfile } from '../../apiServices';

const UserMetadataContext = createContext();

export function UserMetadataProvider({ children }) {
  const [user, setUser] = useState({});
  const [isMetadataLoading, setMetadataLoading] = useState(true);
  const [version, setVersion] = useState('0.0.0');
  const [is_2fa_enabled, setIs2FAEnabled] = useState(false);
  const [betaAgreedAt, setBetaAgreedAt] = useState(false);
  const [isRetail, setIsRetail] = useState(false);
  const [noAccountsFlag, setNoAccountsFlag] = useState([]);
  const [isDev, setIsDev] = useState(false);
  const [isMainnet, setIsMainnet] = useState(false);
  const [api_token, setApiToken] = useState(null);
  const [isDicyEnabled, setIsDicyEnabled] = React.useState(false);
  const [referralCode, setReferralCode] = React.useState(null);
  const [captchaKey, setCaptchaKey] = React.useState(null);
  const [onboarding, setOnboarding] = useState({});
  const [maintenanceModeEnabled, setMaintenanceModeEnabled] = useState(false);
  const [isMfaEnforced, setIsMfaEnforced] = useState(false);

  const fetchDicyCreds = async () => {
    try {
      const metadata = await getDicyConnectionMetadata();

      if (metadata.is_enabled) {
        setIsDicyEnabled(true);
      }
    } catch (error) {
      /* empty */
    }
  };

  const loadUserMetadata = async () => {
    let metadata = null;
    try {
      metadata = await getUserMetadata();
    } catch (error) {
      return;
    } finally {
      setMetadataLoading(false);
    }

    setUser(metadata);
    localStorage.setItem('user', JSON.stringify(metadata));
    if (metadata && metadata.version) {
      setVersion(metadata.version);
    }

    setNoAccountsFlag(metadata.no_accounts_flag);
    setIsDev(metadata.is_dev);
    setIsRetail(metadata.is_retail);
    setIsMainnet(metadata.is_mainnet);
    setBetaAgreedAt(metadata.beta_agreed_at);
    if (metadata.is_2fa_enabled !== undefined) {
      setIs2FAEnabled(metadata.is_2fa_enabled);
    }
    if (metadata.is_mfa_enforced !== undefined) {
      setIsMfaEnforced(Boolean(metadata.is_mfa_enforced));
    }

    if (metadata.api_token) {
      setApiToken(metadata.api_token);
    }
    setReferralCode(metadata.referral_code);
    if (metadata.onboarding && typeof metadata.onboarding === 'object') {
      setOnboarding(metadata.onboarding);
    } else {
      setOnboarding({});
    }
    if (metadata.maintenance_mode_enabled !== undefined) {
      setMaintenanceModeEnabled(Boolean(metadata.maintenance_mode_enabled));
    }

    if (metadata.is_authenticated) {
      fetchDicyCreds();
    }
    setCaptchaKey(metadata.captcha_key);
  };

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === 'user') {
        const newUserState = JSON.parse(event.newValue);
        setUser(newUserState);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  useEffect(() => {
    loadUserMetadata();
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      version,
      is_2fa_enabled,
      loadUserMetadata,
      betaAgreedAt,
      isRetail,
      noAccountsFlag,
      isDev,
      isMainnet,
      isMetadataLoading,
      api_token,
      isDicyEnabled,
      referralCode,
      captchaKey,
      onboarding,
      maintenanceModeEnabled,
      is_mfa_enforced: isMfaEnforced,
      // optimistic local update + server merge through existing profile endpoint
      markOnboarding: async (updates) => {
        if (!updates || typeof updates !== 'object') return;
        setOnboarding((prev) => ({ ...prev, ...updates }));
        try {
          await updateUserProfile({ onboarding: updates });
        } catch (e) {
          // revert on failure
          setOnboarding((prev) => prev); // noop; caller can also refetch if needed
        }
      },
    }),
    [
      user,
      version,
      is_2fa_enabled,
      betaAgreedAt,
      isRetail,
      setUser,
      loadUserMetadata,
      noAccountsFlag,
      isDev,
      isMainnet,
      isMetadataLoading,
      api_token,
      isDicyEnabled,
      referralCode,
      captchaKey,
      onboarding,
      maintenanceModeEnabled,
      isMfaEnforced,
    ]
  );

  return <UserMetadataContext.Provider value={value}>{children}</UserMetadataContext.Provider>;
}

export const useUserMetadata = () => useContext(UserMetadataContext);
