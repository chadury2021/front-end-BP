/**
 * Array of ABI definitions for attestation-related getters
 * Used for decoding event logs and making contract calls to the Vault contract
 *
 * The ABIs define:
 * 1. Attestation-related getters - For accessing risk data and attestations
 * 2. Lending-related functions - For depositing, withdrawing, and managing funds
 * 3. Borrowing-related functions - For managing loans and collateral
 * 4. Epoch and settlement functions - For managing the vault's time-based operations
 *
 * @typedef {Object} InterestState
 * @property {string} interestRate - The current interest rate as a uint64
 * @property {string} lastSettledAt - Timestamp when interest was last settled as uint64
 *
 * @typedef {Object} RiskRecord
 * @property {string} value - Risk value as a number string
 *
 * @typedef {Object} RiskKey
 * @property {string} traderId - Unique identifier for the trader
 * @property {string} epoch - Timestamp epoch
 * @property {string} parameterId - Identifier for the risk parameter
 */
const attestationGetters = [
  /* ==================== Attestation-Related Getters ==================== */

  {
    /**
     * View function to get the Attestations contract used by this vault
     * Returns the address of the Attestations contract instance
     *
     * @function getAttestations
     * @returns {string} Address of the Attestations contract
     */
    type: 'function',
    name: 'getAttestations',
    inputs: [],
    outputs: [
      { name: '', type: 'address', internalType: 'contract Attestations' }
    ],
    stateMutability: 'view'
  },

  {
    /**
     * View function to get the trader ID associated with this vault
     * Returns the trader ID as bytes32
     *
     * @function getTraderId
     * @returns {string} The trader ID
     */
    type: 'function',
    name: 'getTraderId',
    inputs: [],
    outputs: [
      { name: '', type: 'bytes32', internalType: 'bytes32' }
    ],
    stateMutability: 'view'
  },

  {
    /**
     * View function to get the risk group ID associated with this vault
     * Returns the risk group ID
     *
     * @function getRiskGroupId
     * @returns {string} The risk group ID
     */
    type: 'function',
    name: 'getRiskGroupId',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },
]

/**
 * Array of ABI definitions for key Vault events and functions
 * Used for decoding event logs and making contract calls to the Vault contract
 *
 * The ABIs define:
 * 1. Attestation-related getters - For accessing risk data and attestations
 * 2. Lending-related functions - For depositing, withdrawing, and managing funds
 * 3. Borrowing-related functions - For managing loans and collateral
 * 4. Epoch and settlement functions - For managing the vault's time-based operations
 *
 * @typedef {Object} InterestState
 * @property {string} interestRate - The current interest rate as a uint64
 * @property {string} lastSettledAt - Timestamp when interest was last settled as uint64
 *
 * @typedef {Object} WithdrawalState
 * @property {number} epoch - The epoch when withdrawal was requested
 * @property {string} sharesRequested - Amount of shares requested for withdrawal
 * @property {string} assetsWithdrawable - Amount of assets available for withdrawal
 *
 * @typedef {Object} SharesState
 * @property {string} sharesOwned - Amount of shares owned (excluding withdrawable assets)
 * @property {WithdrawalState} withdrawal - Withdrawal state information
 *
 * @typedef {Object} RiskRecord
 * @property {string} value - Risk value as a number string
 *
 * @typedef {Object} RiskKey
 * @property {string} traderId - Unique identifier for the trader
 * @property {string} epoch - Timestamp epoch
 * @property {string} parameterId - Identifier for the risk parameter
 */
export const abis = [
  /* ==================== Attestation-Related Getters ==================== */
  ...attestationGetters,
  /* ==================== Lending-Related Functions ==================== */

  {
    /**
     * View function to get the total assets in the vault
     * Returns the total amount of assets
     *
     * @function totalAssets
     * @returns {string} Total assets
     */
    type: 'function',
    name: 'totalAssets',
    inputs: [],
    outputs: [
      { name: 'assets', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  {
    /**
     * Function to deposit assets into the vault
     * Takes amount of assets and receiver address
     * Returns amount of shares minted
     *
     * @function deposit
     * @param {string} assets - Amount of assets to deposit
     * @param {string} receiver - Address to receive the shares
     * @returns {string} Amount of shares minted
     */
    type: 'function',
    name: 'deposit',
    inputs: [
      { name: 'assets', type: 'uint256', internalType: 'uint256' },
      { name: 'receiver', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'shares', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },

  {
    /**
     * Function to mint shares in the vault
     * Takes amount of shares and receiver address
     * Returns amount of assets used
     *
     * @function mint
     * @param {string} shares - Amount of shares to mint
     * @param {string} receiver - Address to receive the shares
     * @returns {string} Amount of assets used
     */
    type: 'function',
    name: 'mint',
    inputs: [
      { name: 'shares', type: 'uint256', internalType: 'uint256' },
      { name: 'receiver', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: 'assets', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },

  {
    /**
     * Function to request withdrawal of assets
     * Takes amount of shares to withdraw
     * Returns the epoch when the withdrawal will be available
     *
     * @function requestWithdrawal
     * @param {string} shares - Amount of shares to withdraw
     * @returns {number} Epoch when withdrawal will be available
     */
    type: 'function',
    name: 'requestWithdrawal',
    inputs: [
      { name: 'shares', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: 'epoch', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'nonpayable'
  },

  {
    /**
     * Function to execute withdrawal of assets
     * Takes amount of assets to withdraw and receiver address
     * Returns nothing
     *
     * @function executeWithdrawal
     * @param {string} assets - Amount of assets to withdraw
     * @param {string} receiver - Address to receive the assets
     */
    type: 'function',
    name: 'executeWithdrawal',
    inputs: [
      { name: 'assets', type: 'uint256', internalType: 'uint256' },
      { name: 'receiver', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  {
    /**
     * View function to get withdrawable assets for an account
     * Takes owner address
     * Returns amount of withdrawable assets
     *
     * @function getWithdrawableAssets
     * @param {string} owner - Address of the account owner
     * @returns {string} Amount of withdrawable assets
     */
    type: 'function',
    name: 'getWithdrawableAssets',
    inputs: [
      { name: 'owner', type: 'address', internalType: 'address' }
    ],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  /* ==================== Borrowing-Related Functions ==================== */

  {
    /**
     * Function for the trader to borrow assets
     * Takes amount of assets to borrow and receiver address
     * Returns nothing
     *
     * @function borrow
     * @param {string} assets - Amount of assets to borrow
     * @param {string} receiver - Address to receive the borrowed assets
     */
    type: 'function',
    name: 'borrow',
    inputs: [
      { name: 'assets', type: 'uint256', internalType: 'uint256' },
      { name: 'receiver', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  {
    /**
     * Function for the trader to repay borrowed assets
     * Takes amount of assets to repay
     * Returns nothing
     *
     * @function repay
     * @param {string} assets - Amount of assets to repay
     */
    type: 'function',
    name: 'repay',
    inputs: [
      { name: 'assets', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  {
    /**
     * Function for the trader to add collateral
     * Takes amount of assets to add as collateral
     * Returns nothing
     *
     * @function addCollateral
     * @param {string} assets - Amount of assets to add as collateral
     */
    type: 'function',
    name: 'addCollateral',
    inputs: [
      { name: 'assets', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  {
    /**
     * Function for the trader to remove collateral
     * Takes amount of assets to remove and receiver address
     * Returns nothing
     *
     * @function removeCollateral
     * @param {string} assets - Amount of assets to remove
     * @param {string} receiver - Address to receive the removed collateral
     */
    type: 'function',
    name: 'removeCollateral',
    inputs: [
      { name: 'assets', type: 'uint256', internalType: 'uint256' },
      { name: 'receiver', type: 'address', internalType: 'address' }
    ],
    outputs: [],
    stateMutability: 'nonpayable'
  },

  /* ==================== Epoch and Settlement Functions ==================== */

  {
    /**
     * View function to get the current epoch
     * Returns the current epoch number
     *
     * @function getCurrentEpoch
     * @returns {string} Current epoch number
     */
    type: 'function',
    name: 'getCurrentEpoch',
    inputs: [],
    outputs: [
      { name: '', type: 'uint256', internalType: 'uint256' }
    ],
    stateMutability: 'view'
  },

  {
    /**
     * View function to check if a timestamp is in the blackout period
     * Takes a timestamp
     * Returns whether the timestamp is in the blackout period
     *
     * @function inBlackoutPeriod
     * @param {string} timestamp - Timestamp to check
     * @returns {boolean} Whether the timestamp is in the blackout period
     */
    type: 'function',
    name: 'inBlackoutPeriod',
    inputs: [
      { name: 'timestamp', type: 'uint256', internalType: 'uint256' }
    ],
    outputs: [
      { name: '', type: 'bool', internalType: 'bool' }
    ],
    stateMutability: 'view'
  },

  /* ==================== Events ==================== */

  {
    /**
     * Event emitted when a withdrawal is requested
     * Contains the owner address, shares requested, and epoch
     *
     * @event WithdrawalRequested
     * @param {string} owner - Address of the account owner (indexed)
     * @param {string} shares - Amount of shares requested for withdrawal
     * @param {string} epoch - Epoch when the withdrawal will be available
     */
    type: 'event',
    name: 'WithdrawalRequested',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'shares',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'epoch',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
  },

  {
    /**
     * Event emitted when a withdrawal is executed
     * Contains the owner address, assets withdrawn, and receiver address
     *
     * @event WithdrawalExecuted
     * @param {string} owner - Address of the account owner (indexed)
     * @param {string} assets - Amount of assets withdrawn
     * @param {string} receiver - Address receiving the withdrawn assets (indexed)
     */
    type: 'event',
    name: 'WithdrawalExecuted',
    inputs: [
      {
        name: 'owner',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'assets',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'receiver',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
  },

  {
    /**
     * Event emitted when assets are borrowed
     * Contains the borrower address, assets borrowed, and receiver address
     *
     * @event Borrowed
     * @param {string} borrower - Address of the borrower (indexed)
     * @param {string} assets - Amount of assets borrowed
     * @param {string} receiver - Address receiving the borrowed assets (indexed)
     */
    type: 'event',
    name: 'Borrowed',
    inputs: [
      {
        name: 'borrower',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'assets',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'receiver',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
  },

  {
    /**
     * Event emitted when borrowed assets are repaid
     * Contains the borrower address and assets repaid
     *
     * @event Repaid
     * @param {string} borrower - Address of the borrower (indexed)
     * @param {string} assets - Amount of assets repaid
     */
    type: 'event',
    name: 'Repaid',
    inputs: [
      {
        name: 'borrower',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'assets',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
  },

  {
    /**
     * Event emitted when collateral is added
     * Contains the trader address and assets added as collateral
     *
     * @event CollateralAdded
     * @param {string} trader - Address of the trader (indexed)
     * @param {string} assets - Amount of assets added as collateral
     */
    type: 'event',
    name: 'CollateralAdded',
    inputs: [
      {
        name: 'trader',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'assets',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
    ],
  },

  {
    /**
     * Event emitted when collateral is removed
     * Contains the trader address, assets removed, and receiver address
     *
     * @event CollateralRemoved
     * @param {string} trader - Address of the trader (indexed)
     * @param {string} assets - Amount of assets removed
     * @param {string} receiver - Address receiving the removed collateral (indexed)
     */
    type: 'event',
    name: 'CollateralRemoved',
    inputs: [
      {
        name: 'trader',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
      {
        name: 'assets',
        type: 'uint256',
        indexed: false,
        internalType: 'uint256',
      },
      {
        name: 'receiver',
        type: 'address',
        indexed: true,
        internalType: 'address',
      },
    ],
  },
];

