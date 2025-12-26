const tokenIconContext = require.context('./', false, /\.(png|jpe?g|svg)$/);

const tokenIcons = tokenIconContext.keys().reduce((acc, filePath) => {
  const iconName = filePath.match(/\.\/(.*)\.\w+$/)[1];
  acc[iconName] = tokenIconContext(filePath).default || tokenIconContext(filePath);
  return acc;
}, {});

export default function getDexTokenIcon(tokenAddress, chainId) {
  return tokenIcons[`${tokenAddress}_${chainId}`];
}
