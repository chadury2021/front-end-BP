import { NumericFormatCustom } from '@/shared/fields/NumberFieldFormat';
import { StrategyParamSelect } from '@/shared/fields/StrategyParamSelect';
import { TreadTooltip } from '@/shared/components/LabelTooltip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { ignoreScrollEvent } from '../../../util';
import BorderedStack from './AlgoOrderFieldsComponents/BorderedStack';

const expiries = [
  { seconds: 60, display: '1 minute' },
  { seconds: 120, display: '2 minutes' },
  { seconds: 300, display: '5 minutes' },
  { seconds: 600, display: '10 minutes' },
  { seconds: 900, display: '15 minutes' },
  { seconds: 1800, display: '30 minutes' },
  { seconds: 3600, display: '1 hour' },
  { seconds: 10800, display: '3 hours' },
  { seconds: 21600, display: '6 hours' },
  { seconds: 43200, display: '12 hours' },
  { seconds: 86400, display: '1 day' },
  { seconds: 432000, display: '5 days' },
];

const slices = [2, 5, 10, 20, 50, 100];

function SimpleOrderFields({
  orderSlices,
  selectedAccountExchangeNames,
  selectedDuration,
  selectedStrategyParams,
  selectedStrategy,
  selectedStrategyName,
  setOrderSlices,
  setSelectedDuration,
  setSelectedStrategyParams,
  setStopPrice,
  showSlices,
  stopPrice,
  strategyParams,
}) {
  const theme = useTheme();

  const handleStrategyParamChange = (event) => {
    setSelectedStrategyParams({
      ...selectedStrategyParams,
      [event.target.name]: event.target.checked,
    });
  };

  const noArrowStyle = {
    '& input::-webkit-outer-spin-button, input::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    'input[type=number]': {
      MozAppearance: 'textfield',
    },
  };

  const setDefaultParams = () => {
    // Reset strategy params to default values
    setSelectedStrategyParams({});
  };

  return (
    <Grid container spacing={4}>
      {selectedStrategyName !== 'Market' && (
        <Grid xs={showSlices ? 6 : 12}>
          <FormControl fullWidth>
            <InputLabel id='select-expiry-dropdown-label'>Expiry</InputLabel>
            <Select
              id='select-expiry-dropdown'
              label='Expiry'
              labelId='select-expiry-dropdown-label'
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: `${theme.palette.background.container}40`, // 25% opacity - much more transparent
                    backdropFilter: 'blur(15px)',
                    border: 'none',
                    borderRadius: 0,
                    boxShadow: 'none',
                    '& .MuiMenuItem-root': {
                      backgroundColor: 'transparent',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: `${theme.palette.action.hover}80`, // 50% opacity
                      },
                      '&.Mui-selected': {
                        backgroundColor: `${theme.palette.primary.main}40`, // 25% opacity
                        '&:hover': {
                          backgroundColor: `${theme.palette.primary.main}60`, // 37% opacity
                        },
                      },
                    },
                  },
                },
              }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              }}
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
            >
              {expiries.map((expiry) => (
                <MenuItem key={expiry.seconds} value={expiry.seconds}>
                  {expiry.display}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}

      {showSlices && (
        <Grid xs={selectedStrategyName === 'Market' ? 12 : 6}>
          <FormControl fullWidth>
            <InputLabel id='select-slices-dropdown-label'>Slices</InputLabel>
            <Select
              id='select-slices-dropdown'
              label='Slices'
              labelId='select-slices-dropdown-label'
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: `${theme.palette.background.container}40`, // 25% opacity - much more transparent
                    backdropFilter: 'blur(15px)',
                    border: 'none',
                    borderRadius: 0,
                    boxShadow: 'none',
                    '& .MuiMenuItem-root': {
                      backgroundColor: 'transparent',
                      color: theme.palette.text.primary,
                      '&:hover': {
                        backgroundColor: `${theme.palette.action.hover}80`, // 50% opacity
                      },
                      '&.Mui-selected': {
                        backgroundColor: `${theme.palette.primary.main}40`, // 25% opacity
                        '&:hover': {
                          backgroundColor: `${theme.palette.primary.main}60`, // 37% opacity
                        },
                      },
                    },
                  },
                },
              }}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  border: 'none',
                },
              }}
              value={orderSlices}
              onChange={(e) => setOrderSlices(e.target.value)}
            >
              {slices.map((slice) => (
                <MenuItem key={slice} value={slice}>
                  {slice}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
      )}

      <Grid xs={12}>
        <BorderedStack spacing={1} title={<TreadTooltip variant='strategy_parameters' />}>
          <Stack alignItems='flex-end' direction='row' justifyContent='space-between'>
            <StrategyParamSelect
              isSimple
              handleStrategyParamChange={handleStrategyParamChange}
              selectedAccountExchangeNames={selectedAccountExchangeNames}
              selectedStrategyName={selectedStrategyName}
              selectedStrategyParams={selectedStrategyParams}
              showHeading={false}
              strategyParams={strategyParams}
            />
            <Button sx={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => setDefaultParams()}>
              <Typography color='primary'>Reset Default</Typography>
            </Button>
          </Stack>
        </BorderedStack>
      </Grid>
    </Grid>
  );
}

export default SimpleOrderFields;
