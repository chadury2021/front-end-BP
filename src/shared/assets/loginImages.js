// Centralized mapping from theme name to login illustration image
// Note: Images are referenced via the @images alias which resolves to react_frontend/images

import loginDark from '@images/login/login-dark.png';
import loginBlue from '@images/login/login-blue.png';
import loginBinance from '@images/login/login-binance.png';
import loginBybit from '@images/login/login-bybit.png';
import loginHyperliquid from '@images/login/login-hyperliquid.png';
import loginDeribit from '@images/login/login-deribit.png';
import loginGate from '@images/login/login-gate.png';
import loginAster from '@images/login/login-aster.png';
import loginOg from '@images/login/login-og.png';
import loginBip01 from '@images/login/login-bip01.png';

const THEME_TO_LOGIN_IMAGE = {
  dark: loginDark,
  blue: loginBlue,
  aster: loginAster,
  binance: loginBinance,
  bybit: loginBybit,
  hyperliquid: loginHyperliquid,
  deribit: loginDeribit,
  gate: loginGate,
  og: loginOg,
  bip01: loginBip01,
};

export function getLoginImageForTheme(themeName) {
  return THEME_TO_LOGIN_IMAGE[themeName] || loginDark;
}

export default THEME_TO_LOGIN_IMAGE;


