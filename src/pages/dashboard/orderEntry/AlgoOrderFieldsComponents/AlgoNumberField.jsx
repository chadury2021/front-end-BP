/* eslint-disable react/jsx-no-duplicate-props */
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import { ignoreScrollEvent, noArrowStyle } from '../../../../util';
import { NumericFormatCustom } from '../../../../shared/fields/NumberFieldFormat';

function AlgoNumberField({ InputProps, hidden, sx, ...props }) {
  const theme = useTheme();
  if (hidden) {
    return null;
  }

  return (
    <TextField
      fullWidth
      autoComplete='off'
      InputLabelProps={{
        sx: {
          color: theme.palette.text.subtitle, // Default color for the label
          '&.MuiInputLabel-shrink': {
            color: 'var(--text-primary)', // Color when the label is shrunk (after input is entered)
          },
        },
      }}
      InputProps={{
        inputComponent: NumericFormatCustom,
        ...InputProps,
      }}
      size='small'
      sx={{
        ...noArrowStyle,
        ...sx,
      }}
      onWheel={ignoreScrollEvent}
      {...props}
    />
  );
}
export default AlgoNumberField;
