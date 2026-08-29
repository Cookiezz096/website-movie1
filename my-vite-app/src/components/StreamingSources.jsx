import React from "react";
import {
  Server,
  RefreshCw,
  WifiOff,
  Wifi,
  ShieldCheck,
} from "lucide-react";
import StreamingCategory from "./StreamingCategory";
import { CATEGORIES } from "../utils/releaseUtils";
import { useServerHealth } from "../utils/useServerHealth";
import { SERVER_HEALTH, isServerPlayable } from "../data/sources";

/**
 * StreamingSources Component
 * Groups SUB, S-SUB, and DUB categories for the active content.
 * Evaluates Provider-Level AND Title/Episode-Specific health states.
 */
export default function StreamingSources({
  sourcesConfig = {},
  contentType = "movie",
  mediaContext = null,
  activeCategoryKey = "sub",
  activeServerIndex = 0,
  onSelectCategory,
  onSelectServer,
  onReloadStream,
}) {
  const fullContext = {
    ...mediaContext,
    releaseData: sourcesConfig,
  };

  const {
    healthMap,
    isChecking,
    filterSources,
    getSourceStatus,
    recheckHealth,
  } = useServerHealth(contentType, fullContext);

  const subConfig  = sourcesConfig?.sub;
  const ssubConfig = sourcesConfig?.ssub;
  const dubConfig  = sourcesConfig?.dub;

  // Filter out categories with no data at all
  const hasSub  = subConfig  && ((subConfig.sources?.length  > 0) || subConfig.releaseAt  || subConfig.status);
  const hasSsub = ssubConfig && ((ssubConfig.sources?.length > 0) || ssubConfig.releaseAt || ssubConfig.status);
  const hasDub  = dubConfig  && ((dubConfig.sources?.length  > 0) || dubConfig.releaseAt  || dubConfig.status);

  // Compute working server count for header badge using title/episode-specific resolution
  const allCategoryEntries = [
    { config: subConfig, key: "sub" },
    { config: ssubConfig, key: "ssub" },
    { config: dubConfig, key: "dub" },
  ].filter((entry) => Boolean(entry.config));

  const allSources = allCategoryEntries.flatMap((entry) =>
    (entry.config.sources || []).map((src) => ({
      ...src,
      categoryKey: entry.key,
    }))
  );

  const workingCount = allSources.filter((src) => {
    const status = getSourceStatus(src, src.categoryKey);
    return isServerPlayable(status);
  }).length;
  const totalCount = allSources.length;

  // Content type label
  const contentLabel = contentType === "anime" ? "Anime" : "Movie";

  if (!hasSub && !hasSsub && !hasDub) {
    return (
      <div className="server-panel empty">
        <WifiOff size={16} />
        <span>No streaming sources currently configured for this release.</span>
      </div>
    );
  }

  return (
    <div className="server-panel">
      <div className="server-panel-header">
        <div className="server-header-title">
          <Server size={17} />
          <b>Streaming Sources</b>
          <span className="server-content-type-label">{contentLabel}</span>
        </div>

        <div className="server-header-actions">
          {/* Health status indicator */}
          {isChecking ? (
            <span className="health-status-tag checking">
              <RefreshCw size={11} className="health-check-spinner" />
              Checking…
            </span>
          ) : workingCount === totalCount && totalCount > 0 ? (
            <span className="health-status-tag all-ok" title="All sources available for this release">
              <ShieldCheck size={11} />
              {workingCount} Available
            </span>
          ) : (
            <span
              className="health-status-tag some-down"
              title={`${totalCount - workingCount} source(s) unavailable for this title`}
            >
              <WifiOff size={11} />
              {workingCount}/{totalCount} Available
            </span>
          )}

          <span className="server-tip">
            Switch server below if stream stops
          </span>

          <button
            type="button"
            className="server-quick-reload-btn"
            onClick={recheckHealth}
            title="Re-check server health for this title"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>

          {onReloadStream && (
            <button
              type="button"
              className="server-quick-reload-btn"
              onClick={onReloadStream}
              title="Reload current stream"
            >
              <RefreshCw size={13} />
              <span>Reload</span>
            </button>
          )}
        </div>
      </div>

      <div className="streaming-categories-container">
        {hasSub && (
          <StreamingCategory
            categoryKey="sub"
            categoryLabel={CATEGORIES.SUB}
            categoryConfig={subConfig}
            activeCategoryKey={activeCategoryKey}
            activeServerIndex={activeServerIndex}
            onSelectCategory={onSelectCategory}
            onSelectServer={onSelectServer}
            getSourceStatus={getSourceStatus}
            isCheckingHealth={isChecking}
          />
        )}

        {hasSsub && (
          <StreamingCategory
            categoryKey="ssub"
            categoryLabel={CATEGORIES.SSUB}
            categoryConfig={ssubConfig}
            activeCategoryKey={activeCategoryKey}
            activeServerIndex={activeServerIndex}
            onSelectCategory={onSelectCategory}
            onSelectServer={onSelectServer}
            getSourceStatus={getSourceStatus}
            isCheckingHealth={isChecking}
          />
        )}

        {hasDub && (
          <StreamingCategory
            categoryKey="dub"
            categoryLabel={CATEGORIES.DUB}
            categoryConfig={dubConfig}
            activeCategoryKey={activeCategoryKey}
            activeServerIndex={activeServerIndex}
            onSelectCategory={onSelectCategory}
            onSelectServer={onSelectServer}
            getSourceStatus={getSourceStatus}
            isCheckingHealth={isChecking}
          />
        )}
      </div>
    </div>
  );
}
