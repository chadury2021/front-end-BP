import { abis } from '@/pages/explorer/proofUtils/ProofAbis';
import {
  createEmptyEvent,
  fetchDataGroup,
  fetchDataRecord,
  fetchRiskGroup,
  fetchRiskRecord,
  formatRiskEvent,
  formatTradeEvent,
} from '@/pages/explorer/proofUtils/ProofFetchers';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { ethers } from 'ethers';
import { useContext, useEffect, useState } from 'react';

function proofCacheKey(id) {
  return `proof_${id}`;
}

/**
 * Hook to fetch and cache proof details from the blockchain
 * @param {string} id - Transaction ID to fetch
 * @param {Object} config - Configuration object containing RPC and contract details
 * @returns {Object} Object containing:
 *   @property {Object} proofData - Formatted event data with:
 *     - For AttestedToData events: merkleRoot and CID
 *     - For AttestedToRisk events: risk value
 *   @property {Object} eventData - Raw event log data containing:
 *     - For AttestedToData: {traderId: bytes32, epoch: uint256, attester: address, record: {merkleRoot: bytes32, cid: string}}
 *     - For AttestedToRisk: {traderId: bytes32, epoch: uint256, parameterId: uint256, attester: address, record: {value: uint256}}
 *   @property {Object} dataConsensus - Consensus data for trade records containing:
 *     - record: {merkleRoot: bytes32}
 *     - hasConsensus: boolean
 *   @property {Object} riskConsensus - Consensus data for risk records containing:
 *     - record: {value: uint256}
 *     - hasConsensus: boolean
 *   @property {Object} dataGroup - Data group parameters containing:
 *     - threshold: number
 *     - members: string[]
 *   @property {Object} riskGroup - Risk group parameters containing:
 *     - threshold: number
 *     - members: string[]
 *   @property {boolean} loading - Loading state indicator
 */
function useProofDetails(id, config) {
  const [proofData, setProofData] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [dataConsensus, setDataConsensus] = useState(null);
  const [riskConsensus, setRiskConsensus] = useState(null);
  const [dataGroup, setDataGroup] = useState(null);
  const [riskGroup, setRiskGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cache, setCache] = useState({});
  const { showAlert } = useContext(ErrorContext);

  useEffect(() => {
    const cacheKey = proofCacheKey(id);

    if (cache[cacheKey]) {
      setProofData(cache[cacheKey].proofData);
      setEventData(cache[cacheKey].eventData);
      setDataConsensus(cache[cacheKey].dataConsensus);
      setRiskConsensus(cache[cacheKey].riskConsensus);
      setDataGroup(cache[cacheKey].dataGroup);
      setRiskGroup(cache[cacheKey].riskGroup);
      setLoading(false);
      return;
    }

    const fetchProofData = async ({ rpcUrl, attestationAddress }) => {
      setLoading(true);

      try {
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const contract = new ethers.Contract(attestationAddress, abis, provider);

        const receipt = await provider.getTransactionReceipt(id);
        if (!receipt) throw new Error('Transaction not found');

        const parsedLogs = receipt.logs
          .map((log) => {
            try {
              return contract.interface.parseLog(log);
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean);

        if (parsedLogs.length === 0) throw new Error('No event found');

        const eventLog = parsedLogs[0];
        let formattedEvent;
        let consensusData = null;
        let riskData = null;
        let dataGroupData = null;
        let riskGroupData = null;

        // Fetch group data regardless of event type
        try {
          dataGroupData = await fetchDataGroup(config);
        } catch (err) {
          console.error('Failed to fetch data group:', err);
        }

        if (eventLog.name === 'AttestedToData') {
          formattedEvent = formatTradeEvent({
            ...eventLog,
            transactionHash: id,
            blockNumber: receipt.blockNumber,
          });

          // Fetch data consensus
          consensusData = await fetchDataRecord(
            config,
            formattedEvent.traderId,
            formattedEvent.epoch,
            formattedEvent.parameterId
          );
        } else if (eventLog.name === 'AttestedToRisk') {
          formattedEvent = formatRiskEvent({
            ...eventLog,
            transactionHash: id,
            blockNumber: receipt.blockNumber,
          });

          // Fetch risk consensus
          riskData = await fetchRiskRecord(
            config,
            formattedEvent.traderId,
            formattedEvent.epoch,
            formattedEvent.parameterId
          );

          // Fetch risk group data
          try {
            // Default to risk group ID 1, can be made dynamic if needed
            const riskGroupId = 1;
            riskGroupData = await fetchRiskGroup(config, riskGroupId);
          } catch (err) {
            console.error('Failed to fetch risk group:', err);
          }
        }

        setCache((prev) => ({
          ...prev,
          [cacheKey]: {
            proofData: formattedEvent,
            eventData: eventLog,
            dataConsensus: consensusData,
            riskConsensus: riskData,
            dataGroup: dataGroupData,
            riskGroup: riskGroupData,
          },
        }));

        setProofData(formattedEvent);
        setEventData(eventLog);
        setDataConsensus(consensusData);
        setRiskConsensus(riskData);
        setDataGroup(dataGroupData);
        setRiskGroup(riskGroupData);
      } catch (err) {
        const emptyEvent = createEmptyEvent();
        setProofData(emptyEvent);
        setCache((prev) => ({
          ...prev,
          [cacheKey]: {
            proofData: emptyEvent,
            eventData: null,
            dataConsensus: null,
            riskConsensus: null,
            dataGroup: null,
            riskGroup: null,
          },
        }));
        showAlert({
          severity: 'error',
          message: err.message || 'Failed to fetch details',
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProofData(config);
  }, [id, config]);

  return {
    proofData,
    eventData,
    dataConsensus,
    riskConsensus,
    dataGroup,
    riskGroup,
    loading,
  };
}

export default useProofDetails;
