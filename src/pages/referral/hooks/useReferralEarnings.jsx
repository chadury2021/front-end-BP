import { useMemo } from 'react';

/**
 * Calculate referral earnings based on:
 * - Referred users' Hyperliquid executed notional
 * - Referred users' Pacifica executed notional (from when builder fee was enabled)
 * - User's own Hyperliquid executed notional before October 30, 2025
 * Note: User's own Pacifica volume is not included in referral earnings
 * Commission rate: 0.8 basis points (0.008%) of executed notional
 */
function useReferralEarnings(userReferrals, userEarnings) {
  const earnings = useMemo(() => {
    // Calculate total executed notional from all referred users (Hyperliquid + Pacifica)
    const pendingEarnings =
      (userReferrals || []).reduce((sum, referral) => {
        return sum + (referral.earnings || 0);
      }, 0) + userEarnings;

    return {
      pendingEarnings,
      availableEarnings: 0, // Set to $0 as per requirement
      lifetimeEarnings: pendingEarnings, // Same as pending earnings as per requirement
    };
  }, [userReferrals, userEarnings]);

  return earnings;
}

export default useReferralEarnings;
