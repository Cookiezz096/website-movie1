import React from "react";
import { Clock, Play, AlertTriangle, XCircle, Sparkles, Tv, Clapperboard } from "lucide-react";
import ReleaseCountdown from "./ReleaseCountdown";
import ReleaseStatusBadge from "./ReleaseStatusBadge";
import { STATUS_TYPES, formatLocalDateTime } from "../utils/releaseUtils";

/**
 * UpcomingOverlay Component
 * Shown when an episode, movie, or specific audio/sub category is not available yet.
 */
export default function UpcomingOverlay({
  mediaTitle = "Episode",
  category = "SUB",
  categoryConfig = null,
  availableAlternativeCategory = null,
  onSwitchCategory = null,
  onExpire = null,
}) {
  const status = categoryConfig?.status || STATUS_TYPES.UPCOMING;
  const releaseAt = categoryConfig?.releaseAt;
  const localDate = formatLocalDateTime(releaseAt);

  if (status === STATUS_TYPES.CANCELLED) {
    return (
      <div className="upcoming-player-card cancelled">
        <div className="upcoming-badge-row">
          <ReleaseStatusBadge status={STATUS_TYPES.CANCELLED} category={category} size="lg" />
        </div>
        <div className="upcoming-icon-wrap cancelled">
          <XCircle size={44} />
        </div>
        <h2 className="upcoming-heading">{mediaTitle} [{category}] Cancelled</h2>
        <p className="upcoming-desc">
          This release has been cancelled or postponed indefinitely by the broadcast network.
        </p>
        {availableAlternativeCategory && (
          <button
            type="button"
            className="switch-category-btn"
            onClick={() => onSwitchCategory && onSwitchCategory(availableAlternativeCategory)}
          >
            <Play size={16} fill="currentColor" />
            <span>Watch in [{availableAlternativeCategory}] instead (Available Now)</span>
          </button>
        )}
      </div>
    );
  }

  if (status === STATUS_TYPES.DELAYED) {
    return (
      <div className="upcoming-player-card delayed">
        <div className="upcoming-badge-row">
          <ReleaseStatusBadge status={STATUS_TYPES.DELAYED} category={category} size="lg" />
        </div>
        <div className="upcoming-icon-wrap delayed">
          <AlertTriangle size={44} />
        </div>
        <h2 className="upcoming-heading">{mediaTitle} [{category}] Delayed</h2>
        <p className="upcoming-desc">
          Production / broadcast is delayed. Expected air date: <b>{localDate}</b>.
        </p>
        {releaseAt && (
          <ReleaseCountdown
            targetDate={releaseAt}
            category={category}
            title="Estimated delay countdown"
            onExpire={onExpire}
            variant="card"
          />
        )}
        {availableAlternativeCategory && (
          <button
            type="button"
            className="switch-category-btn"
            onClick={() => onSwitchCategory && onSwitchCategory(availableAlternativeCategory)}
          >
            <Play size={16} fill="currentColor" />
            <span>Watch in [{availableAlternativeCategory}] instead (Available Now)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="upcoming-player-card">
      <div className="upcoming-badge-row">
        <ReleaseStatusBadge status={STATUS_TYPES.UPCOMING} category={category} targetDate={releaseAt} size="lg" />
      </div>

      <div className="upcoming-icon-wrap">
        <Clock size={40} className="spin-slow" />
      </div>

      <h2 className="upcoming-heading">
        {mediaTitle} <span className="category-accent">[{category}]</span> is not available yet.
      </h2>
      <p className="upcoming-desc">
        The {category} streaming servers will unlock automatically upon official release.
      </p>

      {releaseAt ? (
        <ReleaseCountdown
          targetDate={releaseAt}
          category={category}
          title={`${mediaTitle} [${category}] is scheduled to arrive in:`}
          onExpire={onExpire}
          variant="card"
        />
      ) : (
        <div className="countdown-tba-box">
          <Clock size={18} />
          <span>Release time is scheduled soon. Check back shortly.</span>
        </div>
      )}

      {availableAlternativeCategory && (
        <div className="upcoming-alternative-box">
          <span className="alternative-label">Want to watch right now?</span>
          <button
            type="button"
            className="switch-category-btn"
            onClick={() => onSwitchCategory && onSwitchCategory(availableAlternativeCategory)}
          >
            <Play size={16} fill="currentColor" />
            <span>Watch in [{availableAlternativeCategory}] version (Available Now)</span>
          </button>
        </div>
      )}
    </div>
  );
}
