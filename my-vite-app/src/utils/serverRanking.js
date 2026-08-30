/**
 * serverRanking.js
 * Automatically ranks eligible streaming sources to select the optimal server
 * dynamically based on episode-level subtitle availability and health.
 */

import { SERVER_HEALTH, isServerPlayable } from "../data/sources.js";
import { getPreferredServer, hasRecentServerFailure } from "./watchHistory.js";

/**
 * Computes a priority score for a streaming source based on:
 *   - Playable + English Subtitles (+100)
 *   - Playable + Any Subtitles (+50)
 *   - Title/episode health status (WORKING > UNVERIFIED > DEGRADED)
 *   - User's saved server preference (+30)
 *   - Source recommended flag (+20)
 *   - Recent failure history (-50)
 */
export function scoreSource(source, sourceStatus = SERVER_HEALTH.WORKING) {
  if (!source) return -999;

  // Handle new object-based status structure
  const healthStr = typeof sourceStatus === 'object' ? sourceStatus.health : sourceStatus;
  
  if (!isServerPlayable(healthStr)) return -999;

  let score = 50;

  // 1. Subtitle Priority
  if (typeof sourceStatus === 'object') {
    if (sourceStatus.englishSubtitle) {
      score += 100;
    } else if (sourceStatus.subtitles && sourceStatus.subtitles.length > 0) {
      score += 50;
    }
  }

  // 2. Health tier scoring
  if (healthStr === SERVER_HEALTH.WORKING) {
    score += 50;
  } else if (healthStr === SERVER_HEALTH.UNVERIFIED) {
    score += 30; 
  } else if (healthStr === SERVER_HEALTH.DEGRADED) {
    score += 0;
  }

  // 3. User preferred server match
  const preferredId = getPreferredServer();
  const baseId = source.id?.replace(/-ssub$|-dub$/, "");
  if (preferredId && baseId === preferredId) {
    score += 30;
  }

  // 4. Recommended / stability flag from registry
  if (source.recommended) {
    score += 15;
  }

  // 5. Quality badge bonus
  if (source.badgeClass === "badge-fhd") {
    score += 5;
  }

  // 6. Recent failure penalty
  if (hasRecentServerFailure(source.id)) {
    score -= 40;
  }

  return score;
}

/**
 * Takes an array of sources, filters to only playable ones for this title/episode,
 * and returns them ranked by optimal playback quality and subtitle presence.
 */
export function rankSources(sources = [], getSourceStatusFn = null, categoryKey = "sub") {
  if (!Array.isArray(sources) || sources.length === 0) return [];

  // Filter and score
  const scored = sources
    .map((src, originalIndex) => {
      const status = getSourceStatusFn
        ? getSourceStatusFn(src, categoryKey)
        : src.health ?? SERVER_HEALTH.WORKING;

      const healthStr = typeof status === 'object' ? status.health : status;
      const score = scoreSource(src, status);
      
      return {
        source: src,
        originalIndex,
        status,
        score,
        isPlayable: isServerPlayable(healthStr),
      };
    })
    .filter((item) => item.isPlayable);

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);

  return scored;
}

/**
 * Automatically selects the best available source index from a sources list.
 */
export function getBestSourceIndex(sources = [], getSourceStatusFn = null, categoryKey = "sub") {
  const ranked = rankSources(sources, getSourceStatusFn, categoryKey);
  if (ranked.length === 0) return 0;
  return ranked[0].originalIndex;
}
