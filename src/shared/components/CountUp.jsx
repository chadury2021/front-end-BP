import { useEffect, useRef } from 'react';
import { useInView, useMotionValue, useSpring } from 'framer-motion';

export default function CountUp({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  decimals = null,
  onStart,
  onEnd,
}) {
  // Convert to numbers and handle edge cases
  const toNum = typeof to === 'string' ? parseFloat(to) : to;
  const fromNum = typeof from === 'string' ? parseFloat(from) : from;

  const ref = useRef(null);
  const motionValue = useMotionValue(direction === 'down' ? toNum : fromNum);

  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);

  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });

  const isInView = useInView(ref, { once: true, margin: '0px' });

  const getDecimalPlaces = (num) => {
    const str = num.toString();

    if (str.includes('.')) {
      const decimalPart = str.split('.')[1];

      if (parseInt(decimalPart, 10) !== 0) {
        return decimalPart.length;
      }
    }

    return 0;
  };

  const maxDecimals = decimals !== null ? decimals : Math.max(getDecimalPlaces(fromNum), getDecimalPlaces(toNum));
  const hasInitialized = useRef(false);

  // Only set initial value on first mount
  useEffect(() => {
    if (ref.current && !hasInitialized.current) {
      const initialValue = fromNum;
      const hasDecimals = maxDecimals > 0;

      const options = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };

      const formattedNumber = Intl.NumberFormat('en-US', options).format(initialValue);

      ref.current.textContent = separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;

      hasInitialized.current = true;
    }
  }, [fromNum, separator, maxDecimals]);

  useEffect(() => {
    if (isInView && startWhen) {
      if (typeof onStart === 'function') onStart();

      // Set the starting value immediately (no flash)
      motionValue.set(fromNum);

      const timeoutId = setTimeout(() => {
        motionValue.set(toNum);
      }, delay * 1000);

      const durationTimeoutId = setTimeout(
        () => {
          if (typeof onEnd === 'function') onEnd();
        },
        delay * 1000 + duration * 1000
      );

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
    return undefined;
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        const hasDecimals = maxDecimals > 0;

        const options = {
          useGrouping: !!separator,
          minimumFractionDigits: hasDecimals ? maxDecimals : 0,
          maximumFractionDigits: hasDecimals ? maxDecimals : 0,
        };

        const formattedNumber = Intl.NumberFormat('en-US', options).format(latest);
        ref.current.textContent = separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
      }
    });

    return () => unsubscribe();
  }, [springValue, separator, maxDecimals]);

  return <span className={className} ref={ref} />;
}
