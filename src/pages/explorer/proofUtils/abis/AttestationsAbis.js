/**
 * Array of ABI definitions for attestation events and functions
 * Used for decoding event logs and making contract calls to the Attestations contract
 *
 * The ABIs define:
 * 1. AttestedToData event - Emitted when data attestations are submitted
 * 2. AttestedToRisk event - Emitted when risk attestations are submitted
 * 3. getDataRecord function - Retrieves data records and consensus status
 * 4. getRiskRecord function - Retrieves risk records and consensus status
 * 5. getDataGroup function - Retrieves data group parameters including threshold and members
 * 6. getRiskGroup function - Retrieves risk group parameters including threshold and members
 * 7. getRiskParameter function - Retrieves risk parameter metadata including name and description
 *
 * @typedef {Object} DataRecord
 * @property {string} merkleRoot - Merkle root hash of the data
 * @property {string} cid - Content identifier for IPFS
 *
 * @typedef {Object} RiskRecord
 * @property {string} value - Risk value as a number string
 *
 * @typedef {Object} GroupParams
 * @property {number} threshold - Number of attestations needed for consensus
 * @property {string[]} members - Array of member addresses in the group
 *
 * @typedef {Object} RiskParameter
 * @property {string} metadataName - Name of the risk parameter
 * @property {string} metadataDescription - Description of the risk parameter
 *
 * @typedef {Object} AttestedToDataEvent
 * @property {string} traderId - Unique identifier for the trader
 * @property {string} epoch - Timestamp epoch
 * @property {string} attester - Address of the attesting party
 * @property {DataRecord} record - The data record containing merkle root and CID
 *
 * @typedef {Object} AttestedToRiskEvent
 * @property {string} traderId - Unique identifier for the trader
 * @property {string} epoch - Timestamp epoch
 * @property {string} parameterId - Identifier for the risk parameter
 * @property {string} attester - Address of the attesting party
 * @property {RiskRecord} record - The risk record containing value
 *
 * @typedef {Object} DataKey
 * @property {string} traderId - Unique identifier for the trader
 * @property {string} epoch - Timestamp epoch
 *
 * @typedef {Object} RiskKey
 * @property {string} traderId - Unique identifier for the trader
 * @property {string} epoch - Timestamp epoch
 * @property {string} parameterId - Identifier for the risk parameter
 */
export const abis = [
  {
    /**
     * Event emitted when an attester submits data attestation
     * Contains the trader ID, epoch, attester address, and data record with merkle root and CID
     *
     * The merkle root is used to verify data integrity while the CID points to the full data on IPFS
     * Indexed parameters (traderId, epoch) can be efficiently filtered when querying events
     *
     * @event AttestedToData
     * @param {string} traderId - Unique identifier for the trader (indexed)
     * @param {string} epoch - Timestamp epoch (indexed)
     * @param {string} attester - Address of the attesting party
     * @param {DataRecord} record - Data record containing merkle root and CID
     */
    type: 'event',
    name: 'AttestedToData',
    inputs: [
      {
        name: 'traderId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'epoch',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'attester',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'record',
        type: 'tuple',
        indexed: false,
        internalType: 'struct Attestations_Types.DataRecord',
        components: [
          {
            name: 'merkleRoot',
            type: 'bytes32',
            internalType: 'bytes32',
          },
          {
            name: 'cid',
            type: 'string',
            internalType: 'string',
          },
        ],
      },
    ],
  },
  {
    /**
     * Event emitted when an attester submits risk attestation
     * Contains the trader ID, epoch, parameter ID, attester address, and risk record with value
     *
     * The risk value represents a specific risk metric for the trader
     * All three key fields (traderId, epoch, parameterId) are indexed for efficient filtering
     *
     * @event AttestedToRisk
     * @param {string} traderId - Unique identifier for the trader (indexed)
     * @param {string} epoch - Timestamp epoch (indexed)
     * @param {string} parameterId - Identifier for the risk parameter (indexed)
     * @param {string} attester - Address of the attesting party
     * @param {RiskRecord} record - Risk record containing value
     */
    type: 'event',
    name: 'AttestedToRisk',
    inputs: [
      {
        name: 'traderId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'epoch',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'parameterId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'attester',
        type: 'address',
        indexed: false,
        internalType: 'address',
      },
      {
        name: 'record',
        type: 'tuple',
        indexed: false,
        internalType: 'struct Attestations_Types.RiskRecord',
        components: [
          {
            name: 'value',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
  },
  {
    /**
     * View function to retrieve a data record and its consensus status
     * Takes a DataKey struct containing traderId and epoch
     * Returns the data record (merkle root) and whether consensus was reached
     *
     * @function getDataRecord
     * @param {DataKey} key - Key identifying the data record to retrieve
     * @returns {[DataRecord, boolean]} Tuple of [record, hasConsensus]
     * @throws {Error} If record does not exist or contract call fails
     */
    type: 'function',
    name: 'getDataRecord',
    inputs: [
      {
        components: [
          { name: 'traderId', type: 'bytes32', internalType: 'bytes32' },
          { name: 'epoch', type: 'uint256', internalType: 'uint256' },
          { name: 'parameterId', type: 'uint256', internalType: 'uint256' },
        ],
        name: 'key',
        type: 'tuple',
        internalType: 'struct Attestations_Types.DataKey',
      },
    ],
    outputs: [
      {
        components: [{ name: 'merkleRoot', type: 'bytes32', internalType: 'bytes32' }],
        name: 'record',
        type: 'tuple',
        internalType: 'struct Attestations_Types.DataRecord',
      },
      { name: 'hasConsensus', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    /**
     * View function to retrieve a risk record and its consensus status
     * Takes a RiskKey struct (traderId, epoch, parameterId) and riskGroupId
     * Returns the risk record (value) and whether consensus was reached
     *
     * @function getRiskRecord
     * @param {RiskKey} key - Key identifying the risk record to retrieve
     * @param {number} riskGroupId - ID of the risk group to query
     * @returns {[RiskRecord, boolean]} Tuple of [record, hasConsensus]
     * @throws {Error} If record does not exist or contract call fails
     */
    type: 'function',
    name: 'getRiskRecord',
    inputs: [
      {
        components: [
          { name: 'traderId', type: 'bytes32', internalType: 'bytes32' },
          { name: 'epoch', type: 'uint256', internalType: 'uint256' },
          { name: 'parameterId', type: 'uint256', internalType: 'uint256' },
        ],
        name: 'key',
        type: 'tuple',
        internalType: 'struct Attestations_Types.RiskKey',
      },
      { name: 'riskGroupId', type: 'uint256', internalType: 'uint256' },
    ],
    outputs: [
      {
        components: [{ name: 'value', type: 'uint256', internalType: 'uint256' }],
        name: 'record',
        type: 'tuple',
        internalType: 'struct Attestations_Types.RiskRecord',
      },
      { name: 'hasConsensus', type: 'bool', internalType: 'bool' },
    ],
    stateMutability: 'view',
  },
  {
    /**
     * View function to retrieve data group parameters
     * Returns the group parameters including threshold and member addresses
     *
     * @function getDataGroup
     * @returns {GroupParams} Group parameters containing threshold and members
     * @throws {Error} If contract call fails
     */
    type: 'function',
    name: 'getDataGroup',
    inputs: [],
    outputs: [
      {
        components: [
          { name: 'threshold', type: 'uint256', internalType: 'uint256' },
          { name: 'members', type: 'address[]', internalType: 'address[]' },
        ],
        name: 'group',
        type: 'tuple',
        internalType: 'struct Attestations_Types.GroupParams',
      },
    ],
    stateMutability: 'view',
  },
  {
    /**
     * View function to retrieve risk group parameters
     * Takes a risk group ID and returns the group parameters including threshold and member addresses
     *
     * @function getRiskGroup
     * @param {number} riskGroupId - ID of the risk group to query
     * @returns {GroupParams} Group parameters containing threshold and members
     * @throws {Error} If contract call fails
     */
    type: 'function',
    name: 'getRiskGroup',
    inputs: [{ name: 'riskGroupId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'threshold', type: 'uint256', internalType: 'uint256' },
          { name: 'members', type: 'address[]', internalType: 'address[]' },
        ],
        name: 'group',
        type: 'tuple',
        internalType: 'struct Attestations_Types.GroupParams',
      },
    ],
    stateMutability: 'view',
  },
  {
    /**
     * View function to retrieve risk parameter metadata
     * Takes a risk parameter ID and returns the parameter metadata including name and description
     *
     * @function getRiskParameter
     * @param {number} riskParameterId - ID of the risk parameter to query
     * @returns {RiskParameter} Risk parameter metadata containing name and description
     * @throws {Error} If parameter does not exist or contract call fails
     */
    type: 'function',
    name: 'getRiskParameter',
    inputs: [{ name: 'riskParameterId', type: 'uint256', internalType: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'metadataName', type: 'string', internalType: 'string' },
          { name: 'metadataDescription', type: 'string', internalType: 'string' },
        ],
        name: 'parameter',
        type: 'tuple',
        internalType: 'struct Attestations_Types.RiskParameter',
      },
    ],
    stateMutability: 'view',
  },
  {
    /**
     * Event emitted when consensus is reached for data attestation
     * Contains the trader ID, epoch, and the consensus data record (merkle root)
     *
     * Indexed parameters (traderId, epoch) allow for efficient event filtering
     *
     * @event RecordedConsensusForData
     * @param {string} traderId - Unique identifier for the trader (indexed)
     * @param {string} epoch - Timestamp epoch (indexed)
     * @param {DataRecord} record - Consensus data record containing the merkle root
     */
    type: 'event',
    name: 'RecordedConsensusForData',
    inputs: [
      {
        name: 'traderId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'epoch',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'record',
        type: 'tuple',
        indexed: false,
        internalType: 'struct Attestations_Types.DataRecord',
        components: [
          {
            name: 'merkleRoot',
            type: 'bytes32',
            internalType: 'bytes32',
          },
        ],
      },
    ],
    anonymous: false, // Typically false for named events
  },
  {
    /**
     * Event emitted when consensus is reached for risk attestation
     * Contains the trader ID, epoch, parameter ID, risk group ID, and the consensus risk record (value)
     *
     * Indexed parameters (traderId, epoch, parameterId) allow for efficient event filtering
     *
     * @event RecordedConsensusForRisk
     * @param {string} traderId - Unique identifier for the trader (indexed)
     * @param {string} epoch - Timestamp epoch (indexed)
     * @param {string} parameterId - Identifier for the risk parameter (indexed)
     * @param {string} riskGroupId - Identifier for the risk group that reached consensus
     * @param {RiskRecord} record - Consensus risk record containing the value
     */
    type: 'event',
    name: 'RecordedConsensusForRisk',
    inputs: [
      {
        name: 'traderId',
        type: 'bytes32',
        indexed: true,
        internalType: 'bytes32',
      },
      {
        name: 'epoch',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'parameterId',
        type: 'uint256',
        indexed: true,
        internalType: 'uint256',
      },
      {
        name: 'riskGroupId',
        type: 'uint256',
        indexed: false, // riskGroupId is not indexed in the Solidity event definition
        internalType: 'uint256',
      },
      {
        name: 'record',
        type: 'tuple',
        indexed: false,
        internalType: 'struct Attestations_Types.RiskRecord',
        components: [
          {
            name: 'value',
            type: 'uint256',
            internalType: 'uint256',
          },
        ],
      },
    ],
    anonymous: false, // Typically false for named events
  },
];
