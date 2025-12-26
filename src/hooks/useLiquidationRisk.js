import { useMemo } from 'react';

// Utilities: prefer existing helpers
import { CASH_ASSETS } from '@/constants';
import { calculateMarginRatio } from '@/util/marginRatioUtils';

// Determine if an asset is a stablecoin/cash token
const isStablecoin = (symbol) => CASH_ASSETS.includes(symbol);

/**
 * Calculate average entry price for a position
 * @param {Object} position - Position data with size, notional, and symbol
 * @param {number} currentPrice - Current market price for the asset
 * @returns {number} Average entry price
 *
 * Example calculation:
 * - Position size: 100 ETH
 * - Notional value: $400,000
 * - Average entry price = $400,000 / 100 = $4,000 per ETH
 *
 * If unrealized PnL is available, we can also estimate entry price:
 * - Current price: $4,200
 * - Unrealized profit: $20,000
 * - Estimated entry price = $4,200 - ($20,000 / 100) = $4,000 per ETH
 */
const calculateAverageEntryPrice = (position, currentPrice) => {
  const size = Number(position.size || position.amount || 0);
  const notional = Number(position.notional || 0);
  const unrealizedPnL = Number(position.unrealized_profit || 0);

  // Calculate entry price: (Notional - Unrealized PnL) / Size
  // This formula works for both long and short positions
  if (size !== 0 && notional !== 0) {
    const adjustedNotional = notional - unrealizedPnL;
    return Math.abs(adjustedNotional / size);
  }

  // If we don't have enough data to calculate entry price, return 0
  return 0;
};

/**
 * Hook: compute liquidation risk metrics from an account balance object
 * Input shape matches backend account balances: { assets: [...], equities: [...] }
 * Returns key metrics and a normalized risk score (0=liquidated, 100=safe)
 */
export default function useLiquidationRisk(accountBalance, currentPrices = {}) {
  return useMemo(() => {
    if (!accountBalance || !Array.isArray(accountBalance.assets)) {
      return {
        liquidationBuffer: 0,
        accountBalanceUsd: 0,
        totalPositionNotionalUsd: 0,
        averageLeverage: 0,
        maintenanceMarginUsd: 0,
        riskScore: 100,
        hasPerpExposure: false,
        averageEntryPrice: 0,
      };
    }

    // Detect Hyperliquid-style cross margin accounts
    const normalizedExchange = (accountBalance.exchange || '').toLowerCase();
    const isHyperliquid =
      normalizedExchange === 'hyperliquid' ||
      (
        Array.isArray(accountBalance.assets) &&
        accountBalance.assets.some(
          (a) =>
            a &&
            a.asset_type === 'token' &&
            a.symbol &&
            !['usdt', 'usdc', 'usde', 'dai', 'fdusd', 'usdd', 'tusd', 'busd', 'usdk', 'pyusd', 'usd']
              .includes(String(a.symbol).toLowerCase()) &&
            a.notional && Number(a.notional) > 0
        )
      );

    let marginBalanceUsd = 0; // sum of margin balances available across relevant wallets
    let totalPositionNotionalUsd = 0; // signed notionals for positions only
    let maintenanceMarginUsd = 0; // sum maint margin across positions
    let initialMarginUsd = 0; // sum initial margin across positions (isolated margin)
    let weightedLevNumerator = 0; // sum |notional| * leverage
    let weightedLevDenominator = 0; // sum |notional|
    let hasPerpExposure = false;
    const perPosition = [];

    // Compute account equity/balance using equities when provided; fallback to spot tokens + PnL
    let accountBalanceUsd = 0;
    if (Array.isArray(accountBalance.equities) && accountBalance.equities.length > 0) {
      accountBalanceUsd = accountBalance.equities.reduce((acc, e) => acc + Number(e.total_equity || 0), 0);
    } else {
      // Fallback: sum stable tokens and PnL from positions
      // For Hyperliquid accounts, sum all token notional values since they represent USD values

      // Calculate account balance from tokens and positions
      let tokenBalance = 0;
      let positionPnL = 0;

      accountBalance.assets.forEach(a => {
        if (a.asset_type === 'token') {
          // For Hyperliquid, include all token notional values
          // For other exchanges, only include stablecoin notional values
          if (isHyperliquid || isStablecoin(a.symbol)) {
            const notionalValue = Number(a.notional || 0);
            tokenBalance += notionalValue;
          }
        }
        if (a.asset_type === 'position') {
          const pnlValue = Number(a.unrealized_profit || 0);
          positionPnL += pnlValue;
        }
      });

      accountBalanceUsd = tokenBalance + positionPnL;
    }

    // For Hyperliquid accounts, add maintenance margin and initial margin to account balance
    // This represents the total account value including margin requirements and isolated margin
    if (isHyperliquid) {
      accountBalanceUsd += maintenanceMarginUsd + initialMarginUsd;
    }

    accountBalance.assets.forEach((a) => {
      if (a.asset_type === 'token') {
        // accumulate margin balance for quote/settle coin if provided
        marginBalanceUsd += Number(a.margin_balance || 0);
        return;
      }

      if (a.asset_type !== 'position') return;
      hasPerpExposure = true;

      const notional = Number(a.notional || 0);
      const absNotional = Math.abs(notional);
      totalPositionNotionalUsd += notional; // signed to infer bias elsewhere; use abs for leverage

      maintenanceMarginUsd += Number(a.maint_margin || 0);
      initialMarginUsd += Number(a.initial_margin || 0);

      if (a.leverage != null) {
        weightedLevNumerator += absNotional * Number(a.leverage);
        weightedLevDenominator += absNotional;
      }

      // Position-level metrics
      const positionMaint = Number(a.maint_margin || 0);
      const positionMarginBal = Number(a.margin_balance || 0);
      const positionBuffer = Math.max(0, positionMarginBal - positionMaint);

      // Calculate margin ratio using the updated utility function
      const marginRatioPct = calculateMarginRatio(a, accountBalanceUsd, isHyperliquid);

      // Calculate average entry price
      const currentPrice = currentPrices[a.symbol] || 0;
      const avgEntryPrice = calculateAverageEntryPrice(a, currentPrice);

      perPosition.push({
        symbol: a.symbol,
        notional: absNotional,
        leverage: Number(a.leverage || 0),
        maintMargin: positionMaint,
        marginBalance: positionMarginBal,
        buffer: positionBuffer,
        marginRatioPct,
        avgEntryPrice,
        currentPrice,
        size: Number(a.size || a.amount || 0),
      });
    });

    const totalAbsNotional = Math.abs(totalPositionNotionalUsd);
    const averageLeverage = weightedLevDenominator > 0 ? weightedLevNumerator / weightedLevDenominator : 0;

    // Liquidation buffer approximation: funds available above maint margin
    // For Hyperliquid accounts, use the total account balance (including maint margin) as equity baseline
    // For other exchanges, prefer marginBalance if present; otherwise use account balance as equity baseline
    let equityBaseline;
    if (isHyperliquid) {
      // For Hyperliquid, the account balance already includes maintenance margin
      // So we use the full account balance as the equity baseline
      equityBaseline = accountBalanceUsd;
    } else {
      // For other exchanges, use the original logic
      equityBaseline = marginBalanceUsd > 0 ? marginBalanceUsd : accountBalanceUsd;
    }
    const liquidationBuffer = Math.max(0, equityBaseline - maintenanceMarginUsd);

    // Calculate weighted average entry price across all positions
    let weightedEntryPriceNumerator = 0;
    let weightedEntryPriceDenominator = 0;

    perPosition.forEach((pos) => {
      if (pos.avgEntryPrice > 0 && pos.notional > 0) {
        weightedEntryPriceNumerator += pos.avgEntryPrice * pos.notional;
        weightedEntryPriceDenominator += pos.notional;
      }
    });

    const averageEntryPrice = weightedEntryPriceDenominator > 0
      ? weightedEntryPriceNumerator / weightedEntryPriceDenominator
      : 0;

    // Risk score heuristic:
    // Lower margin ratios = safer positions (higher risk score)
    // Higher margin ratios = riskier positions (lower risk score)
    let riskScore;
    if (perPosition.length > 0) {
      // Weight margin ratios by position size
      const totalAbs = perPosition.reduce((acc, p) => acc + p.notional, 0) || 1;
      const weightedRatio = perPosition.reduce((acc, p) => acc + (p.marginRatioPct * p.notional) / totalAbs, 0);

      // Invert the ratio: lower margin ratio = higher safety score
      if (isHyperliquid) {
        // For Hyperliquid, use a more appropriate scaling since we're using account balance as denominator
        // A 50% margin ratio means half the account is tied up in maintenance margin
        const safetyScore = Math.max(0, Math.min(100, 100 - (weightedRatio * 1.5))); // 66% margin ratio = 0 safety
        riskScore = Math.round(safetyScore);
      } else {
        // For other exchanges, use the original scaling
        const safetyScore = Math.max(0, Math.min(100, 100 - (weightedRatio * 2))); // 50% margin ratio = 0 safety
        riskScore = Math.round(safetyScore);
      }
    } else {
      // Fallback: use liquidation buffer ratio
      const denom = maintenanceMarginUsd > 0 ? maintenanceMarginUsd * 2 : 1; // 2x buffer considered very safe
      riskScore = Math.max(0, Math.min(100, Math.round((liquidationBuffer / denom) * 100)));
    }

    return {
      liquidationBuffer,
      accountBalanceUsd,
      totalPositionNotionalUsd: totalAbsNotional,
      averageLeverage,
      maintenanceMarginUsd,
      riskScore,
      hasPerpExposure,
      perPosition,
      averageEntryPrice,
    };
  }, [accountBalance, currentPrices]);
}


