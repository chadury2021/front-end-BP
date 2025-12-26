export const transformEventsToChartData = (events = []) => {
  if (!events || !Array.isArray(events) || events.length === 0) return [];

  // 1. Group events by timestamp and sum data
  const summedDataByTimestamp = events.reduce((acc, event) => {
    const { timestamp } = event; // Assuming timestamp is available
    const dataValue = typeof event.data === 'number' ? event.data : 0; // Ensure data is numeric

    if (timestamp !== undefined) {
      // Only process events with a valid timestamp
      if (!acc[timestamp]) {
        acc[timestamp] = 0;
      }
      acc[timestamp] += dataValue;
    }
    return acc;
  }, {});

  // 2. Convert the aggregated data back into an array format [[timestamp, summed_data], ...]
  const chartData = Object.entries(summedDataByTimestamp).map(([timestampStr, summedValue]) => [
    parseInt(timestampStr, 10), // Convert timestamp string key back to number
    summedValue,
  ]);

  // 3. Sort by timestamp (important for line/area charts)
  chartData.sort((a, b) => a[0] - b[0]);

  return chartData;
};
