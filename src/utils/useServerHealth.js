/**
 * useServerHealth.js
 *
 * React hook that manages Provider-Level AND Title/Episode-Specific
 * Streaming Health Checks.
 *
 * Usage:
 *   const {
 *     healthMap,
 *     isChecking,
 *     filterSources,
 *     getSourceStatus,
 *     reportIssue,
 *     recheckHealth
 *   } = useServerHealth(contentType, { releaseData, type, id, season, episode });
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  checkMediaSourcesHealth,
  sourceHealthState,
  getSourceHealth,
  reportRuntimePlaybackIssue,
  clearHealthCache,
} from "../data/serverHealthService";
import {
  serverHealthState,
  SERVER_HEALTH,
  getSourceHealthKey,
  isServerPlayable,
} from "../data/sources";

export function useServerHealth(contentType = "movie", mediaContext = null) {
  const [healthMap, setHealthMap] = useState(() => ({
    ...serverHealthState,
    ...sourceHealthState,
  }));
  const [isChecking, setIsChecking] = useState(false);

  const mediaContextRef = useRef(mediaContext);
  mediaContextRef.current = mediaContext;

  const runMediaChecks = useCallback(async () => {
    const ctx = mediaContextRef.current;
    if (!ctx || !ctx.releaseData) return;

    setIsChecking(true);
    try {
      await checkMediaSourcesHealth({
        releaseData: ctx.releaseData,
        type: ctx.type || "movie",
        id: ctx.id,
        season: ctx.season || 1,
        episode: ctx.episode || 1,
        onUpdate: (key, health) => {
          setHealthMap((prev) => {
            if (prev[key] === health) return prev;
            return { ...prev, [key]: health };
          });
        },
      });
    } finally {
      setIsChecking(false);
    }
  }, []);

  // Run checks when title, episode, or releaseData changes
  useEffect(() => {
    runMediaChecks();
  }, [
    mediaContext?.id,
    mediaContext?.type,
    mediaContext?.season,
    mediaContext?.episode,
    runMediaChecks,
  ]);

  // Listen for runtime health updates (e.g. from player playback failures)
  useEffect(() => {
    function handleHealthEvent(e) {
      if (e?.detail) {
        const { sourceKey, serverId, health } = e.detail;
        setHealthMap((prev) => {
          const next = { ...prev };
          if (sourceKey) next[sourceKey] = health;
          if (serverId) next[serverId] = health;
          return next;
        });
      }
    }
    window.addEventListener("server-health-updated", handleHealthEvent);
    return () =>
      window.removeEventListener("server-health-updated", handleHealthEvent);
  }, []);

  /**
   * Resolves the title/episode-specific health status for a given source object.
   */
  const getSourceStatus = useCallback(
    (source, categoryKey = "sub") => {
      if (!source) return SERVER_HEALTH.WORKING;
      const ctx = mediaContextRef.current;
      const key = getSourceHealthKey({
        serverId: source.id,
        type: ctx?.type || "movie",
        id: ctx?.id,
        season: ctx?.season || 1,
        episode: ctx?.episode || 1,
        categoryKey,
      });

      const baseServerId = source.id?.replace(/-ssub$|-dub$/, "");
      return (
        healthMap[key] ??
        sourceHealthState[key] ??
        source.health ??
        healthMap[baseServerId] ??
        healthMap[source.id] ??
        SERVER_HEALTH.WORKING
      );
    },
    [healthMap]
  );

  /**
   * Filters a sources array to only include servers whose status for THIS
   * specific title/episode is PLAYABLE (WORKING, UNVERIFIED, DEGRADED).
   * Excludes UNAVAILABLE and OFFLINE servers.
   */
  const filterSources = useCallback(
    (sources = [], categoryKey = "sub") => {
      return sources.filter((src) => {
        const status = getSourceStatus(src, categoryKey);
        return isServerPlayable(status);
      });
    },
    [getSourceStatus]
  );

  /**
   * Reports a playback issue for the current title/episode.
   */
  const reportIssue = useCallback(
    (serverId, categoryKey = "sub", issueType = "unavailable") => {
      const ctx = mediaContextRef.current;
      reportRuntimePlaybackIssue({
        serverId,
        type: ctx?.type || "movie",
        id: ctx?.id,
        season: ctx?.season || 1,
        episode: ctx?.episode || 1,
        categoryKey,
        issueType,
      });
    },
    []
  );

  return {
    healthMap,
    isChecking,
    filterSources,
    getSourceStatus,
    reportIssue,
    recheckHealth: () => {
      clearHealthCache();
      runMediaChecks();
    },
  };
}
