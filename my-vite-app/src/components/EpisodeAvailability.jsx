import React from "react";
import { Play, Clock, Sparkles, Star, CheckCircle } from "lucide-react";
import ReleaseStatusBadge from "./ReleaseStatusBadge";
import { getCategoryStatus, STATUS_TYPES, formatShortDuration } from "../utils/releaseUtils";

/**
 * EpisodeAvailability Component
 * Renders individual episode items in the series episode browser with full release,
 * audio availability, and watch progress tracking.
 */
export default function EpisodeAvailability({
  episodeNumber,
  title,
  overview,
  rating,
  episodeConfig = null,
  isCurrent = false,
  watchProgress = null, // { progressPercent, currentTime }
  onSelect,
}) {
  const subStatus = episodeConfig?.sub ? getCategoryStatus(episodeConfig.sub) : STATUS_TYPES.AVAILABLE;
  const dubStatus = episodeConfig?.dub ? getCategoryStatus(episodeConfig.dub) : null;
  const ssubStatus = episodeConfig?.ssub ? getCategoryStatus(episodeConfig.ssub) : null;

  // Overall episode availability
  const isAnyAvailable =
    subStatus === STATUS_TYPES.AVAILABLE ||
    dubStatus === STATUS_TYPES.AVAILABLE ||
    ssubStatus === STATUS_TYPES.AVAILABLE;

  const isAllUpcoming =
    subStatus === STATUS_TYPES.UPCOMING &&
    (dubStatus === null || dubStatus === STATUS_TYPES.UPCOMING) &&
    (ssubStatus === null || ssubStatus === STATUS_TYPES.UPCOMING);

  const primaryTargetDate =
    episodeConfig?.sub?.releaseAt || episodeConfig?.dub?.releaseAt || null;

  const progressPercent = watchProgress?.progressPercent || 0;
  const isWatched = progressPercent >= 90;

  return (
    <button
      type="button"
      className={`episode-card-item ${isCurrent ? "active-ep" : ""} ${
        !isAnyAvailable ? "episode-upcoming-card" : ""
      }`}
      onClick={onSelect}
    >
      <div className="ep-num-box">
        {isAnyAvailable ? (
          <span>{episodeNumber}</span>
        ) : (
          <Clock size={16} className="ep-upcoming-icon" />
        )}
      </div>

      <div className="ep-details">
        <div className="ep-header-row">
          <div className="ep-title-group">
            <span className="ep-index-prefix">EP {episodeNumber}</span>
            <b className="ep-title">{title || `Episode ${episodeNumber}`}</b>
          </div>

          <div className="ep-badges-group">
            {rating > 0 && (
              <span className="ep-rating">
                <Star size={11} fill="#fbbf24" color="#fbbf24" />
                {rating.toFixed(1)}
              </span>
            )}

            {isWatched ? (
              <span className="ep-watched-tag" title="Completed">
                <CheckCircle size={11} /> Watched
              </span>
            ) : progressPercent > 5 ? (
              <span className="ep-progress-tag">
                {progressPercent}%
              </span>
            ) : null}

            {isAnyAvailable ? (
              <ReleaseStatusBadge status={STATUS_TYPES.AVAILABLE} size="sm" />
            ) : isAllUpcoming ? (
              <ReleaseStatusBadge
                status={STATUS_TYPES.UPCOMING}
                category={episodeConfig?.sub?.releaseAt ? "SUB" : null}
                targetDate={primaryTargetDate}
                size="sm"
              />
            ) : episodeConfig?.status ? (
              <ReleaseStatusBadge status={episodeConfig.status} size="sm" />
            ) : null}
          </div>
        </div>

        {/* Audio availability breakdown pills */}
        <div className="ep-audio-pills-row">
          {episodeConfig?.sub && (
            <span
              className={`ep-audio-pill ${
                subStatus === STATUS_TYPES.AVAILABLE ? "pill-avail" : "pill-up"
              }`}
            >
              SUB: {subStatus === STATUS_TYPES.AVAILABLE ? "Available" : formatShortDuration(episodeConfig.sub.releaseAt) ? `In ${formatShortDuration(episodeConfig.sub.releaseAt)}` : "Upcoming"}
            </span>
          )}

          {episodeConfig?.dub && (
            <span
              className={`ep-audio-pill ${
                dubStatus === STATUS_TYPES.AVAILABLE ? "pill-avail" : "pill-up"
              }`}
            >
              DUB: {dubStatus === STATUS_TYPES.AVAILABLE ? "Available" : formatShortDuration(episodeConfig.dub.releaseAt) ? `In ${formatShortDuration(episodeConfig.dub.releaseAt)}` : "Upcoming"}
            </span>
          )}

          {episodeConfig?.ssub && (
            <span
              className={`ep-audio-pill ${
                ssubStatus === STATUS_TYPES.AVAILABLE ? "pill-avail" : "pill-up"
              }`}
            >
              S-SUB: {ssubStatus === STATUS_TYPES.AVAILABLE ? "Available" : "Upcoming"}
            </span>
          )}
        </div>

        {overview && (
          <small className="ep-desc">{overview}</small>
        )}

        {/* Watch Progress Mini Bar */}
        {progressPercent > 0 && (
          <div className="ep-progress-track">
            <div
              className="ep-progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>
    </button>
  );
}
