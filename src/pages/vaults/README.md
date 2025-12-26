# Vaults Architecture

This document outlines the architecture and components of the Vaults feature in the application.

## Overview

The Vaults feature provides users with the ability to view, deposit into, and withdraw from various investment vaults. Each vault has specific metrics like Total Value Locked (TVL), borrowed amounts, APY, and historical performance data.

## Directory Structure

```
vaults/
├── README.md                  # This documentation
├── VaultPage.jsx              # Main vaults listing page
├── VaultRow.jsx               # Individual row component for the vaults table
├── VaultDetailsPage.jsx       # Detailed view of a specific vault
├── VaultComponents.jsx        # Reusable vault-specific UI components
├── abis/                      # Smart contract ABIs
│   └── VaultAbis.js           # Vault-related contract ABIs
├── data/                      # Data fetching and processing
│   ├── README.md              # Data mapping documentation
│   ├── useVaultList.jsx       # Hook for fetching all available vaults
│   ├── useVaultOverviewData.jsx # Hook for fetching vault overview data
│   ├── useVaultDetailsData.jsx  # Hook for fetching detailed vault data
│   └── VaultFetchers.js       # Utility functions for fetching vault data
└── graphs/                    # Chart and visualization components
    ├── SingleSplineChart.jsx  # Line chart for historical data
    └── SparkChart.jsx         # Small inline chart for vault performance
```

## Key Components

### `VaultPage.jsx`

- Main page displaying a table of all available vaults
- Includes portfolio summary and platform statistics
- Provides filtering and search functionality
- Uses `useVaultList` hook to fetch vault addresses

### `VaultDetailsPage.jsx`

- Detailed view of a specific vault
- Shows comprehensive metrics and historical performance
- Provides deposit/withdraw functionality
- Contains tabs for Overview and User Performance
- Uses `useVaultDetailsData` hook for fetching vault details

## Data Mapping

The `/data/README.md` file contains detailed information about how frontend data maps to smart contract storage variables and getter methods. Key mappings include:

1. **Total Value Locked (TVL)**

   - Maps to `totalAssets()` in the ERC4626 contract
   - Includes lender assets and trader assets

2. **Borrowed Amount**

   - Maps to `_LOAN_ASSETS_` storage variable
   - Represents active funds accruing interest

3. **User Deposit**
   - Maps to `balanceAssetValue(address)` getter method
   - Includes pending withdrawals via `getWithdrawableAssets(address)`

## Smart Contract Integration

The application interacts with vault smart contracts through the ABIs defined in `abis/VaultAbis.js`. These contracts follow the ERC4626 standard for tokenized vaults, with extensions for borrowing and risk management.

## Development Guidelines

When extending or modifying the vaults feature:

1. Maintain consistent data flow patterns using the existing hooks structure
2. Add new data fetchers to `VaultFetchers.js` if necessary
3. Ensure UI components follow the design patterns in `VaultComponents.jsx`
4. Update this documentation when adding new components or changing the architecture
