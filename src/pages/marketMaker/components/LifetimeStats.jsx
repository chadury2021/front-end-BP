import React, { useMemo, useState } from 'react';
import { Paper, Stack, Typography, IconButton, Tooltip } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import ShareIcon from '@mui/icons-material/Share';
import LabelTooltip from '@/shared/components/LabelTooltip';
import { StyledIBMTypography } from '@/shared/orderTable/util';
import { msAndKs } from '@/util';
import { useToast } from '@/shared/context/ToastProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import LifetimeShareableModal from './LifetimeShareableModal';

export default function LifetimeStats({ lifetime }) {
  const { showToastMessage } = useToast();
  const { referralCode } = useUserMetadata();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const lifetimeStats = useMemo(() => {
    const totalVolume = parseFloat(lifetime?.executed_notional || 0);
    const totalFees = parseFloat(lifetime?.fees || 0);

    // Net PnL = sum of all net fees (same as total fees)
    const netPnL = totalFees;
    const netPnLPercentage = totalVolume > 0 ? (netPnL / totalVolume) * 100 : 0;

    return {
      netPnL,
      netPnLPercentage,
      totalVolume,
    };
  }, [lifetime]);

  const netFeesColor = useMemo(() => {
    if (lifetimeStats.netPnL === 0) return 'text.secondary';
    return lifetimeStats.netPnL >= 0 ? 'text.primary' : 'success.main';
  }, [lifetimeStats.netPnL]);

  const handleShareClick = () => {
    setShareModalOpen(true);
  };

  const lifetimeData = useMemo(() => {
    return {
      volume: lifetimeStats.totalVolume,
      netFees: lifetimeStats.netPnL,
      referralCode: referralCode || '',
    };
  }, [lifetimeStats.totalVolume, lifetimeStats.netPnL, referralCode]);

  return (
    <>
      <Paper
        elevation={1}
        sx={{
          pt: 1,
          pb: 1,
          px: 2,
          backgroundColor: 'transparent',
          backdropFilter: 'blur(5px)',
          position: 'relative',
        }}
      >
        <Tooltip title='Share Lifetime Summary'>
          <IconButton
            size='small'
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              color: 'text.secondary',
              padding: 0.5,
              '&:hover': {
                color: 'primary.main',
                backgroundColor: 'action.hover',
              },
            }}
            onClick={handleShareClick}
          >
            <ShareIcon sx={{ fontSize: '0.875rem' }} />
          </IconButton>
        </Tooltip>
        <Stack direction='column' spacing={1}>
          <Stack alignItems='center' direction='row' spacing={1}>
            <SmartToyIcon sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant='body1'>Lifetime Summary</Typography>
          </Stack>

        <Stack direction='column' spacing={1}>
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Volume'
              link=''
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Total executed volume across all MM Bot orders.
                  </Typography>
                </div>
              }
            />
            <StyledIBMTypography
              color={lifetimeStats.totalVolume > 0 ? 'text.primary' : 'text.secondary'}
              style={{ display: 'inline' }}
              variant='body2'
            >
              {lifetimeStats.totalVolume > 0 ? `$${msAndKs(lifetimeStats.totalVolume, 2)}` : '-'}
            </StyledIBMTypography>
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Net Fees'
              link=''
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>Sum of all net fees across all MM Bot orders.</Typography>
                </div>
              }
            />
            <StyledIBMTypography color={netFeesColor} style={{ display: 'inline' }} variant='body2'>
              {lifetimeStats.netPnL !== 0 ? `$${msAndKs(lifetimeStats.netPnL, 2)}` : '-'}
            </StyledIBMTypography>
          </Stack>
        </Stack>
      </Stack>
    </Paper>

    <LifetimeShareableModal
      lifetimeData={lifetimeData}
      open={shareModalOpen}
      showAlert={(alert) => {
        showToastMessage({
          type: alert.severity || 'info',
          message: alert.message,
        });
      }}
      onClose={() => {
        setShareModalOpen(false);
      }}
    />
    </>
  );
}
