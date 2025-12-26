const defaultStrategySettings = {
  duration: 300,
  passiveness: 0.02,
  discretion: 0.06,
  alphaTilt: 0,
  otcPercentage: 0,
  povTarget: '',
  passive_only: false,
  reduce_only: false,
  dicy: false,
  ool_pause: false,
  soft_pause: false,
  activeLimit: false,
  strict_duration: false,
  orderSlices: 2,
  isReverseLimitPrice: false,
  trajectory: 'VWAP', // Default trajectory
};

export default defaultStrategySettings;
