import { Link, Stack, styled, TableCell, Typography } from '@mui/material';
import { smartRound, numberWithCommas, calculateDurationDisplay, BASEURL } from '@/util';
import getBaseTokenIcon from '@/../images/tokens';
import { StyledTableCell } from '@/shared/orderTable/util';

export const StyledSummaryTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledSummaryTableCell}-head`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    fontFamily: theme.typography.fontFamilyConfig.numbers, // Use IBM Plex Mono for numbers
    fontSize: theme.typography.body1.fontSize,
    borderBottom: 'none',
    padding: '2px 0px 0px 0px',
    verticalAlign: 'top',
  };
});

export const StyledHeaderTableCell = styled(TableCell)(({ theme }) => {
  return {
    [`&.${StyledHeaderTableCell}-head`]: {
      backgroundColor: theme.palette.common.black,
      color: theme.palette.common.white,
    },
    fontSize: theme.typography.body1.fontSize,
    borderBottom: 'none',
    padding: '16px 0px 0px 0px',
  };
});

export const createPairLink = ({ pairName, orderId, CustomParent, width }) => {
  const value = pairName;

  const StyledParent = CustomParent || StyledTableCell;

  const [base, quote] = pairName.split('-');
  const [baseToken, _] = base.split(':');

  const pairDisplayIcon = getBaseTokenIcon(baseToken);

  return (
    <StyledParent key={orderId}>
      <Stack
        direction='row'
        spacing={1}
        sx={{
          width: '100%',
        }}
      >
        {pairDisplayIcon && (
          <img
            alt='Token Icon'
            src={getBaseTokenIcon(baseToken)}
            style={{ borderRadius: '50%', width: '1.4rem', height: '1.4rem' }}
          />
        )}
        <Link
          href={`${BASEURL}/order/${orderId}`}
          rel='noopener noreferrer'
          sx={{ width: '100%', textDecoration: 'none' }}
          target='_blank'
          variant='body1'
        >
          <Typography
            noWrap
            color='primary.main'
            sx={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: width || '200px',
            }}
          >
            {value}
          </Typography>
        </Link>
      </Stack>
    </StyledParent>
  );
};
