import { generateTimestampId, isEmpty } from '../../../util';
import useChainOrderReducer from './useChainOrderReducer';

function useChainOrderActions() {
  const [formState, dispatch] = useChainOrderReducer();

  const addOrderRow = ({ priority = null, getFormData = () => {} }) => {
    const maxPriority = !isEmpty(formState.orders)
      ? formState.orders.reduce((acc, order) => {
          if (order.priority > acc) return order.priority;
          return acc;
        }, 0) + 1
      : 1;
    const newPriority = priority || maxPriority;

    dispatch({
      type: 'ADD_ROW',
      payload: {
        priority: newPriority,
        index: formState.orders.length,
        id: generateTimestampId(),
        ...getFormData(),
      },
    });
  };

  const handlePriorityChange = (event, id, priority) => {
    const newPriority = parseInt(event.target.value, 10);
    const oldPriority = parseInt(priority, 10);
    dispatch({
      type: 'CHANGE_PRIORITY',
      payload: {
        id,
        newPriority,
        oldPriority,
      },
    });
  };

  const handleDeleteOnClick = (event, index) => {
    dispatch({
      type: 'REMOVE_ROW',
      payload: { rowIndex: index },
    });
  };

  return { addOrderRow, handlePriorityChange, handleDeleteOnClick, formState };
}

export default useChainOrderActions;
