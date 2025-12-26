import monadLight from '@images/logos/monad-light.png';
import monadPrimary from '@images/logos/monad-primary.png';

/**
 * Reusable component for displaying the Base Scan logo
 * @param {string} height - CSS height value for the image (default: '3rem')
 * @param {string} variant - Logo variant ('light' or 'primary', default: 'light')
 */
function ProofLogoImg({ height = '3rem', variant = 'light' }) {
  let logoSrc;
  switch (variant) {
    case 'light':
      logoSrc = monadLight;
      break;
    case 'primary':
      logoSrc = monadPrimary;
      break;
    default:
      logoSrc = monadLight;
      break;
  }

  return (
    <img
      alt='Monad'
      src={logoSrc}
      style={{
        height,
        objectFit: 'contain',
        verticalAlign: 'middle',
      }}
    />
  );
}

export default ProofLogoImg;
