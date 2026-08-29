import React, { useState, useEffect } from "react";
import { Play, X, SkipForward, Sparkles } from "lucide-react";

/**
 * AutoNextOverlay Component
 * Displays when an episode finishes or user triggers next episode countdown.
 */
export default function AutoNextOverlay({
  nextEpisodeNumber,
  nextEpisodeTitle = "",
  onPlayNext,
  onCancel,
  countdownSeconds = 6,
}) {
  const [remaining, setRemaining] = useState(countdownSeconds);

  useEffect(() => {
    if (remaining <= 0) {
      if (onPlayNext) onPlayNext();
      return;
    }
    const timer = setTimeout(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [remaining, onPlayNext]);

  return (
    <div className="auto-next-overlay">
      <div className="auto-next-card">
        <div className="auto-next-header">
          <span className="auto-next-badge">Episode Complete</span>
          <button
            type="button"
            className="auto-next-close-btn"
            onClick={onCancel}
            title="Cancel auto-play"
          >
            <X size={15} />
          </button>
        </div>

        <div className="auto-next-body">
          <h3 className="auto-next-title">
            Next: Episode {nextEpisodeNumber}
            {nextEpisodeTitle ? ` — ${nextEpisodeTitle}` : ""}
          </h3>
          <p className="auto-next-countdown-text">
            Playing next episode in <b>{remaining}s</b>…
          </p>
        </div>

        <div className="auto-next-actions">
          <button
            type="button"
            className="primary-btn auto-next-play-btn"
            onClick={onPlayNext}
          >
            <Play size={14} fill="currentColor" />
            <span>Play Next Episode Now</span>
          </button>

          <button
            type="button"
            className="ghost-btn auto-next-cancel-btn"
            onClick={onCancel}
          >
            <span>Cancel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
