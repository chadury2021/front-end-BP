import React, { useReducer } from 'react';
import { hasDuplicateKeyValue } from '../../../util';

const initialState = {
  orders: [],
};

function orderFormStateReducer(state, action) {
  switch (action.type) {
    case 'ADD_ROW':
      return {
        ...state,
        orders: [...state.orders, action.payload],
      };

    case 'UPDATE_ROW':
      return {
        ...state,
        orders: state.orders.map((item, index) =>
          index === action.payload.rowIndex ? { ...item, ...action.payload } : item
        ),
      };

    case 'REMOVE_ROW': {
      const filteredAndReIndexed = state.orders
        .filter((_, index) => index !== action.payload.rowIndex)
        .map((item, newIndex) => ({ ...item, index: newIndex }));

      const maxpriority = filteredAndReIndexed.length;
      const adjustedOrders = filteredAndReIndexed.map((item) => {
        return item.priority > maxpriority ? { ...item, priority: maxpriority } : item;
      });

      return {
        ...state,
        orders: adjustedOrders,
      };
    }

    case 'CHANGE_PRIORITY': {
      const { newPriority, id, oldPriority } = action.payload;

      const hasNeighborPriority = hasDuplicateKeyValue(state.orders, 'priority', oldPriority);

      const updatedOrders = state.orders.map((order) => {
        if (order.id === id) {
          return { ...order, priority: newPriority };
        }
        // conditions to ensure sequentialness
        if (newPriority < oldPriority && order.priority > oldPriority && !hasNeighborPriority) {
          return { ...order, priority: order.priority - 1 };
        }
        return order;
      });

      return {
        ...state,
        orders: updatedOrders,
      };
    }

    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}
const useChainOrderReducer = () => {
  const [state, dispatch] = useReducer(orderFormStateReducer, initialState);

  return [state, dispatch];
};

export default useChainOrderReducer;
