import React from 'react';
import { Accordion, AccordionSummary, Typography, Collapse, AccordionDetails, useTheme } from '@mui/material';
import { Add, Remove } from '@mui/icons-material';

export function DashboardAccordianComponent({ isOpen, setIsOpen, isAlgo, title, children }) {
  const theme = useTheme();

  return (
    <Accordion
      expanded={isOpen}
      sx={{
        '&.MuiAccordion-root': {
          backgroundColor: 'background.card',
        },
        '& .MuiCollapse-vertical': {
          backgroundColor: 'background.card',
        },
        '& .MuiAccordionDetails-root': {
          backgroundColor: 'background.card',
        },
      }}
    >
      <AccordionSummary
        aria-controls='panel1-content'
        expandIcon={isOpen ? <Remove /> : <Add />}
        sx={{
          height: 40, // Fixed height
          minHeight: 40, // Prevent changing height on expand
          '&.Mui-expanded': {
            height: 40,
            minHeight: 40,
          },

          '& .MuiAccordionSummary-content': {
            margin: 0, // Remove margin adjustment when expanded
            '&.Mui-expanded': {
              margin: 0,
            },
          },
          backgroundColor: 'grey.750',
          '&:hover': {
            backgroundColor: 'grey.750',
          },
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Typography variant='body1'>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails
        sx={{
          marginTop: '1rem',
          paddingX: '0',
          backgroundColor: 'background.card',
          '&.MuiAccordionDetails-root': {
            backgroundColor: 'background.card',
          },
        }}
      >
        <Collapse in={isAlgo}>{children}</Collapse>
      </AccordionDetails>
    </Accordion>
  );
}

export const getStrategyObjectSafe = (strategies, key) => {
  if (strategies && key && strategies[key]) {
    return strategies[key];
  }
  return {};
};

export const TRAJECTORIES_WITH_LIMIT_PRICE = ['Limit', 'Iceberg', 'IOC'];

export const OrderEntryType = {
  AUTO: { key: 'AUTO', label: 'Simple' },
  MANUAL: { key: 'MANUAL', label: 'Advanced' },
};
