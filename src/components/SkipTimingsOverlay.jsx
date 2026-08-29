import React from "react";
import { FastForward, SkipForward, Sparkles } from "lucide-react";

/**
 * SkipTimingsOverlay Component
 * Renders skip buttons (Skip Opening, Skip Recap, Skip Ending) ONLY when
 * valid timing metadata exists for the current episode.
 */
export default function SkipTimingsOverlay({
  skipTimings = null,
  onSkip = null,
}) {
  if (!skipTimings) return null;

  const { recap, intro, outro } = skipTimings;
  const hasRecap = Array.isArray(recap) && recap.length === 2 && recap[1] > recap[0];
  const hasIntro = Array.isArray(intro) && intro.length === 2 && intro[1] > intro[0];
  const hasOutro = Array.isArray(outro) && outro.length === 2 && outro[1] > outro[0];

  if (!hasRecap && !hasIntro && !hasOutro) return null;

  return (
    <div className="skip-timings-bar">
      {hasRecap && (
        <button
          type="button"
          className="skip-btn skip-recap-btn"
          onClick={() => onSkip && onSkip("recap", recap[1])}
          title={`Skip Recap to ${Math.floor(recap[1] / 60)}:${(recap[1] % 60).toString().padStart(2, "0")}`}
        >
          <FastForward size={13} />
          <span>Skip Recap</span>
        </button>
      )}

      {hasIntro && (
        <button
          type="button"
          className="skip-btn skip-intro-btn"
          onClick={() => onSkip && onSkip("intro", intro[1])}
          title={`Skip Opening to ${Math.floor(intro[1] / 60)}:${(intro[1] % 60).toString().padStart(2, "0")}`}
        >
          <SkipForward size={13} />
          <span>Skip Opening</span>
        </button>
      )}

      {hasOutro && (
        <button
          type="button"
          className="skip-btn skip-outro-btn"
          onClick={() => onSkip && onSkip("outro", outro[1])}
          title={`Skip Ending to ${Math.floor(outro[1] / 60)}:${(outro[1] % 60).toString().padStart(2, "0")}`}
        >
          <SkipForward size={13} />
          <span>Skip Ending</span>
        </button>
      )}
    </div>
  );
}
