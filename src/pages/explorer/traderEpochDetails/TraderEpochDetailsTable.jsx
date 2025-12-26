import { Box, Paper, Skeleton, Stack, Typography, Tabs, Tab, Divider } from '@mui/material';
import { useState, useEffect } from 'react';
import ConsensusInfoSection from './ConsensusInfoSection';
import TradeHistoryTable from './TradeHistoryTable';
import AggregatedMetricsCard from './AggregatedMetricsCard';

export function TraderEpochDetailsTableSkeleton() {
  return (
    <Stack spacing={4} sx={{ width: '100%' }}>
      <Skeleton animation='wave' height={250} variant='rounded' />
      <Skeleton animation='wave' height={250} variant='rounded' />
    </Stack>
  );
}

const DATA_PARAMETERS = {
  0: { title: 'Trades' },
  1: { title: 'Balances' },
  2: { title: 'Prices' },
};
/**
 * Component that displays detailed information about a trader's epoch, including data and risk attestation events.
 * Shows transaction hashes and detailed event data if the user is authorized to view it.
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.traderId - ID of the trader to display details for
 * @param {number|string} props.epoch - Epoch number to display details for
 * @param {Object} props.events - Events (risk, data, consensus risk, consensus data) to display details for
 * @returns {React.ReactElement} Card containing trader epoch details or error message
 */
export default function TraderEpochDetailsTable({ traderId, epoch, events }) {
  const [activeTab, setActiveTab] = useState(0);
  const [recordCounts, setRecordCounts] = useState({ 0: 0, 1: 0, 2: 0 });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleRecordCountUpdate = (parameterId, count) => {
    setRecordCounts((prev) => ({
      ...prev,
      [parameterId]: count,
    }));
  };

  return (
    <Stack spacing={4} sx={{ width: '100%' }}>
      <AggregatedMetricsCard
        epoch={epoch}
        riskConsensus={events.riskConsensus}
        riskEvents={events.attestedRiskEvents}
        traderId={traderId}
      />

      {/* Tokenized Data Section with Tabs */}
      <Paper elevation={0}>
        <Box sx={{ px: 8, py: 0 }}>
          <Tabs value={activeTab} onChange={handleTabChange}>
            {Object.keys(DATA_PARAMETERS).map((pid) => {
              const pidNumber = Number(pid);
              const { title } = DATA_PARAMETERS[pidNumber];
              const count = recordCounts[pidNumber];

              return <Tab key={pid} label={`${title} (${count})`} />;
            })}
          </Tabs>

          {Object.keys(DATA_PARAMETERS).map((pid, index) => {
            const pidNumber = Number(pid);
            const { title } = DATA_PARAMETERS[pidNumber];
            const cid = events.cidsByParameterId[pidNumber];
            const tradeAttestedDataEvents = events.attestedDataEvents.filter(
              (event) => event.parameterId === pidNumber
            );
            const dataConsensus = events.dataConsensus[pidNumber];

            return (
              <Box
                hidden={activeTab !== index}
                key={pid}
                role='tabpanel'
                sx={{
                  display: activeTab === index ? 'block' : 'none',
                }}
              >
                <ConsensusInfoSection
                  hideTitle
                  attestedDataEvents={tradeAttestedDataEvents}
                  dataConsensus={dataConsensus}
                  epoch={epoch}
                  traderId={traderId}
                />
                <Box sx={{ mt: 4, mb: 4 }}>
                  {cid && (
                    <TradeHistoryTable
                      hideTitle
                      cid={cid}
                      parameterId={pidNumber}
                      traderId={traderId}
                      onRecordCountUpdate={(count) => handleRecordCountUpdate(pidNumber, count)}
                    />
                  )}
                  {!cid && (
                    <Typography color='text.secondary' sx={{ textAlign: 'center', py: 4 }} variant='body2'>
                      No {title.toLowerCase()} data available for this epoch
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      </Paper>
    </Stack>
  );
}
