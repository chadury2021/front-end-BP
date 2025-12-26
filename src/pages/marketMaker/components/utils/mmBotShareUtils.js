import numbro from 'numbro';

/**
 * Formats a currency amount to a string with dollar sign and thousands separator
 * @param {number} amount - The amount to format
 * @returns {string} Formatted currency string (e.g., "$249,987.61") or "N/A"
 */
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return 'N/A';
  }
  return `$${numbro(amount).format({ thousandSeparated: true, mantissa: 2 })}`;
}

/**
 * Formats duration in minutes to a readable string
 * @param {number} minutes - Duration in minutes (can be decimal)
 * @returns {string} Formatted duration (e.g., "26.3 min" or "1h 15 min")
 */
export function formatDuration(minutes) {
  if (minutes === null || minutes === undefined || Number.isNaN(Number(minutes))) {
    return 'N/A';
  }

  const totalMinutes = Number(minutes);
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;

  if (hours > 0) {
    // Show integer minutes if whole number, otherwise show one decimal
    const formattedMinutes = remainingMinutes % 1 === 0 ? remainingMinutes.toFixed(0) : remainingMinutes.toFixed(1);
    return `${hours}h ${formattedMinutes} min`;
  }
  // Show integer minutes if whole number, otherwise show one decimal
  const formattedMinutes = totalMinutes % 1 === 0 ? totalMinutes.toFixed(0) : totalMinutes.toFixed(1);
  return `${formattedMinutes} min`;
}

/**
 * Calculates duration in minutes from start and end timestamps
 * @param {string|Date} timeStart - Start time (ISO string or Date object)
 * @param {string|Date} timeEnd - End time (ISO string or Date object)
 * @returns {number} Duration in minutes (decimal) or 0 if invalid
 */
export function calculateDuration(timeStart, timeEnd) {
  if (!timeStart || !timeEnd) {
    return 0;
  }

  try {
    const start = new Date(timeStart);
    const end = new Date(timeEnd);
    const durationMs = end - start;

    if (durationMs < 0 || Number.isNaN(durationMs)) {
      return 0;
    }

    return durationMs / 1000 / 60; // Convert to minutes
  } catch (error) {
    return 0;
  }
}

/**
 * Selects the appropriate graphic based on MM PnL
 * @param {number} mmPnL - Market Maker Profit and Loss (can be negative)
 * @param {object} graphics - Object containing imported graphic images
 * @returns {string} Path to the selected graphic image
 */
export function selectGraphic(mmPnL, graphics) {
  if (mmPnL === null || mmPnL === undefined || Number.isNaN(Number(mmPnL))) {
    // Random selection from neutral graphics for null/undefined
    const neutralGraphics = [graphics.graphic3, graphics.graphic4, graphics.graphic5];
    const randomIndex = Math.floor(Math.random() * neutralGraphics.length);
    return neutralGraphics[randomIndex];
  }

  const pnl = Number(mmPnL);
  if (pnl > 0) {
    // Positive PnL -> stonks (graphic2)
    return graphics.graphic2;
  } if (pnl < 0) {
    // Negative PnL -> not-stonks (graphic1)
    return graphics.graphic1;
  }
    // Zero PnL -> random from neutral graphics
    const neutralGraphics = [graphics.graphic3, graphics.graphic4, graphics.graphic5];
    const randomIndex = Math.floor(Math.random() * neutralGraphics.length);
    return neutralGraphics[randomIndex];

}

