import React, { useState } from "react";
import { Captions, Check, Globe, FileText, ExternalLink } from "lucide-react";

/**
 * SubtitleSelector Component
 * Attached to individual movie/episode/source. Allows users to switch and inspect WebVTT subtitle tracks.
 */
export default function SubtitleSelector({
  subtitles = [],
  activeSubtitleId = null,
  onSelectSubtitle,
}) {
  const [copiedId, setCopiedId] = useState(null);

  if (!subtitles || subtitles.length === 0) {
    return null;
  }

  function handleCopy(sub) {
    if (sub.url) {
      navigator.clipboard?.writeText(sub.url);
      setCopiedId(sub.id || sub.languageCode || sub.language);
      setTimeout(() => setCopiedId(null), 2000);
    }
  }

  return (
    <div className="subtitle-panel">
      <div className="subtitle-panel-header">
        <div className="subtitle-title">
          <Captions size={16} className="subtitle-icon" />
          <span>Available Subtitles ({subtitles.length})</span>
        </div>
        <span className="subtitle-format-tag">WebVTT Track Support</span>
      </div>

      <div className="subtitle-pills-row">
        {subtitles.map((sub, index) => {
          const id = sub.id || sub.languageCode || `${sub.language}-${index}`;
          const isSelected = activeSubtitleId === id || (!activeSubtitleId && index === 0);

          return (
            <div
              key={id}
              className={`subtitle-pill ${isSelected ? "active" : ""}`}
              onClick={() => onSelectSubtitle && onSelectSubtitle(id, sub)}
            >
              <div className="subtitle-lang-info">
                <Globe size={13} className="subtitle-globe" />
                <span className="subtitle-lang-name">{sub.language}</span>
                {sub.languageCode && (
                  <span className="subtitle-code">{sub.languageCode.toUpperCase()}</span>
                )}
              </div>

              {isSelected && <Check size={13} className="subtitle-check" />}

              {sub.url && (
                <button
                  type="button"
                  className="subtitle-vtt-btn"
                  title="Copy/View WebVTT URL"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopy(sub);
                  }}
                >
                  {copiedId === id ? (
                    <span className="vtt-copied">Copied!</span>
                  ) : (
                    <FileText size={12} />
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
