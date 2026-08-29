import React from "react";
import { Clock, Calendar, Sparkles } from "lucide-react";
import { useCountdown } from "../utils/useCountdown";
import { formatLocalDateTime } from "../utils/releaseUtils";

/**
 * ReleaseCountdown Component
 * Displays Days, Hours, Minutes, Seconds with live updates and auto-refresh when reaching zero.
 */
export default function ReleaseCountdown({
  targetDate,
  title = "Scheduled to arrive in",
  category = "SUB",
  onExpire,
  variant = "banner", // "banner" | "card" | "inline" | "badge"
  showDate = true,
}) {
  const { remaining, isExpired } = useCountdown(targetDate, onExpire);

  if (isExpired) {
    return null;
  }

  const { days, hours, minutes, seconds } = remaining;
  const localDateStr = formatLocalDateTime(targetDate);

  if (variant === "inline") {
    return (
      <span className="countdown-inline">
        <Clock size={13} className="countdown-icon-spin" />
        <span className="countdown-inline-text">
          {days > 0 ? `${days}d ` : ""}
          {hours.toString().padStart(2, "0")}h:
          {minutes.toString().padStart(2, "0")}m:
          {seconds.toString().padStart(2, "0")}s
        </span>
      </span>
    );
  }

  if (variant === "badge") {
    return (
      <span className="countdown-badge-pill" title={`Scheduled for ${localDateStr}`}>
        <Clock size={11} />
        <span>
          {days > 0 ? `${days}d ` : ""}
          {hours.toString().padStart(2, "0")}h {minutes.toString().padStart(2, "0")}m
        </span>
      </span>
    );
  }

  return (
    <div className={`countdown-container countdown-${variant}`}>
      <div className="countdown-header">
        <div className="countdown-title-wrap">
          <Sparkles size={16} className="countdown-sparkle" />
          <span className="countdown-category-tag">[{category}]</span>
          <span className="countdown-title">{title}</span>
        </div>
      </div>

      <div className="countdown-tiles-row">
        <div className="countdown-tile">
          <div className="countdown-digit">{days.toString().padStart(2, "0")}</div>
          <div className="countdown-label">DAYS</div>
        </div>
        <div className="countdown-separator">:</div>

        <div className="countdown-tile">
          <div className="countdown-digit">{hours.toString().padStart(2, "0")}</div>
          <div className="countdown-label">HOURS</div>
        </div>
        <div className="countdown-separator">:</div>

        <div className="countdown-tile">
          <div className="countdown-digit">{minutes.toString().padStart(2, "0")}</div>
          <div className="countdown-label">MINS</div>
        </div>
        <div className="countdown-separator">:</div>

        <div className="countdown-tile highlight">
          <div className="countdown-digit">{seconds.toString().padStart(2, "0")}</div>
          <div className="countdown-label">SECS</div>
        </div>
      </div>

      {showDate && (
        <div className="countdown-footer-date">
          <Calendar size={14} />
          <span>Release Date: <b>{localDateStr}</b></span>
        </div>
      )}
    </div>
  );
}
