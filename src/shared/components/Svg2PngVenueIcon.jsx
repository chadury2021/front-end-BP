import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box } from '@mui/material';
import ExchangeIcons from '@images/exchange_icons';
import { svgUrlToPngDataUrl } from '@/shared/utils/svgToPng';

function Svg2PngVenueIcon({ venueName, size = 32 }) {
  const [venuePng, setVenuePng] = useState(null);

  const lowerVenueName = venueName?.toLowerCase();
  const svgUrl = lowerVenueName ? ExchangeIcons[lowerVenueName] || ExchangeIcons.default : null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!svgUrl) {
        setVenuePng(null); // Clear if no SVG URL
        return;
      }

      try {
        const dataUrl = await svgUrlToPngDataUrl(svgUrl, size, size);
        if (!cancelled) {
          setVenuePng(dataUrl);
        }
      } catch (error) {
        console.error(`[VenueIcon] Error converting SVG for ${venueName}:`, error);
        if (!cancelled) {
          setVenuePng(null); // Clear on error
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [svgUrl, size, venueName]); // Add venueName to dependencies in case the input string changes

  if (!venueName) {
    return null; // Don't render anything if venueName is not provided
  }

  return (
    <Box
      component='span' // Render as span to fit inline better
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        mx: 0.5, // Add horizontal margin for spacing between icons
        verticalAlign: 'middle', // Align with surrounding text
      }}
    >
      {venuePng ? (
        <img alt={venueName} src={venuePng} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
      ) : (
        // Optional: Placeholder or fallback text/icon while loading or if error
        <Box sx={{ width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
      )}
    </Box>
  );
}

Svg2PngVenueIcon.propTypes = {
  venueName: PropTypes.string.isRequired,
  size: PropTypes.number,
};

Svg2PngVenueIcon.defaultProps = {
  size: 24,
};

export default Svg2PngVenueIcon;
