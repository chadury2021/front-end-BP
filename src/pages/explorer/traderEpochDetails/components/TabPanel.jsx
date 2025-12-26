import { Box } from '@mui/system';

/**
 * Tab panel container that shows/hides content based on active tab
 * @param {Object} props - Component props
 * @param {ReactNode} props.children - Content to display in panel
 * @param {number} props.value - Current tab value
 * @param {number} props.index - Index this panel corresponds to
 */
export default function TabPanel({ children, value, index }) {
  return (
    <div
      aria-labelledby={`epoch-details-tab-${index}`}
      hidden={value !== index}
      id={`epoch-details-tabpanel-${index}`}
      role='tabpanel'
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}
