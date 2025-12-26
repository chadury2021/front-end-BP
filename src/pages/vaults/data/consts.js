export const VAULT_TO_TRADER_ID_MAP = {
  '12352342': '0x0eba442736b3f3609b3cfed5561671029c755e7ee7ea30507745aadee0f4eede', // echo -n "AlphaVault" | openssl dgst -sha256
  '345363453': '0x1d378846e620931e4b033fbc31b836e1a2d827df0bd43ad617f96ee185ea258e', // echo -n "CryptoNest" | openssl dgst -sha256
  '897164319': '0xfb642f14a3bf6c696c7323336be253947355921599d4f651413898e704df0507', // echo -n "TitanStore" | openssl dgst -sha256
};
export const HARDCODED_VAULTS = Object.keys(VAULT_TO_TRADER_ID_MAP);
export const HARDCODED_TRADER_IDS = Object.values(VAULT_TO_TRADER_ID_MAP);
