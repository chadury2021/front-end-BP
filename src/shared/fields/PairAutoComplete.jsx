import Autocomplete from '@mui/material/Autocomplete';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Divider from '@mui/material/Divider';
import { matchSorter } from 'match-sorter';
import React, { useState } from 'react';
import { useTheme } from '@emotion/react';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import moment from 'moment';

const filterOptions = (options, { inputValue }) => matchSorter(options, inputValue, { keys: ['id'] });

function CustomPaper(props) {
  return <Paper {...props} style={{ width: 250 }} />;
}

function normalizePairs(pairs) {
  const uniquePairs = {};

  pairs.forEach((pair) => {
    const normalizedName = pair.id.includes('FUTURE') ? pair.id.replace(/_\d{4}\.\d{2}\.\d{2}/, '') : pair.id;

    if (uniquePairs[normalizedName]) {
      return;
    }

    uniquePairs[normalizedName] = {
      ...pair,
      id: normalizedName,
      label: normalizedName,
    };
  });

  return Object.values(uniquePairs); // Convert back to array if needed
}

const formatDate = (date) => {
  const [year, month, day] = date.split('-');
  return `${year}.${month}.${day}`;
};

export function ControlledPairAutoComplete({ tokenPairs, setSelectedPair, selectedPair }) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const theme = useTheme();

  const handleSelect = (event, newValue) => {
    setSelectedPair(newValue);
    if (newValue && newValue.id.includes('FUTURE')) {
      setDatePickerOpen(true);
    }
  };

  const handleDateClick = (date) => {
    const datedName = selectedPair.id.replace('FUTURE', `FUTURE_${formatDate(date)}`);
    const datedPair = { ...selectedPair, id: datedName, label: datedName };

    setSelectedPair(datedPair);
    setDatePickerOpen(false);
  };

  const handleCloseDatePicker = () => {
    if (selectedPair && selectedPair.id.includes('FUTURE') && !selectedPair.id.includes('.')) {
      setSelectedPair(''); // reset selected pair if no date was selected
    }

    setDatePickerOpen(false);
  };

  const normalizedPairs = normalizePairs(tokenPairs);

  function extractDates(pairName) {
    const [prefix, suffix] = pairName.split('-');
    // eslint-disable-next-line no-useless-escape
    const regex = new RegExp(`${prefix}_(\\d{4}\.\\d{2}\.\\d{2})-${suffix}`);
    return tokenPairs
      .map((pair) => {
        const match = pair.id.match(regex);
        return match ? match[1].replaceAll('.', '-') : null;
      })
      .filter((date) => date !== null); // Filter out null values
  }

  const allowedDates = selectedPair ? extractDates(selectedPair.id) : [];

  return (
    <>
      <Autocomplete
        fullWidth
        disablePortal={false}
        filterOptions={filterOptions}
        isOptionEqualToValue={(option, value) => {
          return option.id === value;
        }}
        options={normalizedPairs}
        PaperComponent={CustomPaper}
        renderInput={(params) => <TextField {...params} label='Trading Pair' />}
        value={selectedPair ? selectedPair.label : null}
        onChange={handleSelect}
      />
      <Dialog
        open={datePickerOpen}
        PaperProps={{
          sx: {
            position: 'absolute', // Needed to position the dialog
            top: '15%', // Distance from the top of the screen
            left: '10%', // Distance from the left of the screen
            // transform: 'translate(-10%, -10%)' // Adjusts the dialog position relative to the top and left
          },
        }}
        onClose={handleCloseDatePicker}
      >
        <DialogTitle sx={{ fontSize: '1.3rem', marginLeft: '20px', paddingX: '8px' }}>Expiry Date</DialogTitle>
        <Divider />
        <DialogContent sx={{ paddingTop: '0px', paddingX: '8px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '10px',
              padding: '20px',
            }}
          >
            {allowedDates.map((date) => (
              <Button
                color='info2'
                key={date}
                sx={{ borderWidth: 2 }}
                variant='outlined'
                onClick={() => handleDateClick(date)}
              >
                <Stack flexDirection='column'>
                  <Typography fontWeight='bold'>{moment(date).format('D')}</Typography>
                  <Typography>{moment(date).format('MMM')}</Typography>
                  <Typography>{moment(date).format('YY')}</Typography>
                </Stack>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function PairAutoComplete({ tokenPairs, handleSelectedPair, selectedPair }) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedNonDatedPair, setSelectedNonDatedPair] = useState('');
  const theme = useTheme();

  const handleSelect = (event, newValue) => {
    if (newValue && newValue.id.includes('FUTURE')) {
      setSelectedNonDatedPair(newValue);
      setDatePickerOpen(true);
      return;
    }
    // trigger parent callback
    handleSelectedPair(newValue);
  };

  const handleDateClick = (date) => {
    const datedName = selectedNonDatedPair.id.replace('FUTURE', `FUTURE_${formatDate(date)}`);

    const datedPair = {
      ...selectedPair,
      id: datedName,
      label: datedName,
      base: selectedNonDatedPair.base,
      quote: datedName.split('-')[1],
      is_contract: true,
      is_inverse: true, // IMPORTANT: Assumes all dated futures are inverse
    };

    handleSelectedPair(datedPair);
    setDatePickerOpen(false);
  };

  const handleCloseDatePicker = () => {
    if (selectedNonDatedPair && selectedNonDatedPair.id.includes('FUTURE') && !selectedNonDatedPair.id.includes('.')) {
      handleSelectedPair(''); // reset selected pair if no date was selected
    }
    setSelectedNonDatedPair('');
    setDatePickerOpen(false);
  };

  const normalizedPairs = normalizePairs(tokenPairs);

  function extractDates(pairName) {
    const [prefix, suffix] = pairName.split('-');
    // eslint-disable-next-line no-useless-escape
    const regex = new RegExp(`${prefix}_(\\d{4}\.\\d{2}\.\\d{2})-${suffix}`);

    return tokenPairs
      .map((pair) => {
        const match = pair.id.match(regex);
        return match ? match[1].replaceAll('.', '-') : null;
      })
      .filter((date) => date !== null); // Filter out null values
  }

  const allowedDates = selectedNonDatedPair ? extractDates(selectedNonDatedPair.id) : [];

  return (
    <>
      <Autocomplete
        fullWidth
        disablePortal={false}
        filterOptions={filterOptions}
        isOptionEqualToValue={(option, value) => {
          return option.id === value;
        }}
        options={normalizedPairs}
        PaperComponent={CustomPaper}
        renderInput={(params) => <TextField {...params} label='Trading Pair' />}
        value={selectedPair ? selectedPair.label : null}
        onChange={handleSelect}
      />
      <Dialog
        open={datePickerOpen}
        PaperProps={{
          sx: {
            position: 'absolute', // Needed to position the dialog
            top: '15%', // Distance from the top of the screen
            left: '10%', // Distance from the left of the screen
            // transform: 'translate(-10%, -10%)' // Adjusts the dialog position relative to the top and left
          },
        }}
        onClose={handleCloseDatePicker}
      >
        <DialogTitle sx={{ fontSize: '1.3rem', marginLeft: '20px', paddingX: '8px' }}>Expiry Date</DialogTitle>
        <Divider />
        <DialogContent sx={{ paddingTop: '0px', paddingX: '8px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '10px',
              padding: '20px',
            }}
          >
            {allowedDates.map((date) => (
              <Button
                color='info2'
                key={date}
                sx={{ borderWidth: 2 }}
                variant='outlined'
                onClick={() => handleDateClick(date)}
              >
                <Stack flexDirection='column'>
                  <Typography fontWeight='bold'>{moment(date).format('D')}</Typography>
                  <Typography>{moment(date).format('MMM')}</Typography>
                  <Typography>{moment(date).format('YY')}</Typography>
                </Stack>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
