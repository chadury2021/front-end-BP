// Exit condition utility functions
import { getExitStrategyFromUrgency } from './urgencyUtils';

/**
 * Create exit conditions object from form data
 * @param {Object} params - Parameters object
 * @param {string} params.takeProfitPrice - Take profit price
 * @param {string} params.takeProfitUrgency - Take profit urgency
 * @param {string} params.takeProfitPercentage - Take profit percentage
 * @param {string} params.stopLossPrice - Stop loss price
 * @param {string} params.stopLossUrgency - Stop loss urgency
 * @param {string} params.stopLossPercentage - Stop loss percentage
 * @returns {Object|null} Exit conditions object or null if no conditions
 */
export const createExitConditions = ({
  takeProfitPrice,
  takeProfitUrgency,
  takeProfitPercentage,
  stopLossPrice,
  stopLossUrgency,
  stopLossPercentage,
}) => {
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

  return Object.keys(exitConditions).length > 0 ? exitConditions : null;
};
