const tokenIconContext = require.context('./', false, /\.(png|jpe?g|svg|webp)$/);

const tokenIcons = tokenIconContext.keys().reduce((acc, filePath) => {
  const iconName = filePath.match(/\.\/(.*)\.\w+$/)[1];
  acc[iconName] = tokenIconContext(filePath).default || tokenIconContext(filePath);
  return acc;
}, {});

export default function getBaseTokenIcon(baseToken) {
  return tokenIcons[baseToken.toLowerCase()];
}
