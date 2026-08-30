import React from "react";
import {
  Check,
  Globe,
  Volume2,
  Subtitles,
  WifiOff,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import ReleaseStatusBadge from "./ReleaseStatusBadge";
import { STATUS_TYPES } from "../utils/releaseUtils";
import { SERVER_HEALTH, isServerPlayable } from "../data/sources";

/**
 * StreamingCategory Component
 * Renders a single category block (SUB / S-SUB / DUB) with its status badge and server list.
 * Evaluates Title/Episode-Specific source health and hides unavailable/offline sources.
 */
export default function StreamingCategory({
  categoryKey = "sub",
  categoryLabel = "SUB",
  categoryConfig = null,
  activeCategoryKey = "sub",
  activeServerIndex = 0,
  onSelectCategory,
  onSelectServer,
  // Function returning title/episode-specific status: (source, categoryKey) => SERVER_HEALTH
  getSourceStatus = null,
  isCheckingHealth = false,
}) {
  if (!categoryConfig) return null;

  const allSources = categoryConfig.sources || [];
  const status = categoryConfig.status || STATUS_TYPES.AVAILABLE;
  const isCategorySelected =
    activeCategoryKey.toLowerCase() === categoryKey.toLowerCase();
  const isAvailable = status === STATUS_TYPES.AVAILABLE;

  // Filter sources to only playable servers for THIS specific title/episode
  const sources = allSources.filter((src) => {
    const srcStatus = getSourceStatus
      ? getSourceStatus(src, categoryKey)
      : src.health ?? SERVER_HEALTH.WORKING;
    const healthStr = typeof srcStatus === "object" ? srcStatus.health : srcStatus;
    return isServerPlayable(healthStr);
  });

  const offlineCount = allSources.length - sources.length;

  // Category icon
  let categoryIcon = <Subtitles size={15} />;
  if (categoryKey.toLowerCase() === "dub") {
    categoryIcon = <Volume2 size={15} />;
  } else if (categoryKey.toLowerCase() === "ssub") {
    categoryIcon = <Globe size={15} />;
  }

  function getHealthIcon(source) {
    const srcStatus = getSourceStatus
      ? getSourceStatus(source, categoryKey)
      : source.health ?? SERVER_HEALTH.WORKING;

    const healthStr = typeof srcStatus === "object" ? srcStatus.health : srcStatus;

    if (
      healthStr === SERVER_HEALTH.WORKING ||
      healthStr === SERVER_HEALTH.UNVERIFIED
    ) {
      return null;
    }
    if (healthStr === SERVER_HEALTH.DEGRADED) {
      return (
        <AlertTriangle
          size={10}
          className="server-health-icon degraded"
          title="High Latency / Degraded"
        />
      );
    }
    if (healthStr === SERVER_HEALTH.UNAVAILABLE) {
      return (
        <AlertTriangle
          size={10}
          className="server-health-icon offline"
          title="Media Source Unavailable for this title"
        />
      );
    }
    if (healthStr === SERVER_HEALTH.OFFLINE) {
      return (
        <WifiOff
          size={10}
          className="server-health-icon offline"
          title="Provider Offline"
        />
      );
    }
    return null;
  }

  function hasEnglishSub(source) {
    const srcStatus = getSourceStatus
      ? getSourceStatus(source, categoryKey)
      : null;
    if (typeof srcStatus === "object" && srcStatus.englishSubtitle) return true;
    if (Array.isArray(source.subtitles)) {
      return source.subtitles.some(
        (s) => s.languageCode?.toLowerCase() === "en" || s.language?.toLowerCase().includes("english")
      );
    }
    return false;
  }

  return (
    <div
      className={`streaming-category-block ${isCategorySelected ? "category-active-block" : ""} ${
        !isAvailable ? "category-locked-block" : ""
      }`}
    >
      <div
        className="streaming-category-header"
        onClick={() => onSelectCategory && onSelectCategory(categoryKey)}
      >
        <div className="category-header-left">
          <div className="category-type-pill">
            {categoryIcon}
            <span className="category-name">{categoryLabel}</span>
          </div>
          <span className="category-count">
            {isAvailable ? (
              <>
                {sources.length}{" "}
                {sources.length === 1 ? "Server" : "Servers"}
                {offlineCount > 0 && (
                  <span
                    className="category-offline-count"
                    title={`${offlineCount} server(s) unavailable for this title/episode`}
                  >
                    {" "}· {offlineCount} unavailable
                  </span>
                )}
                {isCheckingHealth && (
                  <RefreshCw
                    size={10}
                    className="health-check-spinner"
                    title="Checking source availability…"
                  />
                )}
              </>
            ) : (
              "Locked"
            )}
          </span>
        </div>

        <div className="category-header-right">
          <ReleaseStatusBadge
            status={status}
            targetDate={categoryConfig.releaseAt}
            size="sm"
          />
        </div>
      </div>

      <div className="category-servers-row">
        {isAvailable ? (
          sources.length > 0 ? (
            sources.map((srv, index) => {
              const isServerActive =
                isCategorySelected && activeServerIndex === index;
              const displayName = srv.name || `Server ${index + 1}`;
              const badge = srv.badge || srv.quality || "1080p HD";
              const badgeClass = srv.badgeClass || "badge-fhd";

              return (
                <button
                  key={srv.id || `${srv.name}-${index}`}
                  type="button"
                  className={`server-pill-btn ${isServerActive ? "active" : ""}`}
                  onClick={() => onSelectServer(categoryKey, index, srv)}
                  title={`${displayName} — ${badge}${
                    srv.tag ? " · " + srv.tag : ""
                  }`}
                >
                  <span className="server-pill-name">{displayName}</span>
                  {badge && (
                    <span className={`server-pill-badge ${badgeClass}`}>
                      {badge}
                    </span>
                  )}
                  {hasEnglishSub(srv) && (
                    <span className="server-eng-sub-badge" title="English subtitles verified">🔤 EN</span>
                  )}
                  {getHealthIcon(srv)}
                  {isServerActive && (
                    <Check size={12} className="server-check-icon" />
                  )}
                </button>
              );
            })
          ) : (
            // All servers for this category are unavailable for this title/episode
            <div className="category-no-servers-msg">
              <div className="category-no-servers-header">
                <WifiOff size={15} />
                <b>No working servers available for this title</b>
              </div>
              <span className="category-offline-hint">
                All {allSources.length} configured source
                {allSources.length !== 1 ? "s are" : " is"} currently offline or
                their playback manifest is unavailable for this specific release.
              </span>
            </div>
          )
        ) : (
          <div
            className="category-unreleased-hint"
            onClick={() => onSelectCategory && onSelectCategory(categoryKey)}
          >
            <span>
              Click to view {categoryLabel} release countdown & schedule
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
