import React from 'react';
import Skeleton from '@mui/material/Skeleton';

const EmptyBarVariant = {
  small: { height: '12px', width: '70px' },
  medium: { height: '16px', width: '120px' },
  large: { height: '16px', width: '240px' },
};

function EmptyBar({ variant = 'medium' }) {
  if (!(variant in EmptyBarVariant)) {
    throw new Error(`Variant [${variant}] not supported for EmptyBar`);
  }
  const { height, width } = EmptyBarVariant[variant];
  return <Skeleton animation='wave' height={height} variant='rounded' width={width} />;
}

export default EmptyBar;
