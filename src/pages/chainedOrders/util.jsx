import { getOrderBook } from '../../apiServices';

// Fetch the basic limit price for a given pair and exchange
export const fetchChainedOrderPreviewPrice = async (exchange, pair, showAlert) => {
  let price = null;

  try {
    // Assuming getOrderBook fetches the best available limit price
    const result = await getOrderBook(exchange, pair);

    if (result && result.price) {
      // If result contains the price directly, assign it to price
      price = result.price;
    }
  } catch (e) {
    showAlert({
      message: `Could not fetch price for ${pair}@${exchange}`,
      severity: 'error',
    });
  }

  return price;
};
