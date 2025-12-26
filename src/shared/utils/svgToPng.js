// svgToPng.js
import { Canvg } from 'canvg';

/**
 * Turns an SVG *file URL* into a PNG data-URL.
 *
 * @param {string} svgUrl   – url you got from `import Icon from './binance.svg'`
 * @param {number} width    – final width  (in px)
 * @param {number} height   – final height (in px)
 * @returns {Promise<string>} data-url ("data:image/png;base64,…")
 */
export async function svgUrlToPngDataUrl(svgUrl, width = 48, height = 48) {
  const response = await fetch(svgUrl);
  const svgText = await response.text();

  // 1. create an off-screen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  // 2. rasterise the SVG onto it
  const ctx = canvas.getContext('2d');
  const v = await Canvg.from(ctx, svgText, { ignoreAnimation: true });
  await v.render();

  // 3. return a PNG data-url
  console.log('[svgUrlToPngDataUrl] canvas.toDataURL', canvas.toDataURL('image/png'));
  return canvas.toDataURL('image/png');
}
