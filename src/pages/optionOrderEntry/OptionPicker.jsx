import React, { useState, useEffect } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { useAtom } from 'jotai';

export default function OptionPicker({ FormAtoms }) {
  const [initialLoadValue] = useAtom(FormAtoms.initialLoadValueAtom);
  const [selectedPair, setSelectedPair] = useAtom(FormAtoms.selectedPairAtom);
  const [selectedAccounts, setSelectedAccounts] = useAtom(FormAtoms.selectedAccountsAtom);

  const [optionsMap, setOptionsMap] = useState([]);

  const { options, accounts, flat_options } = initialLoadValue;

  // Decoupled option form from option grid
  useEffect(() => {
    if (selectedAccounts[0]) {
      if (!flat_options[accounts[selectedAccounts[0]].exchangeName]) {
        setOptionsMap({});
      } else {
        setOptionsMap(flat_options[accounts[selectedAccounts[0]].exchangeName]);
      }
    }
  }, [selectedAccounts]);

  return (
    <Autocomplete
      disablePortal
      disabled={!optionsMap || !Object.keys(optionsMap).length > 0 || !selectedAccounts[0]}
      getOptionLabel={(option) => (option ? option.name : '')}
      isOptionEqualToValue={(option, value) => option.name === value}
      options={optionsMap}
      renderInput={(params) => {
        return <TextField {...params} label='Pair' />;
      }}
      value={selectedPair}
      onChange={(e, newValue) => {
        setSelectedPair(newValue);
      }}
    />
  );
}
