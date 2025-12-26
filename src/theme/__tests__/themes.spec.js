/*
  This test ensures all exported themes share a common required shape so
  components can rely on consistent keys across palettes and typography.
*/

import { describe, test, expect } from '@jest/globals';

import { theme as baseTheme } from '../theme';
import blueTheme from '../blueTheme';
import binanceTheme from '../binanceTheme';
import bybitTheme from '../bybitTheme';
import deribitTheme from '../deribitTheme';
import gateTheme from '../gateTheme';
import hyperliquidTheme from '../hyperliquidTheme';
import asterTheme from '../asterTheme';

// The list of themes to validate with helpful file labels for error messages
const THEMES = {
  dark: { theme: baseTheme, file: '../theme.js' },
  blue: { theme: blueTheme, file: '../blueTheme.js' },
  binance: { theme: binanceTheme, file: '../binanceTheme.js' },
  bybit: { theme: bybitTheme, file: '../bybitTheme.js' },
  deribit: { theme: deribitTheme, file: '../deribitTheme.js' },
  gate: { theme: gateTheme, file: '../gateTheme.js' },
  hyperliquid: { theme: hyperliquidTheme, file: '../hyperliquidTheme.js' },
  aster: { theme: asterTheme, file: '../asterTheme.js' },
};

// Required top-level keys for MUI theme
const REQUIRED_THEME_KEYS = ['typography', 'palette', 'breakpoints', 'spacing', 'components'];

// Required palette groups used across the app
const REQUIRED_PALETTE_KEYS = [
  'mode',
  'common',
  'ui',
  'semantic',
  'text',
  'primary',
  'secondary',
  'info',
  'pending',
  'success',
  'error',
  'warning',
  'background',
  'border',
  'button',
  'charts',
  'portfolioChart',
  'card',
  'side',
  'orderUrgency',
  'exchangeColors',
  'grey',
  'options',
  'candlestick',
  'orderBook',
  'message',
  'strategy',
  'tcaScheme',
];

const OPTIONAL_PALETTE_KEYS = [
  'brand',
  'blue',
  'black',
];

// Required text subkeys
const REQUIRED_TEXT_KEYS = ['primary', 'subtitle', 'disabled', 'grey', 'offBlack', 'offWhite', 'secondary'];

// Required primary/secondary subkeys
const REQUIRED_PRIMARY_KEYS = ['main'];

// Required background subkeys
const REQUIRED_BACKGROUND_KEYS = ['base', 'container', 'card', 'paper', 'white', 'app'];

// Required grey subkeys
const REQUIRED_GREY_COMMON_KEYS = ['light', 'main', 'dark', 'disabled', 'transparent'];

// Required typography groups used by components
const REQUIRED_TYPO_KEYS = [
  'fontFamily',
  'spacing',
  'fontFamilyConfig',
  'h1', 'h2', 'h3', 'h3Strong', 'h4', 'h4Strong', 'h5', 'h5Strong', 'h6', 'h6Strong',
  'subtitle1', 'subtitle2', 'button', 'button1', 'button2', 'body1', 'body1Strong', 'body2', 'body2Strong', 'body3', 'body3Strong', 'small1', 'small2', 'cardTitle',
];

function assertTruthy(obj, location) {
  if (!obj) {
    throw new Error(`${location}: object is undefined/null`);
  }
}

function expectHasKeys(obj, requiredKeys, location) {
  assertTruthy(obj, location);
  requiredKeys.forEach((k) => {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) {
      throw new Error(`${location}: missing key '${k}'`);
    }
  });
}

describe('Theme structure consistency', () => {
  test('all themes export an object with required top-level keys', () => {
    Object.entries(THEMES).forEach(([name, def]) => {
      const th = def.theme;
      const where = `${name} (${def.file})`;
      assertTruthy(th, where);
      expectHasKeys(th, REQUIRED_THEME_KEYS, where);
    });
  });

  test('palette contains required groups and subkeys', () => {
    Object.entries(THEMES).forEach(([name, def]) => {
      const th = def.theme;
      const p = (th && th.palette) || {};
      const base = `${name} (${def.file})`;
      // groups
      expectHasKeys(p, REQUIRED_PALETTE_KEYS, `${base}.palette`);

      // optional groups if present must be objects
      OPTIONAL_PALETTE_KEYS.forEach((opt) => {
        if (Object.prototype.hasOwnProperty.call(p, opt)) {
          if (typeof p[opt] !== 'object') {
            throw new Error(`${base}.palette.${opt}: expected object, got ${typeof p[opt]}`);
          }
        }
      });

      // text
      expectHasKeys(p.text || {}, REQUIRED_TEXT_KEYS, `${base}.palette.text`);

      // primary/secondary shapes
      expectHasKeys(p.primary || {}, REQUIRED_PRIMARY_KEYS, `${base}.palette.primary`);
      expectHasKeys(p.secondary || {}, REQUIRED_PRIMARY_KEYS, `${base}.palette.secondary`);

      // background
      expectHasKeys(p.background || {}, REQUIRED_BACKGROUND_KEYS, `${base}.palette.background`);

      // grey common keys
      expectHasKeys(p.grey || {}, REQUIRED_GREY_COMMON_KEYS, `${base}.palette.grey`);

      // arrays/shapes used in charts and tcaScheme
      if (!Array.isArray(p.tcaScheme)) {
        throw new Error(`${base}.palette.tcaScheme: expected array`);
      }
      expect(p.tcaScheme.length).toBeGreaterThan(0);
    });
  });

  test('typography exposes required variants', () => {
    Object.entries(THEMES).forEach(([name, def]) => {
      const th = def.theme;
      const where = `${name} (${def.file}).typography`;
      expectHasKeys((th && th.typography) || {}, REQUIRED_TYPO_KEYS, where);
    });
  });
});


