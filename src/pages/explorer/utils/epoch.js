const EPOCH_START = 0;
const EPOCH_LENGTH = 600;

export const getEpochFromTimestamp = (timestamp) => {
  return (timestamp - EPOCH_START) / EPOCH_LENGTH;
};

export const getEpochStartAndEnd = (epoch) => {
  return [EPOCH_START + epoch * EPOCH_LENGTH, EPOCH_START + (epoch + 1) * EPOCH_LENGTH];
};

export const getTimestampFromEpoch = (epoch) => {
  const [startTime] = getEpochStartAndEnd(epoch);
  return startTime * 1000; // Convert to milliseconds for JavaScript Date
};
