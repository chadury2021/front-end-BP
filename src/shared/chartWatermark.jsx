/* eslint-disable no-param-reassign */
import LOGOS from '../../images/logos';

const chartWatermark = ({ options, position = 'center', marginBottom = 70, marginRight = 80, opacity = 0.2 }) => {
  function loadHandler() {
    const chart = this;
    let width = 200;
    let height = 41.6;

    let logo = LOGOS.treadFullDark;
    let xPos = chart.chartWidth / 2 - width / 2;
    let yPos = chart.chartHeight / 2 - height / 2;

    if (position === 'bottom-right') {
      width = 30;
      height = 30;
      xPos = chart.chartWidth - width - marginRight;
      yPos = chart.chartHeight - height - marginBottom;
      logo = LOGOS.treadDark;
    } else if (position === 'top-right') {
      width = 30;
      height = 30;
      xPos = chart.chartWidth - width - marginRight;
      yPos = marginBottom;
      logo = LOGOS.treadDark;
    }

    if (chart.watermark) {
      chart.watermark.destroy();
    }

    chart.watermark = chart.renderer
      .image(logo, xPos, yPos, width, height)
      .css({
        opacity,
      })
      .add();
  }

  // Ensure the events object exists in the chart configuration
  if (!options.chart.events) {
    options.chart.events = {};
  }

  options.chart.events = {
    ...options.chart.events,
    load: loadHandler,
    redraw() {
      if (this.watermark) {
        const chart = this;
        const width = chart.watermark.attr('width');
        const height = chart.watermark.attr('height');
        let xPos = chart.chartWidth / 2 - width / 2;
        let yPos = chart.chartHeight / 2 - height / 2;

        if (position === 'bottom-right') {
          xPos = chart.chartWidth - width - marginRight;
          yPos = chart.chartHeight - height - marginBottom;
        } else if (position === 'top-right') {
          xPos = chart.chartWidth - width - marginRight;
          yPos = marginBottom;
        }
        chart.watermark.attr({
          x: xPos,
          y: yPos,
        });
      }
    },
  };

  return options;
};

export default chartWatermark;
