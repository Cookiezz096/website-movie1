/**
 * releaseUtils.js
 * Universal release date, timezone, countdown, and streaming category status utilities.
 */

export const STATUS_TYPES = {
  AVAILABLE: "AVAILABLE",
  RELEASED: "RELEASED",
  UPCOMING: "UPCOMING",
  DELAYED: "DELAYED",
  CANCELLED: "CANCELLED",
};

export const CATEGORIES = {
  SUB: "SUB",
  SSUB: "S-SUB",
  DUB: "DUB",
};

/**
 * Safely parse a date string or timestamp into a Date object.
 * Returns null if invalid.
 */
export function parseDate(dateInput) {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  try {
    const parsed = new Date(dateInput);
    return isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Formats an ISO / UTC timestamp into the user's localized date and time string.
 * Example: "Aug 30, 2026, 3:00 PM (GMT+7)"
 */
export function formatLocalDateTime(dateInput, includeTimezone = true) {
  const date = parseDate(dateInput);
  if (!date) return "TBA";

  const options = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };

  try {
    const formatted = new Intl.DateTimeFormat(undefined, options).format(date);
    if (!includeTimezone) return formatted;

    // Get short timezone name (e.g. GMT+7 or ICT)
    const tzName =
      new Intl.DateTimeFormat(undefined, { timeZoneName: "short" })
        .formatToParts(date)
        .find((p) => p.type === "timeZoneName")?.value || "";

    return tzName ? `${formatted} (${tzName})` : formatted;
  } catch {
    return date.toLocaleString();
  }
}

/**
 * Calculates remaining time until target date from current timestamp.
 * Returns days, hours, minutes, seconds, and totalMs.
 */
export function calculateRemainingTime(targetDateInput) {
  const targetDate = parseDate(targetDateInput);
  if (!targetDate) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formattedString: "0s",
    };
  }

  const now = Date.now();
  const diff = targetDate.getTime() - now;

  if (diff <= 0) {
    return {
      totalMs: 0,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
      formattedString: "0s",
    };
  }

  const seconds = Math.floor((diff / 1000) % 60);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  let formatted = "";
  if (days > 0) formatted += `${days}d `;
  if (hours > 0 || days > 0) formatted += `${hours.toString().padStart(2, "0")}h `;
  formatted += `${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;

  return {
    totalMs: diff,
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
    formattedString: formatted.trim(),
  };
}

/**
 * Determines the current status of a streaming category (sub, ssub, dub)
 * or an entire episode/movie.
 */
export function getCategoryStatus(categoryConfig) {
  if (!categoryConfig) return STATUS_TYPES.CANCELLED;

  // Explicit override statuses
  if (categoryConfig.status === STATUS_TYPES.CANCELLED) return STATUS_TYPES.CANCELLED;
  if (categoryConfig.status === STATUS_TYPES.DELAYED) return STATUS_TYPES.DELAYED;
  if (categoryConfig.status === STATUS_TYPES.RELEASED || categoryConfig.status === STATUS_TYPES.AVAILABLE) {
    return STATUS_TYPES.AVAILABLE;
  }

  // Check release timestamp
  if (categoryConfig.releaseAt) {
    const target = parseDate(categoryConfig.releaseAt);
    if (target) {
      if (Date.now() >= target.getTime()) {
        return STATUS_TYPES.AVAILABLE;
      }
      return STATUS_TYPES.UPCOMING;
    }
  }

  // If sources exist and no future release time specified, it is available
  if (categoryConfig.sources && categoryConfig.sources.length > 0) {
    return STATUS_TYPES.AVAILABLE;
  }

  // If no sources and no releaseAt, default to upcoming if scheduled or cancelled
  return categoryConfig.status || STATUS_TYPES.UPCOMING;
}

/**
 * Formats a short duration string (e.g. "21h 08m" or "7d")
 */
export function formatShortDuration(targetDateInput) {
  const targetDate = parseDate(targetDateInput);
  if (!targetDate) return "";

  const diff = targetDate.getTime() - Date.now();
  if (diff <= 0) return "Now";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
