import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/system';
import { Analytics } from '@mui/icons-material';
import LabelTooltip from '@/shared/components/LabelTooltip';
import Skeleton from '@mui/material/Skeleton';

import { StyledIBMTypography } from './orderTable/util';

function PreTradeAnalyticsComponent({ data, loading, dataError }) {
  const theme = useTheme();

  const marketVolume = data.market_volume;

  const generatePredictedPov = () => {
    if (data.pov === null || data.pov === undefined) {
      return (
        <StyledIBMTypography color='text.secondary' style={{ display: 'inline' }}>
          N/A
        </StyledIBMTypography>
      );
    }
    let color;

    if (data.pov < 0.5) {
      color = theme.palette.success.main;
    } else if (data.pov < 1) {
      color = theme.palette.warning.main;
    } else {
      color = theme.palette.error.main;
    }

    return (
      <StyledIBMTypography color={color} style={{ display: 'inline' }}>
        {data.pov !== null ? Number(data.pov).toFixed(4) : null}%
      </StyledIBMTypography>
    );
  };

  // TODO: remove unused pov code
  const generateGuideline = () => {
    if (data.pov === null || data.pov === undefined) {
      return 'Fill in valid order parameters to see analytics.';
    }

    if (data.pov < 0.5) {
      return 'Minimum impact expected.';
    }
    if (data.pov < 1) {
      return 'Moderate impact expected, consider increasing duration or adding more venues.';
    }

    return 'High impact expected, increasing duration and adding more venues is recommended.';
  };

  const marketVolatilityTooltip = 'Expected price movement during order based on realized volatility.';

  const marketVolumeComponent = () => {
    let message = '';
    let color = '';
    let tag = '';

    if (marketVolume === null || marketVolume === undefined) {
      return (
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <LabelTooltip
            label='Market Volume'
            link='https://tread-labs.gitbook.io/api-docs/pre-trade-analytics'
            placement='left'
            title={
              <div>
                <Typography sx={{ marginBottom: 1.5 }}>
                  Shows market activity over the past 24 hours relative to expected seasonal volume.
                </Typography>
                <Typography>Market volume data not available.</Typography>
              </div>
            }
          />
          <StyledIBMTypography color='text.secondary' style={{ display: 'inline' }}>
            N/A
          </StyledIBMTypography>
        </Stack>
      );
    }

    if (marketVolume < 0.5) {
      message = 'Market volume is much lower than expected, trades may experience higher impact.';
      color = theme.palette.error.main;
      tag = 'Low';
    } else if (marketVolume < 0.75) {
      message = 'Market volume is lower than expected.';
      color = theme.palette.warning.main;
      tag = 'Below Average';
    } else if (marketVolume < 1) {
      message = 'Market volume is as expected.';
      color = theme.palette.text.primary;
      tag = 'Normal';
    } else if (marketVolume < 1.5) {
      message = 'Market volume is elevated, favorable market conditions.';
      color = theme.palette.success.main;
      tag = 'Above Average';
    } else {
      message =
        'Market volume is very elevated, favorable market conditions to trade quickly, ' +
        'but be mindful of volatility.';
      color = theme.palette.success.main;
      tag = 'High';
    }

    return (
      <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
        <LabelTooltip
          label='Market Volume'
          link='https://tread-labs.gitbook.io/api-docs/pre-trade-analytics'
          placement='left'
          title={
            <div>
              <Typography sx={{ marginBottom: 1.5 }}>
                Shows market activity over the past 24 hours relative to expected seasonal volume.
              </Typography>
              <Typography>{message}</Typography>
            </div>
          }
        />
        <StyledIBMTypography color={color} style={{ display: 'inline' }}>
          {tag} {marketVolume !== null ? Number(marketVolume).toFixed(2) : null}x
        </StyledIBMTypography>
      </Stack>
    );
  };

  const isDataAvailable = Object.keys(data).length > 0;

  const renderContent = () => {
    if (loading) {
      return (
        <Stack direction='column' spacing={1}>
          <Stack alignItems='center' direction='row' spacing={1}>
            <Analytics sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant='body1'>Pre-Trade Analytics</Typography>
          </Stack>
          <Stack direction='row' spacing={0} sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Participation Rate'
              link='https://tread-labs.gitbook.io/api-docs/pre-trade-analytics'
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Shows the proportion of the predicted market volume your order is expected to take up during its
                    duration.
                  </Typography>
                  <Typography>Loading...</Typography>
                </div>
              }
            />
            <Skeleton
              sx={{ fontSize: '1rem', lineHeight: 1, display: 'inline-block', verticalAlign: 'middle', margin: 0 }}
              variant='text'
              width={80}
            />
          </Stack>
          <Stack direction='row' spacing={0} sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Order Volatility'
              link='https://tread-labs.gitbook.io/api-docs/pre-trade-analytics'
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Expected price movement during order based on realized volatility.
                  </Typography>
                </div>
              }
            />
            <Skeleton
              sx={{ fontSize: '1rem', lineHeight: 1, display: 'inline-block', verticalAlign: 'middle', margin: 0 }}
              variant='text'
              width={80}
            />
          </Stack>
          <Stack direction='row' spacing={0} sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Market Volume'
              link='https://tread-labs.gitbook.io/api-docs/pre-trade-analytics'
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Shows market activity over the past 24 hours relative to expected seasonal volume.
                  </Typography>
                  <Typography>Loading...</Typography>
                </div>
              }
            />
            <Skeleton
              sx={{ fontSize: '1rem', lineHeight: 1, display: 'inline-block', verticalAlign: 'middle', margin: 0 }}
              variant='text'
              width={80}
            />
          </Stack>
        </Stack>
      );
    }

    const dataUnavailableMessage = () => {
      if (dataError) {
        return 'Market data unavailable for selected exchange and pair.';
      }

      return 'Input a valid order to view pre-trade analytics.';
    };

    if (!isDataAvailable) {
      return (
        <Stack direction='column' spacing={1}>
          <Stack alignItems='center' direction='row' spacing={1}>
            <Analytics sx={{ fontSize: '1rem', color: 'text.secondary' }} />
            <Typography variant='body1Strong'>Pre-Trade Analytics</Typography>
          </Stack>
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Participation Rate'
              link='https://tread-labs.gitbook.io/api-docs/pre-trade-analytics'
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Shows the proportion of the predicted market volume your order is expected to take up during its
                    duration.
                  </Typography>
                  <Typography>{dataUnavailableMessage()}</Typography>
                </div>
              }
            />
            <StyledIBMTypography color='text.secondary' style={{ display: 'inline' }}>
              -
            </StyledIBMTypography>
          </Stack>

          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Order Volatility'
              link='https://tread-labs.gitbook.io/api-docs/pre-trade-analytics'
              placement='left'
              title={
                <div>
                  <Typography>Expected price movement during order based on realized volatility.</Typography>
                </div>
              }
            />
            <StyledIBMTypography color='text.secondary' style={{ display: 'inline' }}>
              -
            </StyledIBMTypography>
          </Stack>
          <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
            <LabelTooltip
              label='Market Volume'
              link='https://tread-labs.gitbook.io/api-docs/pre-trade-analytics'
              placement='left'
              title={
                <div>
                  <Typography sx={{ marginBottom: 1.5 }}>
                    Shows market activity over the past 24 hours relative to expected seasonal volume.
                  </Typography>
                  <Typography>{dataUnavailableMessage()}</Typography>
                </div>
              }
            />
            <StyledIBMTypography color='text.secondary' style={{ display: 'inline' }}>
              -
            </StyledIBMTypography>
          </Stack>
        </Stack>
      );
    }

    return (
      <Stack direction='column' spacing={1}>
        <Stack alignItems='center' direction='row' spacing={1}>
          <Analytics sx={{ fontSize: '1rem', color: 'text.secondary' }} />
          <Typography variant='body1'>Pre-Trade Analytics</Typography>
        </Stack>
        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <LabelTooltip
            label='Participation Rate'
            link='https://tread-labs.gitbook.io/api-docs/pre-trade-analytics'
            placement='left'
            title={
              <div>
                <Typography sx={{ marginBottom: 1.5 }}>
                  Shows the proportion of the predicted market volume your order is expected to take up during its
                  duration.
                </Typography>
                <Typography>{generateGuideline()}</Typography>
              </div>
            }
          />
          {generatePredictedPov()}
        </Stack>

        <Stack direction='row' sx={{ justifyContent: 'space-between' }}>
          <LabelTooltip
            label='Order Volatility'
            link='https://tread-labs.gitbook.io/api-docs/pre-trade-analytics'
            placement='left'
            title={
              <div>
                <Typography>{marketVolatilityTooltip}</Typography>
              </div>
            }
          />
          <StyledIBMTypography
            color={data.volatility !== null && data.volatility !== undefined ? 'text.primary' : 'text.secondary'}
            style={{ display: 'inline' }}
          >
            &plusmn;
            {data.volatility !== null && data.volatility !== undefined ? Number(data.volatility).toFixed(4) : 'N/A'}%
          </StyledIBMTypography>
        </Stack>
        {marketVolumeComponent()}
      </Stack>
    );
  };

  return (
    <Paper elevation={1} sx={{ py: 1, px: 2, bgcolor: theme.palette.background.card }}>
      {renderContent()}
    </Paper>
  );
}

export default PreTradeAnalyticsComponent;
