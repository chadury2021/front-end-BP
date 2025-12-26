export const marketOptionDisplayValue = (option) => {
  const displayMessages = {
    spot: 'Spot',
    usd_futures: 'Linear Futures',
    coin_futures: 'Inverse Futures',
    options: 'Options',
    otc: 'OTC',
    unified: 'Unified',
    futures: 'Futures',
  };

  return displayMessages[option] || option;
};
