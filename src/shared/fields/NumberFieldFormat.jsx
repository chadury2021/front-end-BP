/* eslint-disable prefer-arrow-callback */
import React from 'react';
import { NumericFormat } from 'react-number-format';

export const NumericFormatCustom = React.forwardRef(function NumericFormatCustom(props, ref) {
  const { onChange, ...other } = props;

  return (
    <NumericFormat
      {...other}
      thousandSeparator
      valueIsNumericString
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.value,
          },
        });
      }}
    />
  );
});
