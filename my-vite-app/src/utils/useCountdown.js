import { useState, useEffect, useRef } from "react";
import { calculateRemainingTime } from "./releaseUtils";

/**
 * useCountdown React Hook
 * Automatically ticks every second and calls onExpire when countdown reaches 0.
 *
 * @param {string|Date} targetDate - The ISO timestamp or Date object to count down to
 * @param {Function} onExpire - Optional callback triggered when the target date is reached
 * @returns {{ remaining: object, isExpired: boolean, formatted: string }}
 */
export function useCountdown(targetDate, onExpire) {
  const [remaining, setRemaining] = useState(() =>
    calculateRemainingTime(targetDate)
  );
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    hasTriggeredRef.current = false;
    const initial = calculateRemainingTime(targetDate);
    setRemaining(initial);

    if (initial.isExpired) {
      if (onExpireRef.current && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        onExpireRef.current();
      }
      return;
    }

    const interval = setInterval(() => {
      const current = calculateRemainingTime(targetDate);
      setRemaining(current);

      if (current.isExpired) {
        clearInterval(interval);
        if (onExpireRef.current && !hasTriggeredRef.current) {
          hasTriggeredRef.current = true;
          onExpireRef.current();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return {
    remaining,
    isExpired: remaining.isExpired,
    formatted: remaining.formattedString,
  };
}
