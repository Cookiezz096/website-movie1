import React from "react";
import { CheckCircle2, Clock, AlertTriangle, XCircle, Sparkles } from "lucide-react";
import { STATUS_TYPES, formatShortDuration } from "../utils/releaseUtils";

/**
 * ReleaseStatusBadge Component
 * Renders consistent status badges across player, episode lists, and cards.
 */
export default function ReleaseStatusBadge({
  status = STATUS_TYPES.AVAILABLE,
  category = null,
  targetDate = null,
  showIcon = true,
  size = "md", // "sm" | "md" | "lg"
  className = "",
}) {
  const normalizedStatus =
    status === STATUS_TYPES.RELEASED ? STATUS_TYPES.AVAILABLE : status;

  let badgeClass = "badge-status-available";
  let icon = <CheckCircle2 size={size === "sm" ? 11 : 13} />;
  let label = "AVAILABLE";

  if (normalizedStatus === STATUS_TYPES.UPCOMING) {
    badgeClass = "badge-status-upcoming";
    icon = <Clock size={size === "sm" ? 11 : 13} className="spin-slow" />;
    const duration = targetDate ? formatShortDuration(targetDate) : "";
    label = duration ? `Arrives in ${duration}` : "UPCOMING";
  } else if (normalizedStatus === STATUS_TYPES.DELAYED) {
    badgeClass = "badge-status-delayed";
    icon = <AlertTriangle size={size === "sm" ? 11 : 13} />;
    label = "DELAYED";
  } else if (normalizedStatus === STATUS_TYPES.CANCELLED) {
    badgeClass = "badge-status-cancelled";
    icon = <XCircle size={size === "sm" ? 11 : 13} />;
    label = "CANCELLED";
  }

  return (
    <span
      className={`release-status-badge ${badgeClass} size-${size} ${className}`}
    >
      {showIcon && icon}
      {category && <b className="status-badge-cat">[{category}]</b>}
      <span>{label}</span>
    </span>
  );
}
