import { abis as attestationsAbis } from './abis/AttestationsAbis';

/**
 * Combined ABI definitions from Attestations and Vault contracts
 * Used for decoding event logs and making contract calls
 * 
 * Includes:
 * - Attestation events and functions for data and risk records
 * - Vault functions for lending, borrowing, and collateral management
 * - Epoch management and settlement functions
 * 
 * @see AttestationsAbis.js for detailed documentation on attestation ABIs
 * @see VaultAbis.js for detailed documentation on vault ABIs
 */
export const abis = [...attestationsAbis];