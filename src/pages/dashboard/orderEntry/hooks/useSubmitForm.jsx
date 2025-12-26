import dayjs from 'dayjs';
import dayjsPluginUTC from 'dayjs-plugin-utc';
import React, { useEffect, useState, useContext } from 'react';

import { useOrderForm } from '@/shared/context/OrderFormProvider';
import { OrderEntryType } from '@/pages/dashboard/orderEntry/util';

import { ErrorContext } from '@/shared/context/ErrorProvider';
import { ApiError, openInNewTab, submitOrder, submitChainedOrder, getMinQty } from '@/apiServices';
import { removeFalsyAndEmptyKeys, smartRound, generateTimestampId } from '@/util';
import { getExitStrategyFromUrgency } from '@/util/urgencyUtils';
import { useUserMetadata } from '@/shared/context/UserMetadataProvider';
import { OPEN_NEW_TAB_ON_SUBMIT } from '@/constants';
import { useSound } from '@/hooks/useSound';
import { useAccountApproval } from '@/shared/context/AccountApprovalProvider';

dayjs.extend(dayjsPluginUTC);

const parseTargetTime = (selectedDuration, targetTime) => {
  const time = targetTime;
  const targetTimeCond = dayjs
    .utc(time)
    .subtract(selectedDuration / 2, 'seconds')
    .format('YYYY-MM-DDTHH:mm');
  return `TIME>dt${targetTimeCond}`;
};

export const useSubmitForm = ({ optionSubmit = false, allowOpenNewTabOnSubmit = true, quickSubmitEnabled = false }) => {
  const { showAlert } = useContext(ErrorContext);
  const { user } = useUserMetadata();
  const { playOrderSuccess } = useSound();
  const [openModal, setOpenModal] = useState(false);
  const [openChainedOrderModal, setOpenChainedOrderModal] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [chainedOrderData, setChainedOrderData] = useState(null);
  const { accountNeedsApproval, openApprovalModal } = useAccountApproval();
  const {
    selectedAccounts,
    baseQty,
    selectedDuration,
    limitPrice,
    notes,
    orderCondition,
    selectedPair,
    quoteQty,
    selectedSide,
    stopPrice,
    selectedStrategy,
    selectedStrategyParams,
    updatePairLeverage,
    povLimit,
    preTradeEstimationData,
    povTarget,
    trajectory,
    targetTime,
    isOOLEnabled,
    setIsOOLEnabled,
    isEntryEnabled,
    alphaTilt,
    passiveness,
    discretion,
    durationStartTime,
    initialLoadValue,
    maxOtcPercentage,
    posSide,
    orderSlices,
    isReverseLimitPrice,
    maxClipSize,
    setMaxClipSize,
    orderEntryType,
    urgency,
    // Exit conditions
    takeProfitPrice,
    stopLossPrice,
    takeProfitUrgency,
    stopLossUrgency,
    takeProfitPercentage,
    stopLossPercentage,
    // Scale orders
    isScaleOrdersOpen,
    scaleOrderCount,
    scaleFromPrice,
    scaleToPrice,
    scalePriceSkew,
    scaleSizeSkew,
    scalePriceInputMode,
  } = useOrderForm();

  // Disable opening new tabs when quick submit is enabled
  const effectiveAllowOpenNewTabOnSubmit = quickSubmitEnabled ? false : allowOpenNewTabOnSubmit;
  const openNewTabOnSubmit =
    effectiveAllowOpenNewTabOnSubmit && user.preferences ? user.preferences[OPEN_NEW_TAB_ON_SUBMIT] : false;

  const { accounts, strategies, trajectories, superStrategies } = initialLoadValue;

  // Check if this should be a chained order
  const shouldCreateChainedOrder = () => {
    // If strategy is not set, it's Simple Order.  Do not create chained order.
    const selectedStrategyObject = strategies[selectedStrategy];
    if (!selectedStrategyObject) return false;

    const durationInMinutes = selectedDuration / 60;

    return durationInMinutes > 1440 && !povTarget;
  };

  // Calculate number of chained orders needed
  const getChainedOrderCount = () => {
    if (!shouldCreateChainedOrder()) return 1;
    const durationInMinutes = selectedDuration / 60;
    return Math.ceil(durationInMinutes / 1440);
  };

  // Create chained order data
  const createChainedOrderData = async () => {
    const orderCount = getChainedOrderCount();
    const durationInMinutes = selectedDuration / 60;
    const durationPerOrder = Math.ceil(durationInMinutes / orderCount);
    const durationPerOrderSeconds = durationPerOrder * 60;

    // Calculate quantities per order
    const baseQtyPerOrder = baseQty ? baseQty / orderCount : null;
    const quoteQtyPerOrder = quoteQty ? quoteQty / orderCount : null;

    // Get strategy UUID from trajectory
    const strategyUUID = trajectory;

    let super_strategy = null;
    if (
      selectedStrategy &&
      superStrategies &&
      superStrategies[selectedStrategy] &&
      superStrategies[selectedStrategy].is_super_strategy
    ) {
      super_strategy = selectedStrategy;
    }

    const ordersInChain = [];

    for (let i = 0; i < orderCount; i += 1) {
      const orderData = {
        pair: selectedPair ? selectedPair.id : selectedPair,
        side: selectedSide,
        priority: i + 1,
        index: i, // Add index field
        id: generateTimestampId(), // Use the utility function
        strategy: strategyUUID, // Use strategy UUID instead of name
        accounts: selectedAccounts,
        duration: durationPerOrderSeconds,
        engine_passiveness: passiveness,
        schedule_discretion: discretion,
        alpha_tilt: alphaTilt,
        order_slices: orderSlices,
        strategy_params: {
          ...selectedStrategyParams,
          max_clip_size: maxClipSize,
        },
        auto_order_metadata: [OrderEntryType.AUTO.key].includes(orderEntryType) ? { urgency } : {},
        pre_trade_data: preTradeEstimationData,
      };

      if (super_strategy) {
        orderData.super_strategy = super_strategy;
      }

      // Only add limit_price if it's not null or empty
      if (limitPrice && trajectories[trajectory]?.name !== 'Market') {
        orderData.limit_price = limitPrice;
        orderData.strategy_params.ool_pause = isOOLEnabled;
      }

      // Set both quantity fields - the backend will use the appropriate one
      if (baseQtyPerOrder !== null) {
        orderData.base_asset_qty = baseQtyPerOrder.toString();
      }
      if (quoteQtyPerOrder !== null) {
        orderData.quote_asset_qty = quoteQtyPerOrder.toString();
      }

      ordersInChain.push(orderData);
    }

    // Return only orders_in_chain array, matching the working structure from ChainedOrdersEntryPage.jsx
    return {
      orders_in_chain: ordersInChain,
    };
  };

  const parseFormData = (confirmation = false) => {
    const transformPov = (pov) => {
      return pov ? parseFloat(pov) / 100 : null;
    };

    const getPair = () => {
      if (selectedPair) {
        if (optionSubmit) {
          return selectedPair.name;
        }
        if (!confirmation) {
          return selectedPair.id;
        }
        return selectedPair.label;
      }
      return selectedPair;
    };

    let super_strategy = null;
    if (
      selectedStrategy &&
      superStrategies &&
      superStrategies[selectedStrategy] &&
      superStrategies[selectedStrategy].is_super_strategy
    ) {
      super_strategy = selectedStrategy;
    }

    const duration = Math.max(selectedDuration, 60);

    const autoOrderMetadata = [OrderEntryType.AUTO.key].includes(orderEntryType) ? { urgency } : {};

    // Add exit conditions as a single JSON object
    const exitConditions = {};
    if (takeProfitPrice && takeProfitPrice.trim() !== '') {
      exitConditions.takeProfitExit = {
        price: takeProfitPrice,
        type: getExitStrategyFromUrgency(takeProfitUrgency),
        percent: (parseFloat(takeProfitPercentage) / 100).toString(),
      };
    }
    if (stopLossPrice && stopLossPrice.trim() !== '') {
      exitConditions.stopLossExit = {
        price: stopLossPrice,
        type: getExitStrategyFromUrgency(stopLossUrgency),
        percent: (parseFloat(stopLossPercentage) / 100).toString(),
      };
    }

    let sanitizedLimitPrice = limitPrice;
    let sanitizedIsOOLEnabled = isOOLEnabled;

    if (trajectories[trajectory]?.name === 'Market') {
      sanitizedLimitPrice = null;
      sanitizedIsOOLEnabled = false;
    }

    const baseOrder = {
      alpha_tilt: alphaTilt,
      accounts: selectedAccounts,
      base_asset_qty: baseQty,
      duration,
      engine_passiveness: passiveness,
      limit_price: sanitizedLimitPrice,
      is_reverse_limit_price: isReverseLimitPrice,
      notes,
      order_condition:
        superStrategies && superStrategies[super_strategy] && superStrategies[super_strategy].name === 'Target Time'
          ? parseTargetTime(selectedDuration, targetTime)
          : orderCondition,
      pair: getPair(),
      quote_asset_qty: quoteQty,
      schedule_discretion: discretion,
      side: selectedSide,
      stop_price: stopPrice,
      strategy: trajectory,
      strategy_params: {
        ...selectedStrategyParams,
        ool_pause: sanitizedIsOOLEnabled,
        entry: isEntryEnabled,
        max_clip_size: maxClipSize,
      },
      updated_leverage: updatePairLeverage,
      pov_limit: transformPov(povLimit),
      pov_target: transformPov(povTarget),
      pre_trade_data: preTradeEstimationData,
      super_strategy,
      start_datetime: durationStartTime ? durationStartTime.setZone('utc').toISO() : null,
      max_otc: maxOtcPercentage / 100,
      pos_side: posSide,
      order_slices: orderSlices,
      auto_order_metadata: autoOrderMetadata,
      exit_conditions: Object.keys(exitConditions).length > 0 ? exitConditions : undefined,
    };

    // Always include scale order parameters if scale order count > 1
    if (scaleOrderCount && scaleOrderCount > 1) {
      // Automatically infer qty mode from which field is filled
      const qtyMode = baseQty && !quoteQty ? 'base' : 'quote';
      const totalQty = qtyMode === 'base' ? baseQty : quoteQty;

      // Add scale order parameters to the main order payload
      baseOrder.scale_order_count = Number(scaleOrderCount);
      // Default range signs should align with side: buy => negative range; sell => positive range
      const defaultFrom = selectedSide === 'buy' ? '-1%' : '+0.1%';
      const defaultTo = selectedSide === 'buy' ? '-0.1%' : '+1%';

      if (scalePriceInputMode === 'percentage') {
        const prefix = selectedSide === 'buy' ? '-' : '+';
        const norm = (v) => (v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim());
        const fromRaw = norm(scaleFromPrice);
        const toRaw = norm(scaleToPrice);
        baseOrder.scale_from_price = fromRaw ? `${prefix}${fromRaw}%` : defaultFrom;
        baseOrder.scale_to_price = toRaw ? `${prefix}${toRaw}%` : defaultTo;
      } else {
        // absolute mode: values are absolute prices
        const norm = (v) => (v === null || v === undefined || String(v).trim() === '' ? null : String(v).trim());
        const fromRaw = norm(scaleFromPrice);
        const toRaw = norm(scaleToPrice);
        baseOrder.scale_from_price = fromRaw || defaultFrom;
        baseOrder.scale_to_price = toRaw || defaultTo;
      }
      const clamp = (v, min, max) => Math.max(min, Math.min(max, Number(v || 0)));
      baseOrder.scale_price_skew = clamp(scalePriceSkew, -1, 1);
      baseOrder.scale_size_skew = clamp(scaleSizeSkew, -1, 1);
    }

    return baseOrder;
  };

  const getOrderPath = (order) => {
    let url = null;
    if (order.parent_order) {
      url = `/multi_order/${order.parent_order}`;
    } else if (order.is_chained) {
      url = `/chained_orders/${order.chained_order}`;
    } else if (order.is_simple) {
      url = `/simple_order/${order.id}`;
    } else {
      url = `/order/${order.id}`;
    }

    return url;
  };

  const getFormData = (confirmation = false) => {
    const formData = parseFormData(confirmation);
    const vettedFormData = confirmation
      ? formData
      : {
          ...removeFalsyAndEmptyKeys(formData),
          alpha_tilt: alphaTilt,
          engine_passiveness: passiveness,
          schedule_discretion: discretion,
        };
    return vettedFormData;
  };

  // Helper function to validate minimum quantities
  const validateMinQuantity = async (pair, accountNames, quantity, isBase, orderType = 'order') => {
    if (!quantity) return null;

    try {
      const result = await getMinQty({
        pair,
        exchange_names: accountNames.map((name) => accounts[name].exchangeName),
        is_base: isBase,
      });

      const minQty = result.min_qty;
      if (minQty && quantity < minQty) {
        const assetType = isBase ? 'base' : 'quote';
        const precision = isBase ? 0 : 2;
        return `Invalid size: Minimum ${assetType} quantity ${orderType === 'chained' ? 'per chained order' : ''} is ${smartRound(minQty, precision)}`;
      }
    } catch (e) {
      // do nothing if the min qty is not found
    }

    return null;
  };

  const handleSubmit = async (event) => {
    if (event) {
      event.preventDefault();
    }

    setIsSubmitted(true);

    const accountObj = selectedAccounts.length > 0 ? accounts[selectedAccounts[0]] : null;
    const needsApproval = await accountNeedsApproval(accountObj);
    if (needsApproval) {
      openApprovalModal(accountObj);
      setIsSubmitted(false);
      return null;
    }

    // Determine if this should be a chained order
    const isChainedOrderSubmission = shouldCreateChainedOrder();
    const orderFields = isChainedOrderSubmission ? await createChainedOrderData() : getFormData();

    // Handle min quantity checks for chained orders
    if (isChainedOrderSubmission) {
      const orderCount = getChainedOrderCount();
      const firstOrder = orderFields.orders_in_chain[0];
      const baseQtyPerOrder = firstOrder.base_asset_qty;
      const quoteQtyPerOrder = firstOrder.quote_asset_qty;

      // Validate the appropriate quantity type
      const errorMessage = baseQtyPerOrder
        ? await validateMinQuantity(firstOrder.pair, selectedAccounts, baseQtyPerOrder, true, 'chained')
        : await validateMinQuantity(firstOrder.pair, selectedAccounts, quoteQtyPerOrder, false, 'chained');

      if (errorMessage) {
        showAlert({
          severity: 'error',
          message: errorMessage,
        });
        setOpenChainedOrderModal(false);
        setIsSubmitted(false);
        return null;
      }
    } else {
      // Original min quantity check for single orders
      const errorMessage = orderFields.base_asset_qty
        ? await validateMinQuantity(orderFields.pair, selectedAccounts, orderFields.base_asset_qty, true)
        : await validateMinQuantity(orderFields.pair, selectedAccounts, orderFields.quote_asset_qty, false);

      if (errorMessage) {
        showAlert({
          severity: 'error',
          message: errorMessage,
        });
        setOpenModal(false);
        setIsSubmitted(false);
        return null;
      }
    }

    try {
      let response;

      if (isChainedOrderSubmission) {
        response = await submitChainedOrder(orderFields);
      } else {
        response = await submitOrder(orderFields);
      }

      if (response.id) {
        // Play success sound
        playOrderSuccess();

        // Show success notification
        showAlert({
          severity: 'success',
          message: 'Order submitted successfully!',
        });

        setIsSubmitted(false);
        // Skip opening any page for scale (batch) orders
        const isScaleOrder = scaleOrderCount && Number(scaleOrderCount) > 1;
        if (openNewTabOnSubmit && !isScaleOrder) {
          // For chained orders, the response has the chained order ID directly
          if (isChainedOrderSubmission) {
            openInNewTab(`/chained_orders/${response.id}`);
          } else {
            openInNewTab(getOrderPath(response));
          }
        }

        return response.id;
      }

      showAlert({
        severity: 'error',
        message: response,
      });
    } catch (e) {
      if (e instanceof ApiError) {
        showAlert({
          severity: 'error',
          message: e.message,
        });
      } else {
        throw e;
      }
    } finally {
      setOpenModal(false);
      setOpenChainedOrderModal(false);
      setIsSubmitted(false);
    }
    return null;
  };

  const submitCheck = async (event) => {
    event.preventDefault();

    // If quick submit is enabled, bypass confirmation modal and submit directly
    if (quickSubmitEnabled) {
      try {
        const orderId = await handleSubmit(event);
        if (orderId) {
          // Play success sound
          playOrderSuccess();

          showAlert({
            severity: 'success',
            message: `Successfully submitted ${selectedSide === 'buy' ? 'buy' : 'sell'} order`,
          });
        }
      } catch (error) {
        // Error handling is already done in handleSubmit
      }
      return;
    }

    // Check if this should be a chained order
    if (shouldCreateChainedOrder()) {
      // Create chained order data for the modal
      const chainedOrderDataResult = await createChainedOrderData();
      setOpenChainedOrderModal(true);
      // Store the chained order data for later use
      setChainedOrderData(chainedOrderDataResult);
    } else {
      setOpenModal(true);
    }
  };

  const confirmationModalProps = {
    data: getFormData(true),
    handleConfirm: handleSubmit,
    open: openModal,
    setOpen: setOpenModal,
  };

  const chainedOrderConfirmationModalProps = {
    chainedOrderData: chainedOrderData
      ? {
          ...chainedOrderData,
          accounts: selectedAccounts,
          strategy: trajectory,
          duration: selectedDuration,
          engine_passiveness: passiveness,
          schedule_discretion: discretion,
        }
      : null,
    handleConfirm: handleSubmit,
    open: openChainedOrderModal,
    setOpen: setOpenChainedOrderModal,
  };

  return {
    confirmationModalProps,
    chainedOrderConfirmationModalProps,
    submitCheck,
    isSubmitted,
    getFormData,
    shouldCreateChainedOrder,
    getChainedOrderCount,
    createChainedOrderData,
  };
};
