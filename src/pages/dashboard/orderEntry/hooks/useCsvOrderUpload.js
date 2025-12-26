import { useCallback, useContext, useMemo, useRef, useState } from 'react';

import { submitOrder, ApiError } from '@/apiServices';
import { ErrorContext } from '@/shared/context/ErrorProvider';
import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';

const HEADER_ALIASES = {
  accounts: ['accounts', 'account', 'account_names'],
  pair: ['pair', 'symbol', 'market'],
  side: ['side', 'direction'],
  base_asset_qty: ['base_asset_qty', 'base_qty', 'base_quantity', 'buy_token_amount'],
  quote_asset_qty: ['quote_asset_qty', 'quote_qty', 'quote_quantity', 'sell_token_amount'],
  duration: ['duration', 'duration_seconds', 'seconds'],
  strategy: ['strategy', 'trajectory', 'strategy_id', 'trajectory_id'],
  limit_price: ['limit_price', 'price'],
  notes: ['notes', 'note'],
  order_condition: ['order_condition', 'condition'],
  pov_limit: ['pov_limit', 'pov'],
  pov_target: ['pov_target', 'target_pov'],
  stop_price: ['stop_price', 'stop'],
  strategy_params: ['strategy_params', 'params'],
  start_datetime: ['start_datetime', 'start_time', 'start'],
  is_reverse_limit_price: ['is_reverse_limit_price', 'reverse_limit'],
  custom_order_id: ['custom_order_id', 'client_order_id', 'order_id'],
  pos_side: ['pos_side', 'position_side'],
  order_slices: ['order_slices', 'slices'],
  engine_passiveness: ['engine_passiveness', 'passiveness'],
  schedule_discretion: ['schedule_discretion', 'discretion'],
  alpha_tilt: ['alpha_tilt', 'alphatilt'],
  target_time: ['target_time'],
  max_otc: ['max_otc'],
};

const REQUIRED_COLUMNS = ['accounts', 'pair', 'side', 'strategy'];

const normalizeHeader = (header = '') => {
  return header.trim().toLowerCase().replace(/\s+/g, '_');
};

const mapHeaderToCanonical = (header) => {
  const normalized = normalizeHeader(header);
  const canonical = Object.entries(HEADER_ALIASES).find(([, aliases]) => aliases.includes(normalized));
  if (canonical) return canonical[0];
  return normalized;
};

const parseCsv = (text) => {
  if (!text) {
    return [];
  }

  const rows = [];
  let cell = '';
  let row = [];
  let insideQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const nextChar = text[i + 1];

    let handled = false;

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        cell += '"';
        i += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      handled = true;
    } else if ((char === ',' || char === '\t') && !insideQuotes) {
      row.push(cell);
      cell = '';
      handled = true;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      row.push(cell);
      cell = '';
      if (char === '\r' && nextChar === '\n') {
        i += 1;
      }
      if (row.some((value) => String(value || '').trim() !== '')) {
        rows.push(row);
      }
      row = [];
      handled = true;
    }

    if (!handled) {
      cell += char;
    }
  }

  row.push(cell);
  if (row.some((value) => String(value || '').trim() !== '')) {
    rows.push(row);
  }

  return rows;
};

const splitMultiValue = (value) => {
  if (!value) return [];
  return String(value)
    .split(/[;|]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const parseBoolean = (value) => {
  if (value === undefined || value === null) return undefined;
  const normalized = String(value).trim().toLowerCase();
  if (['true', '1', 'yes', 'y'].includes(normalized)) return true;
  if (['false', '0', 'no', 'n'].includes(normalized)) return false;
  return undefined;
};

const parsePercent = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const normalized = String(value).replace('%', '').trim();
  if (normalized === '') return undefined;
  const numeric = Number(normalized);
  if (Number.isNaN(numeric)) {
    throw new Error(`Invalid percent value "${value}"`);
  }
  return numeric > 1 ? numeric / 100 : numeric;
};

const parseQuantity = (value, fieldName) => {
  if (value === undefined || value === null) return undefined;
  const trimmed = String(value).trim();
  if (trimmed === '') return undefined;
  if (Number.isNaN(Number(trimmed))) {
    throw new Error(`Invalid ${fieldName} "${value}"`);
  }
  return trimmed;
};

const parseStrategyParams = (raw) => {
  if (!raw) return undefined;
  if (typeof raw === 'object') return raw;
  const trimmed = String(raw).trim();
  if (!trimmed) return undefined;

  try {
    return JSON.parse(trimmed);
  } catch (e) {
    // fall back to key=value pairs delimited by | or ,
    const segments = trimmed.split(/[|,]/).map((segment) => segment.trim()).filter(Boolean);
    if (segments.length === 0) {
      throw new Error(`Invalid strategy_params "${raw}". Expected JSON or key=value pairs.`);
    }

    const params = segments.reduce((acc, segment) => {
      const delimiterIndex = segment.indexOf('=');
      const altDelimiterIndex = segment.indexOf(':');
      const index = delimiterIndex >= 0 ? delimiterIndex : altDelimiterIndex;
      if (index === -1) {
        throw new Error(`Invalid strategy_params segment "${segment}". Use key=value format.`);
      }
      const key = segment.slice(0, index).trim();
      const valueRaw = segment.slice(index + 1).trim();

      if (!key) {
        throw new Error(`Invalid strategy_params segment "${segment}". Key cannot be empty.`);
      }

      const normalizedValue = (() => {
        const lower = valueRaw.toLowerCase();
        if (['true', 'false'].includes(lower)) {
          return lower === 'true';
        }
        if (lower === 'null') {
          return null;
        }
        if (lower === 'undefined') {
          return undefined;
        }
        const numeric = Number(valueRaw);
        if (!Number.isNaN(numeric)) {
          return numeric;
        }
        return valueRaw;
      })();

      acc[key] = normalizedValue;
      return acc;
    }, {});

    return params;
  }
};

const resolvePair = (tokenPairs, rawPair) => {
  if (!rawPair) return null;
  const target = String(rawPair).trim();
  const normalized = target.toLowerCase();
  return (
    (tokenPairs || []).find((pair) => pair.id.toLowerCase() === normalized || pair.label?.toLowerCase() === normalized) ||
    null
  );
};

const resolveStrategy = (strategies, rawStrategy) => {
  if (!rawStrategy) return null;
  const value = String(rawStrategy).trim();
  if (!value) return null;
  const strategyMap = strategies || {};
  if (strategyMap[value]) return strategyMap[value].id || value;
  const match = Object.values(strategyMap).find((strategy) => strategy.name?.toLowerCase() === value.toLowerCase());
  if (match) {
    return match.id;
  }
  return value;
};

const sanitizeRow = (row) => {
  return Object.entries(row).reduce((acc, [key, value]) => {
    const trimmed = typeof value === 'string' ? value.trim() : value;
    if (trimmed === undefined || trimmed === null) return acc;
    acc[key] = trimmed;
    return acc;
  }, {});
};

const buildOrderPayload = (row, context) => {
  const { initialLoadValue, defaultDuration } = context;
  const { accounts: accountsMap = {}, tokenPairs = [], trajectories = {} } = initialLoadValue;

  const sanitizedRow = sanitizeRow(row);
  const rowDescriptor = `Row ${context.rowNumber}`;

  REQUIRED_COLUMNS.forEach((column) => {
    if (!sanitizedRow[column]) {
      throw new Error(`${rowDescriptor}: Missing required column "${column}"`);
    }
  });

  const accountNames = splitMultiValue(sanitizedRow.accounts);
  if (accountNames.length === 0) {
    throw new Error(`${rowDescriptor}: Provide at least one account`);
  }

  const unknownAccounts = accountNames.filter((name) => !accountsMap[name]);
  if (unknownAccounts.length > 0) {
    throw new Error(`${rowDescriptor}: Unknown account(s) ${unknownAccounts.join(', ')}`);
  }

  const pair = resolvePair(tokenPairs, sanitizedRow.pair);
  if (!pair) {
    throw new Error(`${rowDescriptor}: Unknown pair "${sanitizedRow.pair}"`);
  }

  const side = String(sanitizedRow.side).toLowerCase();
  if (!['buy', 'sell'].includes(side)) {
    throw new Error(`${rowDescriptor}: Side must be "buy" or "sell"`);
  }

  const baseQty = parseQuantity(sanitizedRow.base_asset_qty, 'base_asset_qty');
  const quoteQty = parseQuantity(sanitizedRow.quote_asset_qty, 'quote_asset_qty');
  if (baseQty && quoteQty) {
    throw new Error(`${rowDescriptor}: Provide only one of base_asset_qty or quote_asset_qty`);
  }
  if (!baseQty && !quoteQty) {
    throw new Error(`${rowDescriptor}: Provide base_asset_qty or quote_asset_qty`);
  }

  const strategy = resolveStrategy(trajectories, sanitizedRow.strategy);
  if (!strategy) {
    throw new Error(`${rowDescriptor}: Unknown strategy "${sanitizedRow.strategy}"`);
  }

  let duration = sanitizedRow.duration ? Number(sanitizedRow.duration) : undefined;
  if (Number.isNaN(duration) || duration <= 0) {
    duration = undefined;
  }

  if (!duration && !sanitizedRow.pov_target) {
    const fallbackDuration = Number(defaultDuration);
    if (Number.isNaN(fallbackDuration) || fallbackDuration <= 0) {
      throw new Error(`${rowDescriptor}: Duration is required and must be a positive number`);
    }
    duration = fallbackDuration;
  }

  const payload = {
    accounts: accountNames,
    pair: pair.id,
    side,
    strategy,
    ...(duration ? { duration: Math.floor(duration) } : {}),
    ...(baseQty ? { base_asset_qty: baseQty } : { quote_asset_qty: quoteQty }),
  };

  if (sanitizedRow.limit_price) payload.limit_price = sanitizedRow.limit_price;
  if (sanitizedRow.notes) payload.notes = sanitizedRow.notes;
  if (sanitizedRow.order_condition) payload.order_condition_normal = sanitizedRow.order_condition;
  if (sanitizedRow.pov_limit) payload.pov_limit = parsePercent(sanitizedRow.pov_limit);
  if (sanitizedRow.pov_target) payload.pov_target = parsePercent(sanitizedRow.pov_target);
  if (sanitizedRow.stop_price) payload.stop_price = sanitizedRow.stop_price;
  if (sanitizedRow.strategy_params) payload.strategy_params = parseStrategyParams(sanitizedRow.strategy_params);
  if (sanitizedRow.start_datetime) payload.start_datetime = sanitizedRow.start_datetime;
  const reverseLimit = parseBoolean(sanitizedRow.is_reverse_limit_price);
  if (reverseLimit !== undefined) payload.is_reverse_limit_price = reverseLimit;
  if (sanitizedRow.custom_order_id) payload.custom_order_id = sanitizedRow.custom_order_id;
  if (sanitizedRow.pos_side) payload.pos_side = sanitizedRow.pos_side.toLowerCase();
  if (sanitizedRow.order_slices) payload.order_slices = Number(sanitizedRow.order_slices);
  if (sanitizedRow.engine_passiveness) payload.engine_passiveness = Number(sanitizedRow.engine_passiveness);
  if (sanitizedRow.schedule_discretion) payload.schedule_discretion = Number(sanitizedRow.schedule_discretion);
  if (sanitizedRow.alpha_tilt) payload.alpha_tilt = Number(sanitizedRow.alpha_tilt);
  if (sanitizedRow.target_time) payload.target_time = sanitizedRow.target_time;
  if (sanitizedRow.max_otc) payload.max_otc = parsePercent(sanitizedRow.max_otc);

  return payload;
};

const normalizeRows = (rawRows) => {
  if (!rawRows || rawRows.length === 0) {
    return [];
  }
  const [headerRow, ...dataRows] = rawRows;
  const canonicalHeaders = headerRow.map(mapHeaderToCanonical);

  return dataRows
    .map((row) => {
      if (!row || row.length === 0) {
        return null;
      }
      return canonicalHeaders.reduce((acc, header, index) => {
        acc[header] = row[index] !== undefined ? row[index] : '';
        return acc;
      }, {});
    })
    .filter((row) => {
      if (!row) return false;
      return Object.values(row).some((value) => String(value || '').trim() !== '');
    });
};

const summarizeResults = (results) => {
  const successCount = results.filter((result) => result.success).length;
  const failureEntries = results.filter((result) => !result.success);
  const failureCount = failureEntries.length;

  if (failureCount === 0) {
    return {
      severity: 'success',
      message: `CSV upload complete: submitted ${successCount} order${successCount === 1 ? '' : 's'}.`,
    };
  }

  const firstError = failureEntries[0]?.errorMessage ?? 'Unknown error';
  return {
    severity: failureCount === results.length ? 'error' : 'warning',
    message: `CSV upload complete: submitted ${successCount} order${successCount === 1 ? '' : 's'}, ${failureCount} failed. First error: ${firstError}`,
  };
};

export const useCsvOrderUpload = () => {
  const fileInputRef = useRef(null);
  const [isParsing, setIsParsing] = useState(false);
  const { showAlert } = useContext(ErrorContext);
  const { initialLoadValue, selectedDuration } = useOrderForm();
  const { isRetail } = useUserMetadata();

  const schemaTooltip = useMemo(() => {
    return [
      'CSV format:',
      'Required columns: Accounts, Pair, Side, Strategy.',
      'Provide either Base_Asset_Qty or Quote_Asset_Qty (one per row).',
      'Optional columns: Duration (seconds), Limit_Price, Notes, Order_Condition, POV_Limit, POV_Target, Stop_Price, Strategy_Params (JSON or key=value pairs), Start_Datetime, Is_Reverse_Limit_Price, Custom_Order_Id.',
      'Separate multiple accounts with ";" inside the Accounts cell.',
    ].join('\n');
  }, []);

  const openFilePicker = useCallback(() => {
    if (isRetail) {
      showAlert?.({
        severity: 'info',
        message: 'CSV upload is disabled for retail accounts.',
      });
      return;
    }
    fileInputRef.current?.click();
  }, [isRetail, showAlert]);

  const validateAndParseRows = useCallback(
    async (normalizedRows) => {
      const { tokenPairs = [], trajectories = {} } = initialLoadValue || {};

      const validatedRows = normalizedRows.map((rowData, index) => {
        const rowNumber = index + 2; // account for header row
        try {
          const payload = buildOrderPayload(rowData, {
            initialLoadValue,
            defaultDuration: selectedDuration || 3600,
            rowNumber,
          });

          // Enrich with display-friendly metadata for confirmation UI
          const pairId = payload.pair;
          const pairInfo = tokenPairs.find((pair) => pair.id === pairId) || null;

          let baseSymbol;
          let quoteSymbol;

          if (pairInfo && pairInfo.base && pairInfo.quote) {
            baseSymbol = pairInfo.base;
            quoteSymbol = pairInfo.quote;
          } else if (typeof pairId === 'string') {
            const [rawBase, rawQuote] = pairId.split('-');
            const cleanToken = (token) => {
              if (!token) return undefined;
              const cleaned = token.includes(':') ? token.split(':')[0] : token;
              return cleaned;
            };
            baseSymbol = cleanToken(rawBase);
            quoteSymbol = cleanToken(rawQuote);
          }

          const strategyMeta = trajectories[payload.strategy];
          const strategyName = strategyMeta?.name || payload.strategy;

          return {
            isValid: true,
            rowNumber,
            rowData,
            payload,
            errorMessage: null,
            baseSymbol,
            quoteSymbol,
            strategyName,
          };
        } catch (error) {
          const message =
            error instanceof ApiError ? error.message : error?.message || 'Failed to validate row.';
          return {
            isValid: false,
            rowNumber,
            rowData,
            payload: null,
            errorMessage: message,
          };
        }
      });

      return validatedRows;
    },
    [initialLoadValue, selectedDuration]
  );

  const processFile = useCallback(
    async (file, inputElementRef) => {
      if (isRetail) {
        showAlert?.({
          severity: 'info',
          message: 'CSV upload is disabled for retail accounts.',
        });
        if (inputElementRef) {
          // eslint-disable-next-line no-param-reassign
          inputElementRef.value = '';
        }
        return null;
      }

      setIsParsing(true);
      try {
        if (
          !initialLoadValue ||
          !initialLoadValue.accounts ||
          Object.keys(initialLoadValue.accounts).length === 0 ||
          !initialLoadValue.tokenPairs ||
          initialLoadValue.tokenPairs.length === 0
        ) {
          throw new Error('Order form data is still loading. Please try again once accounts and pairs are available.');
        }

        let content = await file.text();
        if (content.charCodeAt(0) === 0xfeff) {
          content = content.slice(1);
        }

        const rawRows = parseCsv(content);
        if (!rawRows.length) {
          throw new Error('CSV file is empty.');
        }

        const normalizedRows = normalizeRows(rawRows);
        if (!normalizedRows.length) {
          throw new Error('CSV file does not contain any data rows.');
        }

        const validatedRows = await validateAndParseRows(normalizedRows);

        return validatedRows;
      } catch (error) {
        const message = error instanceof ApiError ? error?.message : error?.message || 'Failed to process CSV.';
        showAlert?.({
          severity: 'error',
          message,
        });
        return null;
      } finally {
        if (inputElementRef) {
          // eslint-disable-next-line no-param-reassign
          inputElementRef.value = '';
        }
        setIsParsing(false);
      }
    },
    [initialLoadValue, showAlert, validateAndParseRows, isRetail]
  );

  const handleFileChange = useCallback(
    async (event) => {
      const inputElement = event.target;
      const files = inputElement?.files;
      if (!files || files.length === 0) {
        return;
      }

      const file = files[0];
      if (!file) {
        return;
      }

      await processFile(file, inputElement);
    },
    [processFile]
  );

  const submitValidatedOrders = useCallback(
    async (validatedRows) => {
      const validRows = validatedRows.filter((row) => row.isValid);

      if (validRows.length === 0) {
        showAlert?.({
          severity: 'error',
          message: 'No valid orders to submit.',
        });
        return { success: false, results: [] };
      }

      const results = await Promise.all(
        validRows.map(async (row) => {
          try {
            const response = await submitOrder(row.payload);
            return {
              success: true,
              rowNumber: row.rowNumber,
              orderId: response?.id,
            };
          } catch (error) {
            const message =
              error instanceof ApiError ? error.message : error?.message || 'Failed to submit order.';
            // Error is already handled via errorMessage in return value
            return {
              success: false,
              rowNumber: row.rowNumber,
              errorMessage: message,
            };
          }
        })
      );

      const summary = summarizeResults(results);
      showAlert?.(summary);

      return { success: true, results };
    },
    [showAlert]
  );

  return {
    fileInputRef,
    handleFileChange,
    isParsing,
    isRetail,
    openFilePicker,
    schemaTooltip,
    submitValidatedOrders,
  };
};


