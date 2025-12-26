import { useTheme } from '@emotion/react';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import CardContent from '@mui/material/CardContent';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useAtom } from 'jotai';
import React, { useContext, useEffect, useState } from 'react';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { Loader } from '@/shared/Loader';
import { getOptionData, getPairPrice } from '../../apiServices';
import { ErrorContext } from '../../shared/context/ErrorProvider';
import {
  StyledHeaderTableCell,
  StyledHeaderTableCellWithLine,
  StyledStrikeTableCell,
} from '../../shared/orderTable/util';
import { exchangeQuoteMapping, FocusableDivider, displayColorTableCell, displayDefaultTableCell } from './util';
import { useRealTimeOptionTickers } from './hooks/RealTimeOptionTickerWS';

const COLUMNS = {
  columns: [
    {
      id: 'bid',
      ivid: 'bidIV',
      label: 'Bid / IV',
      minWidth: 80,
      align: 'right',
    },
    {
      id: 'mark',
      ivid: 'markIV',
      label: 'Mark / IV',
      minWidth: 80,
      align: 'right',
    },
    {
      id: 'ask',
      ivid: 'askIV',
      label: 'Ask / IV',
      minWidth: 80,
      align: 'right',
    },
    {
      id: 'delta',
      label: 'Delta',
      minWidth: 30,
      align: 'right',
    },
    {
      id: 'theta',
      label: 'Theta',
      minWidth: 30,
      align: 'right',
    },
    {
      id: 'gamma',
      label: 'Gamma',
      minWidth: 30,
      align: 'right',
    },
    { id: 'vega', label: 'Vega', minWidth: 30, align: 'right' },
  ],
  strikeColumn: {
    id: 'strike',
    label: 'Strike',
    minWidth: 30,
    align: 'center',
    format: (val) => (Number(val) < 10 ? Number(val).toFixed(3) : Number(val).toFixed(0)),
  },
};

function DisplayRow({ columns, row, rowOnClick, pairPrice, theme, extraTickerData }) {
  let backgroundColor = theme.palette.options.default;
  if (row.type === 'P' && row.strike > pairPrice) {
    backgroundColor = theme.palette.options.put;
  } else if (row.type === 'C' && row.strike < pairPrice) {
    backgroundColor = theme.palette.options.call;
  }

  const tickerData = extraTickerData?.[row.instrument_name] || {};

  const key = `${row.underlying}-${row.expiry}-${row.strike}-${row.type}`;
  return (
    <TableRow
      key={key}
      style={{ backgroundColor }}
      onClick={() => rowOnClick(row)}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = theme.palette.options.highlight;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = backgroundColor;
      }}
    >
      {columns.map((column) => {
        if (column.id === 'ask') {
          return displayColorTableCell(
            column,
            row[column.id] || tickerData?.best_ask_price,
            row[column.ivid] || tickerData?.ask_iv,
            {
              minWidth: column.minWidth,
              width: column.width || undefined,
              backgroundColor: 'inherit', // Inherit background color from TableRow
            },
            theme.palette.options.ask,
            theme.palette.grey.light
          );
        }
        if (column.id === 'bid') {
          return displayColorTableCell(
            column,
            row[column.id] || tickerData?.best_bid_price,
            row[column.ivid] || tickerData?.bid_iv,
            {
              minWidth: column.minWidth,
              width: column.width || undefined,
              backgroundColor: 'inherit', // Inherit background color from TableRow
            },
            theme.palette.options.bid,
            theme.palette.grey.light
          );
        }
        if (column.id === 'mark') {
          return displayColorTableCell(
            column,
            row[column.id] || tickerData?.mark_price,
            row[column.ivid] || tickerData?.mark_iv,
            {
              minWidth: column.minWidth,
              width: column.width || undefined,
              backgroundColor: 'inherit', // Inherit background color from TableRow
            },
            theme.palette.text.primary,
            theme.palette.grey.light
          );
        }

        let value = row[column.id];
        if (column.id === 'delta') {
          value ||= tickerData?.greeks?.delta;
        } else if (column.id === 'theta') {
          value ||= tickerData?.greeks?.theta;
        } else if (column.id === 'gamma') {
          value ||= tickerData?.greeks?.gamma;
        } else if (column.id === 'vega') {
          value ||= tickerData?.greeks?.vega;
        }

        return displayDefaultTableCell(column, value, {
          minWidth: column.minWidth,
          width: column.width || undefined,
          backgroundColor: 'inherit', // Inherit background color from TableRow
        });
      })}
    </TableRow>
  );
}

const sortDateOptions = (dateOptionsToSort) => {
  return Object.keys(dateOptionsToSort).sort((a, b) => {
    // Convert the date strings to Date objects
    const dateA = new Date(a.replace(/\./g, '-'));
    const dateB = new Date(b.replace(/\./g, '-'));

    // Compare the Date objects
    return dateA - dateB;
  });
};

function OptionPriceChart({ FormAtoms }) {
  const theme = useTheme();
  const { isDev } = useUserMetadata();

  const [loading, setLoading] = useState(true);

  const [selectedPair, setSelectedPair] = useAtom(FormAtoms.selectedPairAtom);
  const [initialLoadValue] = useAtom(FormAtoms.initialLoadValueAtom);
  const [optionData, setOptionData] = useAtom(FormAtoms.optionDataAtom);

  const [optionBaseValue, setOptionBaseValue] = useState('');
  const [optionDateValue, setOptionDateValue] = useState('');

  const [pairPrice, setPairPrice] = useState(null);
  const [pairPriceLoading, setPairPriceLoading] = useState(false);

  const [dateOptions, setDateOptions] = useState([]);
  const validExchanges = ['Binance', 'OKX', 'Deribit'];

  const [exchangeName, setExchangeName] = useState(validExchanges[1]);

  const { showAlert } = useContext(ErrorContext);

  const { columns, strikeColumn } = COLUMNS;

  const { options } = initialLoadValue;

  const [instrumentNames, setInstrumentNames] = useState([]);
  const { tickerData } = useRealTimeOptionTickers({
    instrumentNames,
    exchangeName,
    isTestnet: isDev,
  });

  const getUnderlyingPrice = async (base) => {
    setPairPriceLoading(true);

    const exchangeQuote = exchangeQuoteMapping[exchangeName];
    const baseQuote = `${base}-${exchangeQuote}`;

    try {
      const result = await getPairPrice(baseQuote, exchangeName);
      setPairPrice(result[baseQuote]);
      setPairPriceLoading(false);
      return result[baseQuote];
    } catch (e) {
      showAlert({
        message: `Could not retrieve underlying price: ${e}`,
        severity: 'error',
      });
      setPairPriceLoading(false);
    }
    return null;
  };

  const flatData = (data) => {
    return Object.values(data).map((x) => {
      if (x[0].type === 'C' && x[1].type === 'P') {
        return [x[0], x[1]];
      }
      return [x[1], x[0]];
    });
  };

  const loadOptionData = async (exchange, underlying, date) => {
    if (!underlying || !date) {
      return;
    }

    let data;
    setLoading(true);
    try {
      data = await getOptionData(exchange, underlying, date);

      // If it's Deribit, set up WebSocket subscriptions
      if (exchange === 'Deribit') {
        // Extract instrument names from the data
        const names = Object.values(data)
          .flat()
          .map((option) => option.instrument_name);
        setInstrumentNames(names);

        // Deribit provides the underlying price in the option ticker data
        const allOptions = Object.values(data).flat();
        const optionWithPrice = allOptions.find((option) => option?.underlying_price);
        if (optionWithPrice) {
          setPairPrice(optionWithPrice.underlying_price);
        }
      }
    } catch (e) {
      showAlert({
        message: `Could not retrieve option data: ${e}`,
        severity: 'error',
      });
    }
    setOptionData(flatData(data));
    setLoading(false);
  };

  const ensureBTCandETHFirst = (baseList) => {
    return baseList.sort((a, b) => {
      if (a === 'BTC') {
        return -1;
      }
      if (b === 'BTC') {
        return 1;
      }
      if (a === 'ETH') {
        return -1;
      }
      if (b === 'ETH') {
        return 1;
      }

      return a.localeCompare(b);
    });
  };

  const selectedSubTree = options?.[exchangeName] || {};
  const baseChoices = ensureBTCandETHFirst(Object.keys(selectedSubTree));

  const selectInitialDate = (selectedBase) => {
    if (!selectedBase) {
      return;
    }
    const sortedDateStrings = sortDateOptions(selectedSubTree[selectedBase]);
    setDateOptions(sortedDateStrings);

    if (exchangeName !== 'Deribit') {
      // Deribit provides the underlying price in the option ticker data
      getUnderlyingPrice(selectedBase);
    }
    const selectedDate = sortedDateStrings[0];
    setOptionDateValue(selectedDate);
    setOptionData({});
    loadOptionData(exchangeName, selectedBase, selectedDate);
  };

  const loadExchangeInitialSelections = () => {
    if (baseChoices.length > 0) {
      setOptionBaseValue(baseChoices[0]);
      selectInitialDate(baseChoices[0]);
    }
  };

  useEffect(() => {
    loadExchangeInitialSelections();
  }, [exchangeName]);

  useEffect(() => {
    if (options && Object.keys(options).length > 0) {
      loadExchangeInitialSelections();
    }
  }, [options]);

  useEffect(() => {
    selectInitialDate(optionBaseValue);
  }, [optionBaseValue]);

  useEffect(() => {
    loadOptionData(exchangeName, optionBaseValue, optionDateValue);
  }, [optionDateValue]);

  const rowOnClick = (row) => {
    if (row.type !== 'C' && row.type !== 'P') {
      return;
    }

    setSelectedPair(selectedSubTree[row.underlying][row.expiry][row.strike][row.type === 'C' ? 'CALL' : 'PUT']);
  };

  return (
    <>
      <Paper
        sx={{
          position: 'relative',
          height: '52px',
          zIndex: 50,
        }}
        variant='outlined'
      >
        <Stack alignItems='center' direction='row' height='100%' spacing={2}>
          <FormControl
            size='small'
            style={{
              marginLeft: '16px',
            }}
            sx={{
              width: '15%',
            }}
          >
            <InputLabel id='exchange-label'>Exchange</InputLabel>
            <Select
              defaultValue=''
              id='prediction-exchange'
              label='Exchange'
              labelId='exchange-label'
              value={
                exchangeName === undefined || exchangeName === null || validExchanges.length === 0 ? '' : exchangeName
              }
              onChange={(e) => {
                setExchangeName(e.target.value);
              }}
            >
              {validExchanges.map((exchange) => (
                <MenuItem key={exchange} value={exchange}>
                  {exchange}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Autocomplete
            disablePortal
            defaultValue=''
            disabled={Object.keys(selectedSubTree).length === 0}
            options={baseChoices}
            renderInput={(params) => {
              return <TextField {...params} label='Base' size='small' />;
            }}
            style={{
              marginLeft: '16px',
            }}
            sx={{
              width: '15%',
            }}
            value={
              optionBaseValue === undefined || optionBaseValue === null || baseChoices.length === 0
                ? ''
                : optionBaseValue
            }
            onChange={(e, newValue) => {
              setOptionDateValue(null);
              setOptionBaseValue(newValue);
            }}
          />
          <Autocomplete
            disablePortal
            defaultValue=''
            disabled={Object.keys(selectedSubTree).length === 0 || pairPriceLoading}
            options={dateOptions}
            renderInput={(params) => {
              return <TextField {...params} label='Expiry Date' size='small' />;
            }}
            sx={{
              width: '15%',
            }}
            value={
              optionDateValue === undefined || optionDateValue === null || dateOptions.length === 0
                ? ''
                : optionDateValue
            }
            onChange={(e, newValue) => {
              setOptionDateValue(newValue);
            }}
          />
        </Stack>
      </Paper>
      <CardContent
        style={{
          height: 'calc(100% - 72px)',
        }}
        sx={{
          width: '99%',
          overflowY: 'auto',
          paddingTop: '0px',
        }}
      >
        {loading || optionData.length === 0 ? (
          <Loader />
        ) : (
          <Stack direction='row' spacing='0'>
            <div
              style={{
                height: 'auto',
                flex: 1,
                paddingTop: '0px',
                paddingBottom: '24px',
              }}
            >
              <Table stickyHeader aria-label='sticky table' size='small'>
                <TableHead>
                  <TableRow>
                    <StyledHeaderTableCell
                      align='center'
                      colSpan={columns.length}
                      sx={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      Calls
                    </StyledHeaderTableCell>
                  </TableRow>
                  <TableRow>
                    {columns.toReversed().map((column) => (
                      <StyledHeaderTableCellWithLine
                        align={column.align}
                        key={`${column.id}calls headers`}
                        style={{
                          top: 26.5,
                          minWidth: column.minWidth,
                          width: column.width || undefined,
                        }}
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {column.label}
                      </StyledHeaderTableCellWithLine>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {optionData &&
                    optionData.length > 0 &&
                    optionData.map((row, index) => {
                      const callRow = row[0];
                      const nextRow = index < optionData.length - 1 ? optionData[index + 1][0] : null;
                      const key = index;

                      return (
                        <>
                          <DisplayRow
                            columns={columns.toReversed()}
                            extraTickerData={tickerData}
                            key={`${key}calls`}
                            pairPrice={pairPrice}
                            row={callRow}
                            rowOnClick={rowOnClick}
                            theme={theme}
                          />
                          {nextRow && nextRow.strike > pairPrice && callRow.strike < pairPrice && (
                            <FocusableDivider theme={theme} />
                          )}
                        </>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
            <div
              style={{
                flex: '0 1 auto',
                paddingTop: '0px',
                paddingBottom: '24px',
              }}
            >
              <Box sx={{ maxHeight: '100%' }}>
                <Table stickyHeader aria-label='sticky table' size='small'>
                  <TableHead>
                    <TableRow>
                      <StyledHeaderTableCell
                        align='center'
                        colSpan={columns.length}
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          height: '20.5px',
                          top: 0,
                        }}
                      >
                        {}
                      </StyledHeaderTableCell>
                    </TableRow>

                    <TableRow>
                      <StyledHeaderTableCellWithLine
                        align={strikeColumn.align}
                        key={strikeColumn.id}
                        style={{
                          top: '26.5px',
                          minWidth: strikeColumn.minWidth,
                          width: strikeColumn.width || undefined,
                        }}
                      >
                        {strikeColumn.label}
                      </StyledHeaderTableCellWithLine>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {optionData &&
                      optionData.length > 0 &&
                      optionData.map((row, index) => {
                        const newRow = row[0];

                        const strikeRow = (
                          <TableRow
                            key={`${newRow.strike} strike`}
                            sx={{ height: '49.59px' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = 'lightgray';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '';
                            }}
                          >
                            {displayDefaultTableCell(
                              strikeColumn,
                              newRow[strikeColumn.id],
                              { minWidth: strikeColumn.minWidth },
                              StyledStrikeTableCell
                            )}
                          </TableRow>
                        );

                        const nextRow = index < optionData.length - 1 ? optionData[index + 1][0] : null;
                        if (nextRow && nextRow.strike > pairPrice && newRow.strike < pairPrice) {
                          return (
                            <>
                              {strikeRow}
                              <TableRow>
                                <TableCell colSpan='100%' style={{ padding: 0 }}>
                                  <Divider
                                    sx={{
                                      height: '2px',
                                      backgroundColor: theme.palette.primary.main,
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            </>
                          );
                        }

                        return strikeRow;
                      })}
                  </TableBody>
                </Table>
              </Box>
            </div>
            <div
              style={{
                height: 'auto',
                flex: 1,
                paddingTop: '0px',
                paddingBottom: '24px',
              }}
            >
              <Box sx={{ maxHeight: '100%' }}>
                <Table stickyHeader aria-label='sticky table' size='small'>
                  <TableHead>
                    <TableRow>
                      <StyledHeaderTableCell
                        align='center'
                        colSpan={columns.length}
                        sx={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        Puts
                      </StyledHeaderTableCell>
                    </TableRow>
                    <TableRow>
                      {columns.map((column) => (
                        <StyledHeaderTableCellWithLine
                          align={column.align}
                          key={`${column.id}puts headers`}
                          style={{
                            top: 26.5,
                            minWidth: column.minWidth,
                            width: column.width || undefined,
                          }}
                          sx={{
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {column.label}
                        </StyledHeaderTableCellWithLine>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {optionData &&
                      optionData.length > 0 &&
                      optionData.map((row, index) => {
                        const putRow = row[1];
                        const nextRow = index < optionData.length - 1 ? optionData[index + 1][0] : null;
                        const key = putRow.instId || putRow.id || index;

                        return (
                          <>
                            <DisplayRow
                              columns={columns}
                              extraTickerData={tickerData}
                              key={`${key}puts`}
                              pairPrice={pairPrice}
                              row={putRow}
                              rowOnClick={rowOnClick}
                              theme={theme}
                            />
                            {nextRow && nextRow.strike > pairPrice && putRow.strike < pairPrice && (
                              <TableRow>
                                <TableCell colSpan='100%' style={{ padding: 0 }}>
                                  <Divider
                                    sx={{
                                      height: '2px',
                                      backgroundColor: theme.palette.primary.main,
                                    }}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </>
                        );
                      })}
                  </TableBody>
                </Table>
              </Box>
            </div>
          </Stack>
        )}
      </CardContent>
    </>
  );
}

export default OptionPriceChart;
