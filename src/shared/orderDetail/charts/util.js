const commonHorizontalBarOptions = {
  indexAxis: 'y',
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: false,
    },
  },
  scales: {
    x: {
      display: false,
      stacked: true,
      offset: true,
      ticks: {
        max: 100,
      },
    },
    y: {
      afterFit(scale) {
        // eslint-disable-next-line no-param-reassign
        scale.width = 70;
      },
      stacked: true,
    },
  },
  animation: false,
};

const fillRoleColor = ({ theme, role }) => {
  const FILL_ROLE_COLORS = {
    MAKE: theme.palette.charts.green,
    TAKE: theme.palette.charts.red,
    CROSS: theme.palette.charts.orange,
    OTC: theme.palette.charts.OTC,
  };

  return FILL_ROLE_COLORS[role];
};

export { commonHorizontalBarOptions, fillRoleColor };
