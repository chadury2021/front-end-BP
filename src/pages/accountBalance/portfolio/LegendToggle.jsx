import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import LabelTooltip from '@/shared/components/LabelTooltip';

export default function LegendToggle({
  label,
  active,
  onToggle,
  title,
  activeColor = 'text.subtitle',
  inactiveColor = 'text.disabled',
  docLink,
  docTooltip = 'Open documentation',
}) {
  return (
    <Box
      sx={{
        alignItems: 'center',
        color: active ? activeColor : inactiveColor,
        cursor: 'pointer',
        display: 'inline-flex',
        userSelect: 'none',
      }}
      onClick={onToggle}
    >
      {/* LabelTooltip inherits color from the wrapper */}
      <LabelTooltip label={label} title={title} />
      {docLink ? (
        <Tooltip placement='top' title={docTooltip}>
          <IconButton
            component='a'
            href={docLink}
            rel='noopener noreferrer'
            size='small'
            sx={{ ml: 1, color: 'inherit' }}
            target='_blank'
            onClick={(e) => e.stopPropagation()}
          >
            <InfoOutlinedIcon fontSize='inherit' />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}
