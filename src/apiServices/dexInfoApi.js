// Determine the base URL based on environment
const getDexApiBaseUrl = () => {
  // Check if we're in development mode
  const isDev = window.location.hostname === 'localhost' ||
                window.location.hostname.includes('dev') ||
                window.location.hostname.includes('127.0.0.1');

  return isDev
    ? 'https://dex-api-dev.treadfi.com'
    : 'https://dex-api.treadfi.com';
};

export async function fetchDexInfo(contractAddress, chain) {
  const baseUrl = getDexApiBaseUrl();
  const url = `${baseUrl}/token-pairs/v1/${chain}/${contractAddress}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Dex info: ${response.status} ${response.statusText}`);
  }

  return response.json();
}