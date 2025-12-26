import { Stack } from '@mui/material';
import Collapse from '@mui/material/Collapse';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { numberWithCommas, calculateDurationDisplay, smartRound } from '../../util';
import { StrategyParamsParsed, StyledBorderTableCell, StyledHeaderTableCell } from './util';

const formatInitialValue = (val) => {
  if (!val) {
    return '';
  }

  return `${numberWithCommas(smartRound(Number(val)))} `;
};

const getTokenDisplay = (row, isBuyToken) => {
  if (row.market_type === 'option') {
    return 'Contracts';
  }
  return isBuyToken ? row.buy_token : row.sell_token;
};

function CollapsedRow({ row, open, dashboardView }) {
  const theme = useTheme();

  const isDexOrder = Array.isArray(row.unique_venues) && row.unique_venues.some((venue) => venue.includes('OKXDEX'));

  const renderTokenDisplay = (isBuyToken) => {
    const tokenDisplay = getTokenDisplay(row, isBuyToken);
    return tokenDisplay ? <span style={{ color: theme.palette.text.subtitle }}>{tokenDisplay}</span> : null;
  };
  const truncateWithTooltip = (text, maxLength = 48) => {
    if (!text) return '';
    const isTruncated = text.length > maxLength;
    const displayText = isTruncated ? `${text.slice(0, maxLength)}...` : text;
    return (
      <Tooltip arrow placement='top' title={isTruncated ? text : ''}>
        <span
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: 'inline-block',
            maxWidth: 300,
          }}
        >
          {displayText}
        </span>
      </Tooltip>
    );
  };

  return (
    <Collapse in={open}>
      <Stack
        direction='row'
        style={{
          whiteSpace: 'nowrap',
          paddingTop: '10px',
          paddingBottom: '10px',
        }}
      >
        <Stack direction='column' style={{ whiteSpace: 'nowrap', marginLeft: '40px' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <StyledHeaderTableCell align='left' key='duration' style={{ width: 190 }}>
                  Target Quantity
                </StyledHeaderTableCell>
                <StyledHeaderTableCell align='left' key='target quantity' style={{ width: 190 }}>
                  Executed Quantity
                </StyledHeaderTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <StyledBorderTableCell>
                  {row.buy_token_amount
                    ? `${formatInitialValue(row.buy_token_amount)} `
                    : `${formatInitialValue(row.sell_token_amount)} `}
                  {renderTokenDisplay(!!row.buy_token_amount)}
                </StyledBorderTableCell>
                <StyledBorderTableCell>
                  {row.buy_token_amount
                    ? `${numberWithCommas(Number(row.executed_buy_qty).toFixed(3))} `
                    : `${numberWithCommas(Number(row.executed_qty).toFixed(3))} `}
                  {renderTokenDisplay(!!row.buy_token_amount)}
                </StyledBorderTableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <StyledHeaderTableCell align='left' key='avg exec price' style={{ width: 190 }}>
                  Executed Price
                </StyledHeaderTableCell>
                <StyledHeaderTableCell align='left' key='executed qty' style={{ width: 190 }}>
                  Executed Notional
                </StyledHeaderTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <StyledBorderTableCell>
                  ${numberWithCommas(smartRound(Number(row.executed_price)))}
                </StyledBorderTableCell>
                <StyledBorderTableCell>
                  ${numberWithCommas(smartRound(Number(row.executed_notional)))}
                </StyledBorderTableCell>
              </TableRow>
            </TableBody>
          </Table>
          {row.limit_price && (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <StyledHeaderTableCell align='left' key='limit price' style={{ width: 190 }}>
                    Limit Price
                  </StyledHeaderTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <StyledBorderTableCell>{row.limit_price}</StyledBorderTableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
          {row.order_condition_normal !== '' && (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <StyledHeaderTableCell align='left' key='avg exec price' style={{ width: 190 }}>
                    Condition
                  </StyledHeaderTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <StyledBorderTableCell>
                    <Stack>
                      {truncateWithTooltip(row.order_condition_normal)}
                      {row.order_variable_normal &&
                        row.order_condition_vars &&
                        Object.entries(row.order_variable_normal).map(([k, v]) => {
                          return (
                            <li key={`clause ${k}`}>
                              {k} ={' '}
                              <span style={{ fontWeight: 'bold' }}>{smartRound(row.order_condition_vars[k][1])}</span> :{' '}
                              {v}
                            </li>
                          );
                        })}
                    </Stack>
                  </StyledBorderTableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
          {row.exit_condition_normal && (
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <StyledHeaderTableCell align='left' key='exit_condition' style={{ width: 190 }}>
                    Exit Condition
                  </StyledHeaderTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <StyledBorderTableCell>{truncateWithTooltip(row.exit_condition_normal)}</StyledBorderTableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </Stack>
        {/* Hide duration, VWAP cost, participation rate, and arrival cost for OKXDEX orders */}
        {!isDexOrder && (
          <Stack direction='column' style={{ whiteSpace: 'nowrap' }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <StyledHeaderTableCell align='left' key='arrival_cost' style={{ width: '150px' }}>
                    Duration
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='left' key='vwap_cost' style={{ width: '150px' }}>
                    VWAP Cost
                  </StyledHeaderTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <StyledBorderTableCell>{calculateDurationDisplay(row.duration)}</StyledBorderTableCell>
                  <StyledBorderTableCell>
                    {row.benchmarks && Object.keys(row.benchmarks).length !== 0 ? (
                      <div
                        style={{
                          color:
                            Number(row.benchmarks.vwap_cost) < 0
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                        }}
                      >
                        {Number(row.benchmarks.vwap_cost).toFixed(4)} bps
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </StyledBorderTableCell>
                </TableRow>
              </TableBody>
            </Table>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <StyledHeaderTableCell align='left' key='pov' style={{ width: dashboardView ? '227px' : '250px' }}>
                    Participation Rate
                  </StyledHeaderTableCell>
                  <StyledHeaderTableCell align='left' key='arrival cost' style={{ width: '250px' }}>
                    Arrival Cost
                  </StyledHeaderTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <StyledBorderTableCell>
                    {row.benchmarks && Object.keys(row.benchmarks).length !== 0 ? (
                      <div className={row.benchmarks.pov}>{Number(row.benchmarks.pov).toFixed(4)}%</div>
                    ) : (
                      <span style={{ color: theme.palette.text.subtitle }}>-</span>
                    )}
                  </StyledBorderTableCell>
                  <StyledBorderTableCell>
                    {row.benchmarks && Object.keys(row.benchmarks).length !== 0 ? (
                      <div
                        style={{
                          color:
                            Number(row.benchmarks.arrival_cost) < 0
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                        }}
                      >
                        {Number(row.benchmarks.arrival_cost).toFixed(4)} bps
                      </div>
                    ) : (
                      <span style={{ color: theme.palette.text.subtitle }}>-</span>
                    )}
                  </StyledBorderTableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Stack>
        )}
        {/* Hide strategy configurations for OKXDEX orders */}
        {!isDexOrder && (
          <Stack direction='column' style={{ whiteSpace: 'nowrap' }}>
            <Table size='small'>
              <TableHead>
                <TableRow>
                  <StyledHeaderTableCell align='left' key='strategy_params' style={{ width: 400 }}>
                    Strategy Configurations
                  </StyledHeaderTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <StyledBorderTableCell>
                    <StrategyParamsParsed
                      useIBM
                      alpha_tilt={row.alpha_tilt}
                      engine_passiveness={row.engine_passiveness}
                      exposure_tolerance={row.exposure_tolerance}
                      pov_limit={row.pov_limit}
                      pov_target={row.pov_target}
                      schedule_discretion={row.schedule_discretion}
                      strategy_params={row.strategy_params}
                    />
                  </StyledBorderTableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Stack>
        )}
        <Stack direction='column' style={{ whiteSpace: 'nowrap' }}>
          <Table size='small'>
            <TableHead>
              <TableRow>
                <StyledHeaderTableCell align='left' key='notes' style={{ width: 400 }}>
                  Notes
                </StyledHeaderTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <StyledBorderTableCell>
                  {truncateWithTooltip(row.notes || <span style={{ color: theme.palette.text.subtitle }}>-</span>)}
                </StyledBorderTableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Stack>
      </Stack>
    </Collapse>
  );
}

export default CollapsedRow;
