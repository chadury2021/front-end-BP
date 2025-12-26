# Vault Data Mapping

This document outlines how the frontend vault data maps to smart contract storage variables and getter methods.

## Key Metrics Mapping

### Total Assets i.e. Total Value Locked (TVL)

The contract's total assets `asset.balanceOf(address(this))` are categorized as follows:

- Lender assets (described below)
  - Equal to _LOAN_ASSETS_ + _WITHDRAWALS_TOTAL_.assetsWithdrawable
- Trader assets

- **Frontend**: `vaultData.tvl` in useVaultData.jsx
- **Contract Sources**:
  - Primary: ERC4626's `totalAssets()` (inherited)
  - Components:
    - `_LOAN_ASSETS_` (active funds accruing interest)
    - `_WITHDRAWALS_TOTAL_.assetsWithdrawable` (pending withdrawals)
    - Trader assets (remaining balance)

### Borrowed Amount

Lender assets are categorized as follows:

- Active funds accrue interest and are at risk of loss. These are represented by ERC-4626 shares.
  - Requested withdrawals are a subset of active funds.
- Inactive funds do not accrue interest and are not at risk of loss. These are denominated as assets, not shares. They can be withdrawn at any time.

- **Frontend**: `vaultData.borrowed` in useVaultData.jsx
- **Contract Sources**:
  - Primary: `_LOAN_ASSETS_` storage variable
  - Current Implementation: Calculated from events (Borrowed/Repaid)
  - Recommended: Direct query of `_LOAN_ASSETS_` for more accurate state

### Deposit (User Position)

- **Frontend**: `vaultData.deposit` in useVaultData.jsx
- **Contract Sources**:
  - Primary: `balanceAssetValue(address owner)` getter method
  - Components:
    - `balanceOf(owner)` (ERC4626 shares)
    - `convertToAssets(shares)` (conversion to asset value)
  - Additional User-Specific Data:
    - `getWithdrawableAssets(address owner)` for pending withdrawals
    - `_WITHDRAWALS_[owner]` for withdrawal state

## Implementation Notes

1. **TVL Calculation**

   ```javascript
   const totalAssets = await vaultContract.totalAssets();
   ```

2. **Borrowed Amount**

   ```javascript
   const loanAssets = await vaultContract._LOAN_ASSETS_();
   ```

3. **User Deposit**
   ```javascript
   const userDeposit = await vaultContract.balanceAssetValue(userAddress);
   const withdrawable = await vaultContract.getWithdrawableAssets(userAddress);
   const totalUserPosition = userDeposit.add(withdrawable);
   ```

## Additional Available Getters

- `getTotalLenderWithdrawableAssets()`: Total assets available for withdrawal
- `getWithdrawableAssets(address)`: Per-user withdrawable assets
- Risk-related getters:
  - `getRiskRecordForParameter()`
  - `getRiskRecordDetailsForParameter()`
  - `getRiskParameter()`
