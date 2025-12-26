import React from 'react';
import HighchartsReact from 'highcharts-react-official';
import Highcharts from 'highcharts';
import { useTheme } from '@mui/system';


export default function SparkChart({ data = [] }) {
  const theme = useTheme();
  const options = {
    chart: {
      type: 'spline',
      height: 50,
      width: 100,
      backgroundColor: 'transparent',
      spacing: [0, 0, 0, 0],
    },
    title: { text: null },
    xAxis: { visible: false, min: 0, max: data.length - 1 },
    yAxis: { visible: false },
    legend: { enabled: false },
    credits: { enabled: false },
    tooltip: { enabled: false },
    plotOptions: {
      series: {
        marker: { enabled: false }, // ✅ Removes points
        lineWidth: 2, // ✅ Ensures visible smooth lines
      },
    },
    series: [
      {
        data,
        color: theme.palette.charts.green,
      },
    ],
  };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
