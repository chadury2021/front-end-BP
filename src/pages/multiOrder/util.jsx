import { getOrderBook } from '../../apiServices';

export const fetchPreviewPrice = async (exchange, pair, showAlert) => {
  let price = -1;

  try {
    const result = await getOrderBook(exchange, pair);

    if (result && result.asks.length > 0 && result.bids.length > 0) {
      price = (result.asks[0].price + result.bids[0].price) / 2;
    }
  } catch (e) {
    showAlert({
      message: `Could not fetch price for ${pair}@${exchange}`,
      severity: 'error',
    });
  }

  return price;
};
