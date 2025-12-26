import React, { useEffect, useMemo, useState } from 'react';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { StyledTableCell } from '@/shared/orderTable/util';
import { numberWithCommas, smartRound } from '@/util';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { getFundingOverview } from '@/apiServices';
import LabelTooltip from '@/shared/components/LabelTooltip';
import { useTheme } from '@mui/material/styles';
import typography from '@/theme/typography';
import Skeleton from '@mui/material/Skeleton';

const TIME_WINDOWS = [
  { label: '1D', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '1Y', days: 365 },
];

const METRIC_HEIGHT = '90px';

// Data aggregation functions for different time periods
function groupByDay(fundingData) {
  const dayGroups = {};

  fundingData.forEach((period) => {
    const date = new Date(period.date);
    const dayKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

    if (!dayGroups[dayKey]) {
      dayGroups[dayKey] = {
        date: dayKey,
        periods: [],
      };
    }
    dayGroups[dayKey].periods.push(period);
  });

  return Object.values(dayGroups).map((dayGroup) => {
    // Sort periods by date to ensure we get the latest cumulative funding
    const sortedPeriods = dayGroup.periods.sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
      date: dayGroup.date,
      dailyFunding: dayGroup.periods.reduce((sum, p) => sum + p.dailyFunding, 0),
      cumulativeFunding: sortedPeriods[sortedPeriods.length - 1]?.cumulativeFunding || 0,
      deposits: dayGroup.periods.reduce((sum, p) => sum + p.deposits, 0),
      withdrawals: dayGroup.periods.reduce((sum, p) => sum + p.withdrawals, 0),
    };
  });
}

function groupByWeek(fundingData) {
  const weekGroups = {};

  fundingData.forEach((period) => {
    const date = new Date(period.date);
    // Get start of week (Sunday)
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const weekKey = startOfWeek.toISOString().split('T')[0];

    if (!weekGroups[weekKey]) {
      weekGroups[weekKey] = {
        startDate: weekKey,
        periods: [],
      };
    }
    weekGroups[weekKey].periods.push(period);
  });

  return Object.values(weekGroups).map((weekGroup) => {
    // Sort periods by date to ensure we get the latest cumulative funding
    const sortedPeriods = weekGroup.periods.sort((a, b) => new Date(a.date) - new Date(b.date));
    return {
      date: weekGroup.startDate,
      dailyFunding: weekGroup.periods.reduce((sum, p) => sum + p.dailyFunding, 0),
      cumulativeFunding: sortedPeriods[sortedPeriods.length - 1]?.cumulativeFunding || 0,
      deposits: weekGroup.periods.reduce((sum, p) => sum + p.deposits, 0),
      withdrawals: weekGroup.periods.reduce((sum, p) => sum + p.withdrawals, 0),
    };
  });
}

function formatXAxisCategories(fundingData, days) {
  return fundingData.map((d) => {
    const date = new Date(d.date);
    if (days <= 7) {
      // For 1D and 7D: show shorter format with AM/PM
      return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })}`;
    }
    if (days <= 30) {
      // For 30D: show daily aggregation (date only, no year)
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    // For 1Y: show weekly aggregation (week range, no year)
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + 6);
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
  });
}

function CurrencyTitleTypography(props) {
  return <Typography fontWeight={300} variant='subtitle1' {...props} />;
}

function SubTitleTypography(props) {
  return <Typography color='text.subtitle' fontWeight={300} variant='body1' {...props} />;
}

export default function FundingDashboard({ totalEquity = 0, accountId, exchangeName }) {
  const theme = useTheme();

  // Use theme colors for consistency
  const GREEN = theme.palette.charts.green;
  const RED = theme.palette.charts.red;
  const ORANGE = theme.palette.charts.orange;
  const BLUE = theme.palette.charts.blue;
  const PINK = theme.palette.charts.pinkTransparent;

  // Enhanced color palette using theme colors
  const CHART_COLORS = {
    cumulativeFunding: GREEN,
    dailyFunding: GREEN,
    negativeFunding: RED,
    dailyBorrow: ORANGE,
    deposits: BLUE,
    withdrawals: PINK,
    positions: [
      theme.palette.charts.green,
      theme.palette.charts.orange,
      theme.palette.charts.blue,
      theme.palette.charts.pinkTransparent,
      theme.palette.charts.points,
      theme.palette.charts.OTC,
      theme.palette.charts.gray,
      theme.palette.charts.lightGray,
    ],
  };

  // Updated dark theme with proper font family and consistent colors
  const darkTheme = {
    colors: CHART_COLORS.positions,
    chart: {
      backgroundColor: 'transparent',
      style: {
        fontFamily: theme.typography.fontFamily,
        fontSize: typography.fontSizes[200],
      },
    },
    title: {
      style: {
        color: theme.palette.text.primary,
        fontFamily: theme.typography.fontFamily,
        fontSize: typography.fontSizes[500],
        fontWeight: typography.fontWeights.weight400,
      },
    },
    subtitle: {
      style: {
        color: theme.palette.text.secondary,
        fontFamily: theme.typography.fontFamily,
        fontSize: typography.fontSizes[300],
        fontWeight: typography.fontWeights.weight300,
      },
    },
    xAxis: {
      gridLineColor: theme.palette.charts.gridLines,
      gridLineWidth: 1,
      labels: {
        style: {
          color: theme.palette.text.secondary,
          fontSize: typography.fontSizes[200],
          fontFamily: theme.typography.fontFamily,
          fontWeight: typography.fontWeights.weight300,
        },
      },
      lineColor: theme.palette.charts.gridLines,
      lineWidth: 1,
      minorGridLineColor: theme.palette.background.base,
      tickColor: theme.palette.charts.gridLines,
      tickWidth: 1,
      title: {
        style: {
          color: theme.palette.text.secondary,
          fontSize: typography.fontSizes[300],
          fontFamily: theme.typography.fontFamily,
          fontWeight: typography.fontWeights.weight300,
        },
      },
    },
    yAxis: {
      gridLineColor: theme.palette.charts.gridLines,
      gridLineWidth: 1,
      labels: {
        style: {
          color: theme.palette.text.secondary,
          fontSize: typography.fontSizes[200],
          fontFamily: theme.typography.fontFamily,
          fontWeight: typography.fontWeights.weight300,
        },
      },
      lineColor: theme.palette.charts.gridLines,
      lineWidth: 1,
      minorGridLineColor: theme.palette.background.base,
      tickColor: theme.palette.charts.gridLines,
      tickWidth: 1,
      title: {
        style: {
          color: theme.palette.text.secondary,
          fontSize: typography.fontSizes[300],
          fontFamily: theme.typography.fontFamily,
          fontWeight: typography.fontWeights.weight300,
        },
      },
    },
    tooltip: {
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.charts.gridLines,
      borderRadius: 8,
      borderWidth: 1,
      style: {
        color: theme.palette.text.primary,
        fontSize: typography.fontSizes[200],
        fontFamily: theme.typography.fontFamily,
        fontWeight: typography.fontWeights.weight300,
      },
    },
    legend: {
      backgroundColor: 'transparent',
      itemStyle: {
        color: theme.palette.text.secondary,
        fontSize: typography.fontSizes[200],
        fontFamily: theme.typography.fontFamily,
        fontWeight: typography.fontWeights.weight300,
      },
      itemHoverStyle: { color: theme.palette.text.primary },
      itemHiddenStyle: { color: theme.palette.text.disabled },
    },
    credits: { enabled: false },
  };

  const [selectedWindow, setSelectedWindow] = useState(30);
  const [serverData, setServerData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Set global Highcharts options with theme fonts and colors
    Highcharts.setOptions({
      ...darkTheme,
      chart: {
        ...darkTheme.chart,
        style: {
          fontFamily: theme.typography.fontFamily,
          fontSize: typography.fontSizes[200],
        },
      },
    });
  }, []);

  const fundingData = useMemo(() => {
    if (serverData?.timeseries?.length) {
      const rawData = serverData.timeseries.map((period) => ({
        date: period.date,
        dailyFunding: period.dailyFunding, // Still named dailyFunding for backward compatibility
        cumulativeFunding: period.cumulativeFunding,
        deposits: period.deposits,
        withdrawals: period.withdrawals,
      }));

      // Apply appropriate aggregation based on selected time period
      if (selectedWindow <= 7) {
        // 1D and 7D: Keep 4-hour intervals
        return rawData;
      }
      if (selectedWindow <= 30) {
        // 30D: Aggregate to daily
        return groupByDay(rawData);
      }
      // 1Y: Aggregate to weekly
      return groupByWeek(rawData);
    }
    return [];
  }, [serverData, selectedWindow]);

  const totalFundingInPeriod = useMemo(
    () => fundingData.reduce((sum, period) => sum + period.dailyFunding, 0),
    [fundingData]
  );
  const fundingReturn = useMemo(() => {
    if (!totalEquity) return 0;
    return (totalFundingInPeriod / totalEquity) * 100;
  }, [totalEquity, totalFundingInPeriod]);
  const currentCumulativeFunding = fundingData[fundingData.length - 1]?.cumulativeFunding || 0;

  const stackedBarChartOptions = useMemo(() => {
    // Determine dynamic series name based on selected time window
    let fundingSeriesName;
    if (selectedWindow <= 7) {
      fundingSeriesName = '4-Hour Funding';
    } else if (selectedWindow <= 30) {
      fundingSeriesName = 'Daily Funding';
    } else {
      fundingSeriesName = 'Weekly Funding';
    }

    return {
      chart: {
        type: 'column',
        height: 350,
        backgroundColor: 'transparent',
        spacing: [10, 10, 15, 10],
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
        },
      },
      title: { text: null },
      xAxis: {
        categories: formatXAxisCategories(fundingData, selectedWindow),
        title: { text: null },
        tickmarkPlacement: 'on',
        // For 4-hour data, show more ticks but not too many to avoid overcrowding
        tickInterval: Math.max(1, Math.floor(fundingData.length / 12)),
      },
      yAxis: {
        title: {
          text: 'Amount ($)',
          style: {
            color: theme.palette.text.secondary,
            fontSize: typography.fontSizes[300],
            fontFamily: theme.typography.fontFamily,
            fontWeight: typography.fontWeights.weight300,
          },
        },
        gridLineWidth: 1,
        gridLineDashStyle: 'Dot',
        stackLabels: { enabled: false },
      },
      tooltip: {
        shared: true,
        useHTML: true,
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.charts.gridLines,
        borderRadius: 8,
        borderWidth: 1,
        shadow: true,
        /* eslint-disable react/no-this-in-sfc */
        formatter() {
          let periodLabel;
          if (selectedWindow <= 7) {
            periodLabel = '4-Hour Period';
          } else if (selectedWindow <= 30) {
            periodLabel = 'Day';
          } else {
            periodLabel = 'Week';
          }
          let tooltip = `<div style="font-weight:600;margin-bottom:4px;font-family:${theme.typography.fontFamily};">${periodLabel}: ${this.x}</div>`;
          this.points?.forEach((point) => {
            const { name } = point.series;
            const value = point.y || 0;
            const { color } = point;
            let valueColor = theme.palette.text.secondary;
            if (name === fundingSeriesName) {
              valueColor = value >= 0 ? GREEN : RED;
            }
            tooltip += `<div style="display:flex;align-items:center;margin:2px 0;font-family:${theme.typography.fontFamily};">
                <span style="color:${color};margin-right:6px;">●</span>
                <span style="margin-right:8px;">${name}:</span>
                <span style="font-weight:600;color:${valueColor};">$${Math.abs(value).toFixed(2)}</span>
              </div>`;
          });
          return tooltip;
        },
        /* eslint-enable react/no-this-in-sfc */
      },
      plotOptions: {
        column: {
          stacking: 'normal',
          borderRadius: 2,
          borderWidth: 0,
          pointPadding: 0.05, // Reduce padding for more data points
          groupPadding: 0.02, // Reduce group padding for more data points
          states: {
            hover: {
              brightness: 0.1,
              borderColor: theme.palette.charts.gridLines,
            },
          },
          dataLabels: {
            enabled: false,
          },
        },
      },
      series: [
        {
          name: fundingSeriesName,
          data: fundingData.map((period) => period.dailyFunding),
          color: CHART_COLORS.dailyFunding,
          negativeColor: CHART_COLORS.negativeFunding,
          stack: 'funding',
        },
        {
          name: 'Deposits',
          data: fundingData.map((period) => period.deposits),
          color: CHART_COLORS.deposits,
          stack: 'funding',
        },
        {
          name: 'Withdrawals',
          data: fundingData.map((period) => -period.withdrawals),
          color: CHART_COLORS.withdrawals,
          stack: 'funding',
        },
      ],
      legend: {
        enabled: true,
        align: 'center',
        verticalAlign: 'bottom',
        margin: 15,
        itemStyle: {
          fontFamily: theme.typography.fontFamily,
          fontSize: typography.fontSizes[200],
          fontWeight: typography.fontWeights.weight300,
        },
      },
      exporting: {
        enabled: true,
        buttons: {
          contextButton: {
            symbol: 'url(https://www.highcharts.com/samples/graphics/sun.png)',
            symbolX: 12,
            symbolY: 12,
            symbolSize: 12,
            menuItems: ['downloadPNG', 'downloadPDF', 'downloadCSV'],
          },
        },
      },
      credits: { enabled: false },
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500,
            },
            chartOptions: {
              legend: {
                align: 'center',
                verticalAlign: 'bottom',
                layout: 'horizontal',
                itemStyle: {
                  fontSize: typography.fontSizes[100],
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: typography.fontWeights.weight300,
                },
              },
              yAxis: {
                labels: {
                  style: {
                    fontSize: typography.fontSizes[100],
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: typography.fontWeights.weight300,
                  },
                },
              },
            },
          },
        ],
      },
      accessibility: {
        enabled: true,
        description: 'Funding dashboard chart showing funding payments over time',
        announceNewData: {
          announcementFormatter(allSeries, newSeries, newPoint) {
            if (newPoint) {
              return `New data point added: ${newPoint.category}, ${newPoint.y}`;
            }
            return false;
          },
        },
      },
    };
  }, [fundingData, selectedWindow]);

  const positionData = useMemo(() => {
    const positions = (serverData?.positions || []).map((p) => ({
      symbol: p.symbol.replace(/-USDT$/, '').replace(/-USDC$/, ''),
      avgFundingRate: Number(p.avgFundingRate || 0),
      totalFunding: Number(p.totalFunding || 0),
    }));
    if (positions.length === 0) return [];
    const totalAbs = positions.reduce((acc, p) => acc + Math.abs(p.totalFunding || 0), 0) || 0;
    return positions.map((p) => ({
      ...p,
      contribution: totalAbs > 0 ? Math.abs(p.totalFunding) / totalAbs : 0,
    }));
  }, [serverData]);

  useEffect(() => {
    let isCancelled = false;
    async function fetchServerData() {
      if (!accountId) return;
      setLoading(true);
      try {
        const data = await getFundingOverview({ accountId, days: selectedWindow, exchangeName });
        if (!isCancelled) setServerData(data);
      } catch (e) {
        // keep mock fallback silently
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    fetchServerData();
    return () => {
      isCancelled = true;
    };
  }, [accountId, selectedWindow]);

  /* eslint-disable react/no-this-in-sfc */
  const barChartOptions = useMemo(
    () => ({
      chart: {
        type: 'column',
        height: 280,
        backgroundColor: 'transparent',
        spacing: [10, 10, 15, 10],
        animation: {
          duration: 800,
          easing: 'easeOutQuart',
        },
      },
      title: { text: null },
      xAxis: { categories: positionData.map((p) => p.symbol), title: { text: null }, gridLineWidth: 0 },
      yAxis: {
        title: {
          text: 'Funding Rate (%)',
          style: {
            color: theme.palette.text.secondary,
            fontSize: typography.fontSizes[300],
            fontFamily: theme.typography.fontFamily,
            fontWeight: typography.fontWeights.weight300,
          },
        },
        labels: {
          formatter() {
            return `${(this.value * 100).toFixed(2)}%`;
          },
        },
        gridLineWidth: 1,
        gridLineDashStyle: 'Dot',
      },
      tooltip: {
        useHTML: true,
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.charts.gridLines,
        borderRadius: 8,
        borderWidth: 1,
        shadow: true,
        formatter() {
          const data = positionData[this.point.index];
          return `<div style="font-weight:600;margin-bottom:6px;font-family:${theme.typography.fontFamily};">${this.x}</div>
                  <div style="margin:2px 0;font-family:${theme.typography.fontFamily};">Avg Funding Rate: <span style="color:${GREEN};font-weight:600;">${(data.avgFundingRate * 100).toFixed(3)}%</span></div>
                  <div style="margin:2px 0;font-family:${theme.typography.fontFamily};">Total Funding: <span style="font-weight:600;">$${data.totalFunding.toFixed(2)}</span></div>
                  <div style="margin:2px 0;font-family:${theme.typography.fontFamily};">Contribution: <span style="font-weight:600;">${(data.contribution * 100).toFixed(1)}%</span></div>`;
        },
      },
      plotOptions: {
        column: {
          borderRadius: 2,
          borderWidth: 0,
          pointPadding: 0.1,
          groupPadding: 0.15,
          states: {
            hover: {
              brightness: 0.1,
              borderColor: theme.palette.charts.gridLines,
            },
          },
        },
      },
      series: [
        {
          name: 'Average Funding Rate',
          data: positionData.map((p) => {
            const color = p.avgFundingRate >= 0 ? GREEN : RED;
            return { y: p.avgFundingRate, color };
          }),
        },
      ],
      legend: { enabled: false },
      credits: { enabled: false },
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500,
            },
            chartOptions: {
              yAxis: {
                labels: {
                  style: {
                    fontSize: typography.fontSizes[100],
                    fontFamily: theme.typography.fontFamily,
                    fontWeight: typography.fontWeights.weight300,
                  },
                },
              },
            },
          },
        ],
      },
    }),
    [positionData]
  );

  const pieChartOptions = useMemo(
    () => ({
      chart: {
        type: 'pie',
        height: 280,
        backgroundColor: 'transparent',
        spacing: [10, 10, 15, 10],
        animation: {
          duration: 600,
          easing: 'easeOutQuart',
        },
      },
      title: { text: null },
      tooltip: {
        useHTML: true,
        backgroundColor: theme.palette.background.paper,
        borderColor: theme.palette.charts.gridLines,
        borderRadius: 8,
        borderWidth: 1,
        shadow: true,
        formatter() {
          const { data } = this.point.options;
          return `<div style="font-weight:600;margin-bottom:6px;font-family:${theme.typography.fontFamily};">${this.point.name}</div>
                  <div style="margin:2px 0;font-family:${theme.typography.fontFamily};">Contribution: <span style="color:${GREEN};font-weight:600;">${(data.contribution * 100).toFixed(1)}%</span></div>
                  <div style="margin:2px 0;font-family:${theme.typography.fontFamily};">Total Funding: <span style="font-weight:600;">$${data.totalFunding.toFixed(2)}</span></div>
                  <div style="margin:2px 0;font-family:${theme.typography.fontFamily};">Avg Rate: <span style="font-weight:600;">${(data.avgFundingRate * 100).toFixed(3)}%</span></div>`;
        },
      },
      plotOptions: {
        pie: {
          innerSize: '65%',
          dataLabels: { enabled: false },
          showInLegend: true,
          borderWidth: 0,
          states: {
            hover: {
              brightness: 0.1,
              borderColor: theme.palette.charts.gridLines,
            },
          },
        },
      },
      series: [
        {
          name: 'Contribution',
          data: positionData.map((p) => {
            const isPositive = p.totalFunding >= 0;
            const baseColor = isPositive ? GREEN : RED;
            const alpha = Math.min(0.3 + Math.abs(p.contribution) * 0.7, 1); // Gradient based on contribution size
            const color = isPositive
              ? `rgba(14, 203, 129, ${alpha})` // Green gradient
              : `rgba(246, 70, 93, ${alpha})`; // Red gradient

            return {
              name: p.symbol.replace(/:PERP$/, ''),
              y: Math.abs(p.contribution),
              color,
              data: p,
            };
          }),
        },
      ],
      legend: {
        enabled: true,
        align: 'right',
        verticalAlign: 'middle',
        layout: 'vertical',
        itemStyle: {
          fontSize: typography.fontSizes[200],
          fontWeight: typography.fontWeights.weight400,
          fontFamily: theme.typography.fontFamily,
        },
        itemMarginBottom: 4,
        labelFormatter() {
          return `${this.name}: ${(this.y * 100).toFixed(1)}%`;
        },
      },
      credits: { enabled: false },
      responsive: {
        rules: [
          {
            condition: {
              maxWidth: 500,
            },
            chartOptions: {
              legend: {
                align: 'center',
                verticalAlign: 'bottom',
                layout: 'horizontal',
                itemStyle: {
                  fontSize: typography.fontSizes[100],
                  fontFamily: theme.typography.fontFamily,
                  fontWeight: typography.fontWeights.weight300,
                },
              },
            },
          },
        ],
      },
    }),
    [positionData]
  );
  /* eslint-enable react/no-this-in-sfc */

  return (
    <Stack direction='column' spacing={2} sx={{ width: '100%' }}>
      {loading ? (
        <>
          <Stack direction='row' spacing={2}>
            {[0, 1, 2, 3].map((i) => (
              <Card key={`s-top-${i}`} sx={{ bgcolor: 'background.paper', flex: 1, height: METRIC_HEIGHT }}>
                <CardContent>
                  <Skeleton sx={{ mb: 1 }} variant='text' width={140} />
                  <Skeleton height={38} variant='text' width={180} />
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Skeleton sx={{ mb: 1 }} variant='text' width={200} />
              <Skeleton height={360} variant='rectangular' />
            </CardContent>
          </Card>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
            {[0, 1].map((i) => (
              <Card key={`s-chart-${i}`} sx={{ bgcolor: 'background.paper', flex: 1 }}>
                <CardContent>
                  <Skeleton sx={{ mb: 1 }} variant='text' width={260} />
                  <Skeleton height={300} variant='rectangular' />
                </CardContent>
              </Card>
            ))}
          </Stack>

          <Stack direction='column' padding={1} spacing={1}>
            <Skeleton variant='text' width={120} />
            <Skeleton height={260} variant='rectangular' />
          </Stack>
        </>
      ) : (
        <>
          <Stack direction='row' spacing={2}>
            <Card sx={{ bgcolor: 'background.paper', display: 'flex', flex: 1, height: METRIC_HEIGHT }}>
              <CardContent>
                <Stack direction='column' spacing={1}>
                  <SubTitleTypography>
                    <LabelTooltip label='Total Equity' link='#' title='Current overall portfolio value.' />
                  </SubTitleTypography>
                  <Stack alignItems='baseline' direction='row' spacing={4}>
                    <Typography fontWeight={400} variant='h4'>
                      {Number(totalEquity || 0).toLocaleString()}
                    </Typography>
                    <CurrencyTitleTypography>USD</CurrencyTitleTypography>
                    <Box sx={{ flexGrow: 1 }} />
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: 'background.paper', display: 'flex', flex: 1, height: METRIC_HEIGHT }}>
              <CardContent>
                <Stack direction='column' spacing={1}>
                  <SubTitleTypography>
                    <LabelTooltip label='Cumulative Funding' link='#' title='Total accumulated funding over time.' />
                  </SubTitleTypography>
                  <Stack alignItems='baseline' direction='row' spacing={4}>
                    <Typography
                      color={currentCumulativeFunding >= 0 ? 'success.main' : 'error.main'}
                      fontWeight={400}
                      variant='h4'
                    >
                      {currentCumulativeFunding.toFixed(2)}
                    </Typography>
                    <CurrencyTitleTypography>USD</CurrencyTitleTypography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: 'background.paper', display: 'flex', flex: 1, height: METRIC_HEIGHT }}>
              <CardContent>
                <Stack direction='column' spacing={1}>
                  <SubTitleTypography>
                    <LabelTooltip
                      label='Funding Return'
                      link='#'
                      title='Funding / Total Equity over selected window.'
                    />
                  </SubTitleTypography>
                  <Stack alignItems='baseline' direction='row' spacing={4}>
                    <Typography color={fundingReturn >= 0 ? 'success.main' : 'error.main'} variant='h4'>
                      {`${fundingReturn >= 0 ? '+' : ''}${smartRound(fundingReturn)}%`}
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          <Card sx={{ bgcolor: 'background.paper' }}>
            <CardContent>
              <Box position='relative'>
                <Stack direction='row' spacing={1} sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1 }}>
                  <ButtonGroup variant='outlined'>
                    {TIME_WINDOWS.map((tw) => (
                      <Button
                        key={tw.days}
                        size='small'
                        variant={selectedWindow === tw.days ? 'contained' : 'outlined'}
                        onClick={() => setSelectedWindow(tw.days)}
                      >
                        {tw.label}
                      </Button>
                    ))}
                  </ButtonGroup>
                </Stack>
                <Stack direction='column' spacing={1}>
                  <Typography variant='subtitle1'>Funding Payments</Typography>
                  <Typography color='text.secondary' variant='body2'>
                    {(() => {
                      if (selectedWindow <= 7) {
                        return 'Track funding, deposits and withdrawals in 4-hour intervals';
                      }
                      if (selectedWindow <= 30) {
                        return 'Track funding, deposits and withdrawals by day';
                      }
                      return 'Track funding, deposits and withdrawals by week';
                    })()}
                  </Typography>
                  <Box
                    sx={{
                      height: 360,
                      '& .highcharts-container': {
                        fontFamily: theme.typography.fontFamily,
                      },
                      '& .highcharts-title': {
                        fontFamily: theme.typography.fontFamily,
                      },
                      '& .highcharts-axis-labels text': {
                        fontFamily: theme.typography.fontFamily,
                      },
                      '& .highcharts-legend-item text': {
                        fontFamily: theme.typography.fontFamily,
                      },
                    }}
                  >
                    <HighchartsReact highcharts={Highcharts} options={stackedBarChartOptions} />
                  </Box>
                </Stack>
              </Box>
            </CardContent>
          </Card>

          <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
            <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
              <CardContent>
                <Typography variant='subtitle1'>Average Funding Rate</Typography>
                <Typography color='text.secondary' variant='body2'>
                  Total accumulated rate over selected timeframe
                </Typography>
                <Box
                  sx={{
                    height: 300,
                    mt: 1,
                    '& .highcharts-container': {
                      fontFamily: theme.typography.fontFamily,
                    },
                    '& .highcharts-title': {
                      fontFamily: theme.typography.fontFamily,
                    },
                    '& .highcharts-axis-labels text': {
                      fontFamily: theme.typography.fontFamily,
                    },
                    '& .highcharts-legend-item text': {
                      fontFamily: theme.typography.fontFamily,
                    },
                  }}
                >
                  <HighchartsReact highcharts={Highcharts} options={barChartOptions} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
              <CardContent>
                <Typography variant='subtitle1'>Funding Contribution</Typography>
                <Typography color='text.secondary' variant='body2'>
                  Ratio of each position&apos;s contribution to total funding PnL
                </Typography>
                <Box
                  sx={{
                    height: 300,
                    mt: 1,
                    '& .highcharts-container': {
                      fontFamily: theme.typography.fontFamily,
                    },
                    '& .highcharts-title': {
                      fontFamily: theme.typography.fontFamily,
                    },
                    '& .highcharts-axis-labels text': {
                      fontFamily: theme.typography.fontFamily,
                    },
                    '& .highcharts-legend-item text': {
                      fontFamily: theme.typography.fontFamily,
                    },
                  }}
                >
                  <HighchartsReact highcharts={Highcharts} options={pieChartOptions} />
                </Box>
              </CardContent>
            </Card>
          </Stack>

          <Stack direction='column' padding={1} spacing={1}>
            <Typography color='text.secondary' fontWeight={300}>
              Positions
            </Typography>
            <TableContainer sx={{ maxHeight: '400px' }}>
              <Table
                stickyHeader
                aria-label='positions table'
                size='small'
                sx={{
                  '& .MuiTableRow-root': { border: 0 },
                  '& .MuiTableCell-root': { border: 0, px: 2, py: 1 },
                }}
              >
                <TableHead>
                  <TableRow>
                    <StyledTableCell style={{ minWidth: 120 }}>Symbol</StyledTableCell>
                    <StyledTableCell style={{ minWidth: 120 }}>Avg Funding Rate</StyledTableCell>
                    <StyledTableCell style={{ minWidth: 120 }}>Total Funding</StyledTableCell>
                    <StyledTableCell style={{ minWidth: 120 }}>Contribution</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {positionData.map((p) => (
                    <TableRow
                      key={`${p.symbol}-${p.totalFunding}`}
                      sx={{ width: '100%', '& .MuiTableCell-root': { py: 1 } }}
                    >
                      <StyledTableCell align='left'>
                        <Typography variant='body1'>{p.symbol}</Typography>
                      </StyledTableCell>
                      <StyledTableCell align='left'>
                        <Typography color='success.main' variant='body1'>
                          {(p.avgFundingRate * 100).toFixed(3)}%
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align='left'>
                        <Typography color={p.totalFunding >= 0 ? 'success.main' : 'error.main'} variant='body1'>
                          ${numberWithCommas(smartRound(p.totalFunding, 2))}
                        </Typography>
                      </StyledTableCell>
                      <StyledTableCell align='left'>
                        <Typography variant='body1'>{(p.contribution * 100).toFixed(1)}%</Typography>
                      </StyledTableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </>
      )}
    </Stack>
  );
}
