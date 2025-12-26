import ICONS from '@/../images/exchange_icons';
import getBaseTokenIcon from '@/../images/tokens';
import { Box, Icon, Stack } from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { useThemeContext } from '../../theme/ThemeContext';
import { calculateDurationDisplay, formatAccountName, formatQty, isEmpty, msAndKs, titleCase } from '../../util';
import ProgressBar from '../fields/ProgressBar/ProgressBar';
import { displayDefaultTableCell, formatDateTime, parseStatus, StyledTableCell } from './util';

const getSideColor = (side, theme) => {
  if (side === 'buy') {
    return theme.palette.success.main;
  }
  if (side === 'sell') {
    return theme.palette.error.main;
  }
  return theme.palette.text.primary;
};

// Calculate time elapsed from start time
const getTimeElapsed = (timeStart) => {
  const duration = moment.duration(moment().diff(moment(timeStart)));

  const days = Math.floor(duration.asDays());
  const hours = duration.hours();
  const minutes = duration.minutes();

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ${hours}h ${minutes}m ago`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m ago`;
  }
  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return `${duration.seconds()}s ago`;
};

// Time start cell with hover tooltip showing elapsed time
function TimeStartCell({ column, value }) {
  const [timeElapsed, setTimeElapsed] = useState('');
  const intervalRef = useRef(null);

  const handleMouseEnter = () => {
    if (!value) return;

    // Set initial time elapsed
    setTimeElapsed(getTimeElapsed(value));

    // Update every second while hovering
    intervalRef.current = setInterval(() => {
      setTimeElapsed(getTimeElapsed(value));
    }, 1000);
  };

  const handleMouseLeave = () => {
    setTimeElapsed('');
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  if (!value) {
    return displayDefaultTableCell(column, '');
  }

  return (
    <Tooltip arrow placement='top' title={timeElapsed}>
      <StyledTableCell
        align={column.align}
        key={column.id}
        style={{ cursor: 'default' }}
        width={column.width}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {formatDateTime(value)}
      </StyledTableCell>
    </Tooltip>
  );
}

const parseSuperStrategy = (row, value, column) => {
  let displayText = value;

  if (row.side === 'Multi') {
    displayText = row.strategy;
  }

  if (row.side === 'Chained') {
    displayText = '';
  }

  if (row.side === 'Batch') {
    displayText = row.batch_order_strategy;
  }

  if (row.order_condition_normal && !row.parent_order) {
    displayText += '*';
  }

  return displayDefaultTableCell(column, displayText);
};

export default function DisplayRowDetails({
  row,
  column,
  StyledCell,
  theme,
  customCase = {},
  onPairClick,
  tokenPairs = [],
}) {
  const { currentTheme } = useThemeContext();
  let value = row[column.id];
  if (!isEmpty(customCase) && customCase[column.id]) {
    return customCase[column.id](row);
  }

  const findPairInTokenPairs = (pairString) => {
    if (!tokenPairs.length || !pairString) return null;
    return tokenPairs.find((pair) => pair.label === pairString || pair.id === pairString);
  };

  const handlePairClick = (pairString, event) => {
    if (event) {
      event.stopPropagation();
    }
    if (onPairClick && pairString) {
      const foundPair = findPairInTokenPairs(pairString);
      if (foundPair) {
        onPairClick(foundPair, row.account_names);
      }
    }
  };

  const renderClickablePair = (pairString, key) => {
    if (!pairString) return null;

    const [base, quote] = pairString.split('-');
    if (!base || !quote) return null;

    const hasPerp = base.includes('PERP');
    const baseToken = hasPerp ? base.split(':')[0] : base;
    const isClickable = onPairClick && findPairInTokenPairs(pairString);

    const handleMouseEnter = (e) => {
      if (!isClickable) return;

      // Find the main span container (in case we're hovering on a child)
      const targetElement = e.currentTarget;

      // Apply hover color to the main container and all children
      targetElement.style.color = theme.palette.semantic.warning;
      const allChildren = targetElement.querySelectorAll('*');
      allChildren.forEach((child) => {
        const element = child;
        element.style.color = theme.palette.semantic.warning;
      });
    };

    const handleMouseLeave = (e) => {
      if (!isClickable) return;

      // Find the main span container
      const targetElement = e.currentTarget;

      // Reset color for the main container
      targetElement.style.color = '';

      // Reset all children to their original colors with proper timing
      const allChildren = targetElement.querySelectorAll('*');
      allChildren.forEach((child) => {
        const element = child;
        // Handle PERP elements specially to maintain grey color
        if (element.tagName === 'SPAN' && element.textContent === 'PERP') {
          element.style.color = 'grey';
        } else {
          element.style.color = '';
        }
      });
    };

    return (
      <span
        key={key}
        role={isClickable ? 'button' : undefined}
        style={{
          cursor: isClickable ? 'pointer' : 'default',
          transition: 'color 0.2s ease',
          display: 'inline-block',
        }}
        tabIndex={isClickable ? 0 : undefined}
        onClick={isClickable ? (event) => handlePairClick(pairString, event) : undefined}
        onKeyDown={
          isClickable
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  handlePairClick(pairString, event);
                }
              }
            : undefined
        }
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <b>{baseToken}</b>
        {hasPerp ? (
          <>
            <span>:</span>
            <span style={{ color: 'grey' }}>PERP</span>
            <span>-</span>
            <b>{quote}</b>
          </>
        ) : (
          <>
            <span>-</span>
            <b>{quote}</b>
          </>
        )}
      </span>
    );
  };

  switch (column.id) {
    case 'pair': {
      if (row.pairs && (row.side === 'Multi' || row.side === 'Chained')) {
        const pairsArray = row.pairs
          .split(',')
          .map((pair) => pair.trim())
          .filter(Boolean);
        // For chained orders, show only unique pairs
        // For multi orders: if all pairs are identical, de-duplicate to a single pair
        const allSameInMulti =
          row.side === 'Multi' && pairsArray.length > 0 && pairsArray.every((p) => p === pairsArray[0]);
        let uniquePairs = pairsArray;
        if (row.side === 'Chained') {
          uniquePairs = [...new Set(pairsArray)];
        } else if (allSameInMulti) {
          uniquePairs = [pairsArray[0]];
        }
        const pairsToShow = uniquePairs
          .slice(0, 3)
          .map((pair, index) => {
            const renderedPair = renderClickablePair(pair, `clickable-pair-${pair}-${index}`);
            if (!renderedPair) return null;

            return (
              <React.Fragment key={`pair-${pair}-${row.account_names?.[index]}`}>
                {renderedPair}
                <br />
              </React.Fragment>
            );
          })
          .filter(Boolean);
        const remainingCount = uniquePairs.length - 3;

        return (
          <StyledCell
            key={column.id}
            style={{
              minWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            width={column.width}
          >
            {pairsToShow}
            {remainingCount > 0 && (
              <>
                <br />
                ... ({remainingCount} more pairs)
              </>
            )}
          </StyledCell>
        );
      }

      if (!value) {
        return null;
      }

      const renderedPair = renderClickablePair(value, `single-pair-${value}`);
      if (!renderedPair) {
        return (
          <StyledCell
            key={column.id}
            style={{
              minWidth: '100px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            width={column.width}
          >
            <i>[Invalid Pair]</i>
          </StyledCell>
        );
      }

      return (
        <StyledCell
          key={column.id}
          style={{
            minWidth: '100px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          width={column.width}
        >
          {renderedPair}
        </StyledCell>
      );
    }

    case 'target_notional': {
      const { target_base_qty, target_base_token } = row;
      const qty_value = target_base_qty ? ` ≈ ${msAndKs(target_base_qty, 2)} ${target_base_token}` : '';
      if (!row[column.id]) {
        return (
          <StyledCell key={column.id} style={{ whiteSpace: 'nowrap' }} width={column.width}>
            <Stack alignItems='flex-end' direction='column' spacing={1}>
              <Typography />
              <Typography color='text.secondary'> {qty_value}</Typography>
            </Stack>
          </StyledCell>
        );
      }
      value = `${formatQty(row[column.id], true)}`;
      return (
        <StyledCell key={column.id} style={{ whiteSpace: 'nowrap' }} width={column.width}>
          <Stack alignItems='flex-end' direction='column' spacing={1}>
            <Typography>
              <span style={{ color: 'grey' }}>$</span>
              {value.substring(1)}
            </Typography>
            <Typography color='text.secondary'> {qty_value}</Typography>
          </Stack>
        </StyledCell>
      );
    }
    case 'executed_notional':
      if (!row[column.id]) {
        return <StyledCell key={column.id} width={column.width} />;
      }
      value = `${formatQty(row[column.id], true)}`;
      return (
        <StyledCell align={column.align} key={column.id} width={column.width}>
          <span style={{ color: 'grey' }}>$</span>
          {value.substring(1)}
        </StyledCell>
      );

    case 'status':
      return (
        <StyledCell key={column.id} width={column.width}>
          {parseStatus(row.status)}
        </StyledCell>
      );

    case 'account_names': {
      if (row.account_names === undefined || row.account_names.length === 0) {
        return (
          <StyledCell key={column.id} width={column.width}>
            <i>[Deleted]</i>
          </StyledCell>
        );
      }
      const truncatedNames = value.map((name) => formatAccountName(name, 20));
      return displayDefaultTableCell(column, truncatedNames.join(' | '));
    }

    case 'accounts':
      if (row.accounts === undefined || row.accounts.length === 0) {
        return (
          <StyledCell key={column.id} sx={{ pl: 0.5, pr: 1 }} width={column.width}>
            <i>[Deleted]</i>
          </StyledCell>
        );
      }
      return (
        <StyledCell key={column.id} sx={{ pl: 0.5, pr: 1 }} width={column.width}>
          {value
            .map((account) => {
              // Add null checks for account properties
              if (!account || !account.exchange || !account.name) {
                return null;
              }

              const exchangeIconUrl = ICONS[account.exchange.toLowerCase()];
              const displayName = formatAccountName(account.name);

              return (
                <Box
                  display='inline-flex'
                  key={`account_${account.name}`}
                  position='relative'
                  sx={{ alignItems: 'center', gap: 1, pr: 2 }}
                >
                  <img
                    alt={`${account.exchange} exchange`}
                    src={exchangeIconUrl}
                    style={{ borderRadius: '50%', height: '24.75px', width: '24.75px' }}
                  />
                  <Typography
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.75rem',
                      whiteSpace: 'nowrap',
                    }}
                    variant='caption'
                  >
                    {displayName}
                  </Typography>
                </Box>
              );
            })
            .filter(Boolean)}{' '}
          {/* Filter out null values */}
        </StyledCell>
      );

    case 'pct_filled': {
      let progressPercentage = Math.round(Number(value));

      // For batch orders, calculate fill percentage based on total filled vs total target quantities
      // Use the same logic as individual orders: buy orders use quote currency, sell orders use base currency
      if (row.side === 'Batch') {
        const buyTokenAmount = row.buy_token_amount || 0;

        // For batch orders, use target_executed_qty / target_order_qty (both in the same units)
        const targetExecutedQty = row.target_executed_qty || 0;
        const targetOrderQty = row.target_order_qty || 0;

        if (targetOrderQty > 0) {
          progressPercentage = Math.round((targetExecutedQty / targetOrderQty) * 100);
        } else {
          progressPercentage = 0;
        }
      }

      return (
        <StyledCell key={column.id} width={column.width}>
          <Box alignItems='center' display='flex' height='100%' justifyContent='center'>
            <ProgressBar
              fullWidth={column.fullWidth}
              isDark={currentTheme === 'dark'}
              isPov={row.pov_limit || row.pov_target}
              orderStatus={row.status}
              progress={progressPercentage}
            />
          </Box>
        </StyledCell>
      );
    }

    case 'super_strategy':
      return parseSuperStrategy(row, value, column);

    case 'side':
      return displayDefaultTableCell(column, titleCase(value), {
        color: getSideColor(value, theme),
      });

    case 'time_start':
      return <TimeStartCell column={column} value={value} />;

    case 'executed_price':
      return (
        <StyledCell align={column.align} key={column.id} width={column.width}>
          {value ? (
            <>
              <span style={{ color: 'grey' }}>$</span>
              {formatQty(value, true).substring(1)}
            </>
          ) : (
            ''
          )}
        </StyledCell>
      );

    case 'arrival_price': {
      // Prefer a directly provided arrival_price if the backend ever sends it.
      let arrivalPrice = row.arrival_price || row.benchmarks?.arrival_price;

      // If not present, try to derive it from arrival_cost and executed_price:
      // arrival_cost = side_sign * 10000 * ln(executed_price / arrival_price)
      // => arrival_price = executed_price / exp(arrival_cost / (side_sign * 10000))
      if (
        arrivalPrice == null &&
        row.benchmarks &&
        row.benchmarks.arrival_cost != null &&
        row.executed_price
      ) {
        const side = row.side?.toLowerCase();
        const sideSign = side === 'sell' ? -1 : 1;
        const arrivalCost = Number(row.benchmarks.arrival_cost);
        const executedPrice = Number(row.executed_price);

        if (Number.isFinite(arrivalCost) && Number.isFinite(executedPrice) && executedPrice > 0) {
          const divisor = sideSign * 10000;
          if (divisor !== 0) {
            const ratio = Math.exp(arrivalCost / divisor);
            if (Number.isFinite(ratio) && ratio > 0) {
              arrivalPrice = executedPrice / ratio;
            }
          }
        }
      }

      return (
        <StyledCell align={column.align} key={column.id} width={column.width}>
          {arrivalPrice ? (
            <>
              <span style={{ color: 'grey' }}>$</span>
              {formatQty(arrivalPrice, true).substring(1)}
            </>
          ) : (
            ''
          )}
        </StyledCell>
      );
    }

    case 'target_qty': {
      let sellTokens = [];
      let sellAmounts = [];

      if (row.side === 'Batch') {
        // For batch orders, show the aggregated target quantity
        const token = row.buy_token_amount ? row.buy_token : row.sell_token;
        const hasPerp = token?.includes('PERP');
        const baseToken = hasPerp ? token?.split(':')[0] : token;
        return (
          <StyledCell key={column.id} width={column.width}>
            {formatQty(row.target_order_qty || 0)}{' '}
            <b>
              {baseToken}
              {hasPerp && ':'}
            </b>
            {hasPerp && <span style={{ color: 'grey' }}>PERP</span>}
          </StyledCell>
        );
      }

      if (row.side === 'Multi' || row.side === 'Chained') {
        sellTokens = row.sell_token ? row.sell_token.split(',').map((token) => token.trim()) : [];
        sellAmounts = row.sell_token_amount
          ? row.sell_token_amount
              .toString()
              .split(',')
              .map((amount) => amount.trim())
          : [];

        let combinedQuantities = [];

        if (row.side === 'Chained') {
          // For chained orders, sum up quantities by unique token
          const tokenAmountMap = new Map();

          sellAmounts.forEach((amount, index) => {
            const token = sellTokens[index] || '';
            const hasPerp = token.includes('PERP');
            const baseToken = hasPerp ? token.split(':')[0] : token;
            const tokenKey = hasPerp ? `${baseToken}:PERP` : baseToken;

            const currentAmount = parseFloat(amount) || 0;
            const existingAmount = tokenAmountMap.get(tokenKey) || 0;
            tokenAmountMap.set(tokenKey, existingAmount + currentAmount);
          });

          combinedQuantities = Array.from(tokenAmountMap.entries()).map(([tokenKey, totalAmount]) => {
            const hasPerp = tokenKey.includes(':PERP');
            const baseToken = hasPerp ? tokenKey.split(':')[0] : tokenKey;
            return `${formatQty(totalAmount)} ${baseToken}${hasPerp ? ':PERP' : ''}`;
          });
        } else {
          // For multi orders, keep existing behavior
          combinedQuantities = sellAmounts.map((amount, index) => {
            const token = sellTokens[index] || '';
            const hasPerp = token.includes('PERP');
            const baseToken = hasPerp ? token.split(':')[0] : token;
            return `${formatQty(amount)} ${baseToken}${hasPerp ? ':PERP' : ''}`;
          });
        }

        const quantitiesToShow = combinedQuantities.slice(0, 3);
        const hasMore = combinedQuantities.length > 3;

        return (
          <StyledCell key={column.id} width={column.width}>
            <Tooltip arrow placement='right' title={hasMore ? combinedQuantities.join('\n') : ''}>
              <div>
                {quantitiesToShow.join('\n')}
                {hasMore && (
                  <>
                    <br />
                    ...
                  </>
                )}
              </div>
            </Tooltip>
          </StyledCell>
        );
      }
      const token = row.buy_token_amount ? row.buy_token : row.sell_token;
      const hasPerp = token.includes('PERP');
      const baseToken = hasPerp ? token.split(':')[0] : token;
      return (
        <StyledCell key={column.id} width={column.width}>
          {formatQty(row.target_order_qty)}{' '}
          <b>
            {baseToken}
            {hasPerp && ':'}
          </b>
          {hasPerp && <span style={{ color: 'grey' }}>PERP</span>}
        </StyledCell>
      );
    }
    case 'exchanges': {
      if (!row.exchanges || row.exchanges.length === 0) {
        return null;
      }
      return (
        <StyledCell key={column.id} width={column.width}>
          {row.exchanges.map((exchange) => {
            const exchangeIconUrl = ICONS[exchange.toLowerCase()];
            return (
              <Icon key={`exchange-${exchange}`} sx={{ borderRadius: '50%', height: '24.75px', width: '24.75px' }}>
                <img alt={`${exchange} exchange`} src={exchangeIconUrl} />
              </Icon>
            );
          })}
        </StyledCell>
      );
    }

    case 'unique_venues': {
      if (!row.unique_venues || row.unique_venues.length === 0) {
        return (
          <StyledCell
            key={column.id}
            sx={{ pl: 0.5, pr: column.id === 'unique_venues' ? 0.5 : 1 }}
            width={column.width}
          >
            <i>[Deleted]</i>
          </StyledCell>
        );
      }

      if (row.side === 'Multi' || row.side === 'Chained') {
        const pairsArray = row.pairs ? row.pairs.split(',').map((pair) => pair.trim()) : [];
        // For chained orders, show only unique pairs
        const uniquePairs = row.side === 'Chained' ? [...new Set(pairsArray)] : pairsArray;
        const pairsToShow = uniquePairs.slice(0, 3);

        return (
          <StyledCell
            key={column.id}
            sx={{
              pl: 0.5,
              pr: column.id === 'unique_venues' ? 0.5 : 1,
              position: 'relative',
              zIndex: 1,
            }}
            width={column.width}
          >
            <Box
              sx={{
                position: 'relative',
                display: 'inline-block',
                height: '24.75px',
                width: `${24.75 + (pairsToShow.length - 1) * 8}px`,
              }}
            >
              {pairsToShow.map((pair, index) => {
                const [base, _] = pair.split('-');
                const [baseToken, __] = base.split(':');
                const tokenIconSrc = getBaseTokenIcon(baseToken);

                return (
                  tokenIconSrc && (
                    <Box
                      key={`venue-${baseToken}-${row.account_names?.[index]}`}
                      sx={{
                        position: 'absolute',
                        left: `${pairsToShow.indexOf(pair) * 8}px`,
                        zIndex: pairsToShow.indexOf(pair) + 1,
                      }}
                    >
                      <img
                        alt={`${baseToken} token`}
                        src={tokenIconSrc}
                        style={{
                          height: '24.75px',
                          width: '24.75px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    </Box>
                  )
                );
              })}
            </Box>
            {uniquePairs.length > 3 && (
              <Box
                sx={{
                  display: 'inline-block',
                  marginLeft: '8px',
                  verticalAlign: 'middle',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                +{uniquePairs.length - 3}
              </Box>
            )}
          </StyledCell>
        );
      }

      return (
        <StyledCell key={column.id} sx={{ pl: 0.5, pr: column.id === 'unique_venues' ? 0.5 : 1 }} width={column.width}>
          {row.unique_venues
            .map((venue, index) => {
              if (!row.pair || !venue) {
                return null;
              }

              if (!row.pair) return null;

              const [base, _] = row.pair.split('-');
              if (!base) return null;

              const [baseToken, __] = base.split(':');
              const tokenIconSrc = getBaseTokenIcon(baseToken);
              const exchangeIconUrl = ICONS[venue.toLowerCase()];

              const renderIcon = () => {
                if (tokenIconSrc) {
                  return (
                    <>
                      <img
                        alt={`${baseToken} token`}
                        height='24.75px'
                        src={tokenIconSrc}
                        style={{ borderRadius: '50%' }}
                        width='24.75px'
                      />
                      {exchangeIconUrl && (
                        <Box bottom={0} position='absolute' right={0} sx={{ transform: 'translate(25%, 25%)' }}>
                          <img
                            alt={`${venue} exchange`}
                            height='12.375px'
                            src={exchangeIconUrl}
                            style={{ borderRadius: '50%' }}
                            width='12.375px'
                          />
                        </Box>
                      )}
                    </>
                  );
                }
                if (exchangeIconUrl) {
                  return (
                    <img
                      alt={`${venue} exchange`}
                      height='24.75px'
                      src={exchangeIconUrl}
                      style={{ borderRadius: '50%' }}
                      width='24.75px'
                    />
                  );
                }
                return null;
              };

              return (
                <Tooltip
                  arrow
                  key={`venue-${venue}-${row.account_names?.[index]}`}
                  title={row.account_names?.[row.unique_venues.indexOf(venue)] || venue}
                >
                  <Box display='inline-block' position='relative' sx={{ pr: 0 }}>
                    {renderIcon()}
                  </Box>
                </Tooltip>
              );
            })
            .filter(Boolean)}
        </StyledCell>
      );
    }

    case 'executed_qty': {
      let sellTokens = [];
      let executedQtys = [];
      let combinedQuantities = [];

      if (row.side === 'Batch') {
        // For batch orders, show executed quantity in the same unit as target quantity
        const token = row.buy_token_amount ? row.buy_token : row.sell_token;
        const hasPerp = token?.includes('PERP');
        const baseToken = hasPerp ? token?.split(':')[0] : token;
        return (
          <StyledCell key={column.id} width={column.width}>
            {formatQty(row.target_executed_qty || 0)}{' '}
            <b>
              {baseToken}
              {hasPerp && ':'}
            </b>
            {hasPerp && <span style={{ color: 'grey' }}>PERP</span>}
          </StyledCell>
        );
      }

      if (row.side === 'Multi' || row.side === 'Chained') {
        sellTokens = row.sell_token ? row.sell_token.split(',').map((token) => token.trim()) : [];
        executedQtys = row.executed_qtys
          ? row.executed_qtys
              .toString()
              .split(',')
              .map((amount) => amount.trim())
          : Array(sellTokens.length).fill(0);

        if (row.side === 'Chained') {
          // For chained orders, sum up quantities by unique token
          const tokenAmountMap = new Map();

          executedQtys.forEach((amount, index) => {
            const token = sellTokens[index] || '';
            const hasPerp = token.includes('PERP');
            const baseToken = hasPerp ? token.split(':')[0] : token;
            const tokenKey = hasPerp ? `${baseToken}:PERP` : baseToken;

            const currentAmount = parseFloat(amount) || 0;
            const existingAmount = tokenAmountMap.get(tokenKey) || 0;
            tokenAmountMap.set(tokenKey, existingAmount + currentAmount);
          });

          combinedQuantities = Array.from(tokenAmountMap.entries()).map(([tokenKey, totalAmount]) => {
            const hasPerp = tokenKey.includes(':PERP');
            const baseToken = hasPerp ? tokenKey.split(':')[0] : tokenKey;
            return (
              <span key={`${totalAmount}-${baseToken}`}>
                {formatQty(totalAmount)}{' '}
                <b>
                  {baseToken}
                  {hasPerp && ':'}
                </b>
                {hasPerp && <span style={{ color: 'grey' }}>PERP</span>}
              </span>
            );
          });
        } else {
          // For multi orders, keep existing behavior
          combinedQuantities = executedQtys.map((amount, index) => {
            const token = sellTokens[index] || '';
            const hasPerp = token.includes('PERP');
            const baseToken = hasPerp ? token.split(':')[0] : token;
            return (
              <span key={`${amount}-${token}`}>
                {formatQty(amount)}{' '}
                <b>
                  {baseToken}
                  {hasPerp && ':'}
                </b>
                {hasPerp && <span style={{ color: 'grey' }}>PERP</span>}
              </span>
            );
          });
        }

        const quantitiesToShow = combinedQuantities.slice(0, 3).map((item, idx) => (
          <React.Fragment key={`quantity-${combinedQuantities[idx].key}`}>
            {item}
            {idx < Math.min(3, combinedQuantities.length) - 1 && ', '}
          </React.Fragment>
        ));
        return (
          <StyledCell key={column.id} width={column.width}>
            <Tooltip
              arrow
              placement='right'
              title={
                combinedQuantities.length > 3 ? (
                  <div
                    style={{
                      whiteSpace: 'pre-line',
                      fontSize: '0.75rem',
                    }}
                  >
                    {combinedQuantities.map((item, idx) => (
                      <React.Fragment key={`tooltip-${item.key}`}>
                        {item}
                        {idx < combinedQuantities.length - 1 && ',\n'}
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  ''
                )
              }
            >
              <b>
                {quantitiesToShow}
                {combinedQuantities.length > 3 && ', ...'}
              </b>
            </Tooltip>
          </StyledCell>
        );
      }
      const hasPerp = row.buy_token.includes('PERP');
      const baseToken = hasPerp ? row.buy_token.split(':')[0] : row.buy_token;
      return (
        <StyledCell key={column.id} width={column.width}>
          {formatQty(row.executed_buy_qty)}{' '}
          <b>
            {baseToken}
            {hasPerp && ':'}
          </b>
          {hasPerp && <span style={{ color: 'grey' }}>PERP</span>}
        </StyledCell>
      );
    }

    case 'duration': {
      // Hide duration for OKXDEX orders
      const isDexOrder =
        Array.isArray(row.unique_venues) && row.unique_venues.some((venue) => venue.includes('OKXDEX'));
      if (isDexOrder) {
        return <StyledCell key={column.id} width={column.width} />;
      }
      return (
        <StyledCell key={column.id} width={column.width}>
          {calculateDurationDisplay(row.duration)}
        </StyledCell>
      );
    }

    case 'pov': {
      // Hide participation rate for OKXDEX orders
      const isDexOrder =
        Array.isArray(row.unique_venues) && row.unique_venues.some((venue) => venue.includes('OKXDEX'));
      if (isDexOrder) {
        return <StyledCell key={column.id} width={column.width} />;
      }
      return (
        <StyledCell key={column.id} width={column.width}>
          {row.benchmarks && Object.keys(row.benchmarks).length !== 0 ? (
            <div className={row.benchmarks.pov}>{Number(row.benchmarks.pov).toFixed(4)}%</div>
          ) : (
            <span style={{ color: 'grey' }}>-</span>
          )}
        </StyledCell>
      );
    }

    case 'vwap_cost': {
      // Hide VWAP cost for OKXDEX orders
      const isDexOrder =
        Array.isArray(row.unique_venues) && row.unique_venues.some((venue) => venue.includes('OKXDEX'));
      if (isDexOrder) {
        return <StyledCell key={column.id} width={column.width} />;
      }
      return (
        <StyledCell key={column.id} width={column.width}>
          {row.benchmarks && Object.keys(row.benchmarks).length !== 0 ? (
            <div
              style={{
                color: Number(row.benchmarks.vwap_cost) < 0 ? theme.palette.success.main : theme.palette.error.main,
              }}
            >
              {Number(row.benchmarks.vwap_cost).toFixed(4)} bps
            </div>
          ) : (
            <span style={{ color: 'grey' }}>-</span>
          )}
        </StyledCell>
      );
    }

    case 'arrival_cost': {
      // Hide arrival cost for OKXDEX orders
      const isDexOrder =
        Array.isArray(row.unique_venues) && row.unique_venues.some((venue) => venue.includes('OKXDEX'));
      if (isDexOrder) {
        return <StyledCell key={column.id} width={column.width} />;
      }
      return (
        <StyledCell key={column.id} width={column.width}>
          {row.benchmarks && Object.keys(row.benchmarks).length !== 0 ? (
            <div
              style={{
                color: Number(row.benchmarks.arrival_cost) < 0 ? theme.palette.success.main : theme.palette.error.main,
              }}
            >
              {Number(row.benchmarks.arrival_cost).toFixed(4)} bps
            </div>
          ) : (
            <span style={{ color: 'grey' }}>-</span>
          )}
        </StyledCell>
      );
    }

    default:
      return displayDefaultTableCell(column, value);
  }
}
