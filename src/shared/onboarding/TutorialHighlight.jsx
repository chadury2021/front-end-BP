import React, { useEffect, useRef, useState } from 'react';
import { Box, IconButton, Paper, Popper, Typography, useTheme } from '@mui/material';
import { createPortal } from 'react-dom';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import { motion } from 'framer-motion';

function TutorialHighlight({ children, open, onClose, placement = 'bottom', text, spotlightPadding = 8 }) {
  const theme = useTheme();
  const anchorRef = useRef(null);
  const [zUp, setZUp] = useState(false);
  const [rect, setRect] = useState(null);

  const [dismissed, setDismissed] = useState(false);
  const forceTutorial =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('show_tutorial') === '1' : false;
  const visible = (open || forceTutorial) && !dismissed;
  const openedAtRef = useRef(0);

  const handleClose = () => {
    setDismissed(true);
    onClose?.();
  };

  useEffect(() => {
    if (visible) {
      setZUp(true);
      openedAtRef.current = performance.now();
      const update = () => {
        if (anchorRef.current) {
          const r = anchorRef.current.getBoundingClientRect();
          setRect({ x: r.left, y: r.top, width: r.width, height: r.height });
        }
      };
      update();
      window.addEventListener('resize', update);
      window.addEventListener('scroll', update, true);
      const closeOnAnyPress = (e) => {
        const now = performance.now();
        // Ignore release immediately after opening to avoid dismissing from prior click
        if (now - openedAtRef.current < 80) return;
        handleClose();
      };
      const closeOnEscape = (e) => {
        if (e.key === 'Escape') setDismissed(true);
      };
      window.addEventListener('pointerdown', closeOnAnyPress, { capture: true });
      window.addEventListener('keydown', closeOnEscape);
      return () => {
        window.removeEventListener('resize', update);
        window.removeEventListener('scroll', update, true);
        window.removeEventListener('pointerdown', closeOnAnyPress, { capture: true });
        window.removeEventListener('keydown', closeOnEscape);
      };
    }
    const t = setTimeout(() => setZUp(false), 200);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (!open && !forceTutorial) setDismissed(false);
  }, [open, forceTutorial]);

  return (
    <Box
      component='span'
      ref={anchorRef}
      sx={{ position: 'relative', display: 'inline-block', zIndex: zUp ? 1301 : 'auto', width: 'inherit' }}
    >
      {visible &&
        rect &&
        createPortal(
          (() => {
            const x = rect.x - spotlightPadding;
            const y = rect.y - spotlightPadding;
            const w = rect.width + spotlightPadding * 2;
            const h = rect.height + spotlightPadding * 2;
            const maskId = 'tutorial-spot-mask';
            return (
              <motion.svg
                animate={{ opacity: 1 }}
                height='100%'
                initial={{ opacity: 0 }}
                style={{ inset: 0, pointerEvents: 'none', position: 'fixed', zIndex: 1300 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                width='100%'
              >
                <defs>
                  <mask id={maskId}>
                    <rect fill={theme.palette.background.white} height='100%' width='100%' x='0' y='0' />
                    <rect fill={theme.palette.background.base} height={h} width={w} x={x} y={y} />
                  </mask>
                </defs>
                <rect fill='rgba(0,0,0,0.6)' height='100%' mask={`url(#${maskId})`} width='100%' x='0' y='0' />
                <motion.rect
                  animate={{ strokeOpacity: [0.4, 0.8, 1, 0.8] }}
                  fill='none'
                  height={h}
                  stroke={theme.palette.primary.main}
                  strokeOpacity={0.8}
                  strokeWidth='2'
                  transition={{ duration: 1, ease: 'easeInOut', repeat: 1 }}
                  width={w}
                  x={x}
                  y={y}
                />
              </motion.svg>
            );
          })(),
          document.body
        )}

      {/* Target content stays interactive */}
      {children}

      {/* Explanatory floating card using Popper */}
      <Popper
        anchorEl={anchorRef.current}
        modifiers={[{ name: 'offset', options: { offset: [0, 32] } }]}
        open={visible}
        placement={placement}
        style={{ zIndex: 1400 }}
      >
        <motion.div animate={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 8 }} transition={{ duration: 0.4 }}>
          <Paper
            elevation={6}
            sx={{
              backgroundColor: theme.palette.ui.cardBackground,
              border: `2px solid ${theme.palette.primary.main}50`,
              borderRadius: 2,
              maxWidth: 320,
              p: 2,
              pr: 4,
              position: 'relative',
              userSelect: 'none',
              cursor: 'default',
            }}
          >
            <IconButton
              aria-label='Close tutorial highlight'
              size='small'
              sx={{ position: 'absolute', right: 2, top: 4 }}
              onClick={handleClose}
            >
              <CloseRoundedIcon fontSize='small' />
            </IconButton>
            <Typography sx={{ userSelect: 'none' }} variant='body1'>
              {text}
            </Typography>
          </Paper>
        </motion.div>
      </Popper>
    </Box>
  );
}

export default TutorialHighlight;
