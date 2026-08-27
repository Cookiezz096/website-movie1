import React, { useEffect, useState, useRef } from "react";
import {
  Link,
  Route,
  Routes,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  Play,
  Search,
  User,
  LogIn,
  ChevronRight,
  ChevronLeft,
  Menu,
  X,
  Film,
  AlertCircle,
  LoaderCircle,
  Plus,
  Tv,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  Check,
  Info,
  ShieldCheck,
  Video,
  Clapperboard,
  Star,
  Clock,
  Calendar,
  Layers,
} from "lucide-react";
import {
  getMovie,
  getPopularMovies,
  getPopularTV,
  getSeason,
  getTrending,
  getTV,
  searchMulti,
  tmdbImage,
  getOfficialTrailerUrl,
} from "./lib/tmdb";
import { authConfigured, signInWithProvider, supabase } from "./lib/supabase";
import { SERVERS, getEmbedUrl } from "./data/sources";

const fallback = "https://placehold.co/600x900/101217/ffffff?text=No+Poster";

/* ─── Auth hook ─────────────────────────────────────────────────────────── */
function useAuth() {
  const [session, setSession] = useState(null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) =>
      setSession(s)
    );
    return () => listener.subscription.unsubscribe();
  }, []);
  return session;
}

/* ─── Navigation Live Search ─────────────────────────────────────────── */
function NavSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced TMDB multi-search
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    const timer = setTimeout(() => {
      searchMulti(trimmed)
        .then((res) => {
          const items = (res.results || [])
            .filter(
              (item) =>
                item.media_type === "movie" ||
                item.media_type === "tv" ||
                (!item.media_type && (item.title || item.name))
            )
            .slice(0, 7);
          setResults(items);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSubmit(e) {
    if (e) e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  function handleSelect(item) {
    const type = item.media_type || (item.first_air_date ? "tv" : "movie");
    setIsOpen(false);
    setQuery("");
    navigate(`/watch/${type}/${item.id}`);
  }

  return (
    <div className="nav-search-container" ref={wrapperRef}>
      <form className="search" onSubmit={handleSubmit}>
        <Search size={18} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && results.length > 0) setIsOpen(true);
          }}
          placeholder="Search movies, shows..."
        />
        {loading ? (
          <LoaderCircle size={16} className="spin search-loading-icon" />
        ) : query ? (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
          >
            <X size={15} />
          </button>
        ) : null}
      </form>

      {isOpen && (
        <div className="search-dropdown">
          {loading && results.length === 0 ? (
            <div className="search-status">
              <LoaderCircle size={16} className="spin" /> Searching...
            </div>
          ) : results.length > 0 ? (
            <>
              <div className="search-results-list">
                {results.map((item) => {
                  const type =
                    item.media_type || (item.first_air_date ? "tv" : "movie");
                  const title = item.title || item.name;
                  const year = (
                    item.release_date || item.first_air_date || ""
                  ).slice(0, 4);
                  return (
                    <div
                      key={`${type}-${item.id}`}
                      className="search-result-item"
                      onClick={() => handleSelect(item)}
                    >
                      <img
                        src={tmdbImage(item.poster_path, "w92") || fallback}
                        alt={title}
                        className="search-result-thumb"
                      />
                      <div className="search-result-info">
                        <div className="search-result-title">{title}</div>
                        <div className="search-result-meta">
                          <span className={`search-badge ${type}`}>
                            {type === "tv" ? "TV Series" : "Movie"}
                          </span>
                          {year && <span>{year}</span>}
                          {item.vote_average > 0 && (
                            <span className="search-rating">
                              ★ {item.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="search-view-all" onClick={handleSubmit}>
                View all results for &ldquo;{query}&rdquo; &rarr;
              </div>
            </>
          ) : (
            <div className="search-status">
              No movies or shows found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Layout ─────────────────────────────────────────────────────────────── */
function Layout({ children }) {
  const session = useAuth();
  const [menu, setMenu] = useState(false);

  async function logout() {
    if (supabase) await supabase.auth.signOut();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark">M</span> Movie<span>Verse</span>
        </Link>
        <nav className={menu ? "nav open" : "nav"}>
          <Link to="/" onClick={() => setMenu(false)}>Home</Link>
          <Link to="/movies" onClick={() => setMenu(false)}>Movies</Link>
          <Link to="/tv" onClick={() => setMenu(false)}>TV Shows</Link>
          {session && (
            <Link to="/profile" onClick={() => setMenu(false)}>My List</Link>
          )}
        </nav>
        <NavSearch />
        <div className="account-actions">
          {session ? (
            <button className="avatar-btn" title="Sign out" onClick={logout}>
              <User size={18} />
            </button>
          ) : (
            <Link className="login-btn" to="/login">
              <LogIn size={17} /> Sign in
            </Link>
          )}
          <button className="menu-btn" onClick={() => setMenu((v) => !v)}>
            {menu ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      <main>{children}</main>
      <footer>
        <div>
          <b>MovieVerse</b>
          <span> A modern high-definition movie &amp; TV discovery experience.</span>
        </div>
        <small>Metadata powered by TMDB. Streams provided by external CDN nodes.</small>
      </footer>
    </div>
  );
}

/* ─── Shared UI ──────────────────────────────────────────────────────────── */
function Loader() {
  return (
    <div className="loader">
      <LoaderCircle className="spin" size={34} />
      <span>Loading content...</span>
    </div>
  );
}

function Notice({ text }) {
  return (
    <div className="notice">
      <AlertCircle size={19} />
      {text}
    </div>
  );
}

/* ─── Media card ─────────────────────────────────────────────────────────── */
function MediaCard({ item }) {
  const type = item.media_type || (item.first_air_date ? "tv" : "movie");
  const title = item.title || item.name;
  return (
    <Link className="media-card" to={`/watch/${type}/${item.id}`}>
      <div className="poster-wrap">
        <img
          loading="lazy"
          src={tmdbImage(item.poster_path, "w500") || fallback}
          alt={title}
        />
        <div className="poster-overlay">
          <Play fill="white" size={24} />
        </div>
        <span className="card-quality-badge">HD</span>
      </div>
      <div className="card-title">{title}</div>
      <div className="card-meta">
        {(item.release_date || item.first_air_date || "").slice(0, 4)}{" "}
        {item.vote_average ? `• ★ ${item.vote_average.toFixed(1)}` : ""}
      </div>
    </Link>
  );
}

/* ─── Section row ───────────────────────────────────────────────────────── */
function Section({ title, items, type = "movie" }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>{title}</h2>
        <Link to={type === "tv" ? "/tv" : "/movies"}>
          See all <ChevronRight size={17} />
        </Link>
      </div>
      <div className="card-row">
        {items
          ?.slice(0, 10)
          .map((item) => (
            <MediaCard
              key={`${item.media_type || type}-${item.id}`}
              item={item}
            />
          ))}
      </div>
    </section>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
function Hero({ item }) {
  const type = item.media_type || (item.first_air_date ? "tv" : "movie");
  return (
    <section
      className="hero"
      style={{
        backgroundImage: `linear-gradient(90deg,#08090d 0%,rgba(8,9,13,.82) 42%,rgba(8,9,13,.15) 100%),linear-gradient(0deg,#08090d 0%,transparent 40%),url(${tmdbImage(item.backdrop_path, "original")})`,
      }}
    >
      <div className="hero-content">
        <div className="eyebrow flex-gap">
          <Sparkles size={13} /> Featured in 4K Ultra HD
        </div>
        <h1>{item.title || item.name}</h1>
        <p>{item.overview || "Discover something great to watch in 4K and Full HD."}</p>
        <div className="hero-actions">
          <Link className="primary-btn" to={`/watch/${type}/${item.id}`}>
            <Play fill="currentColor" size={18} /> Stream Now
          </Link>
          <Link className="ghost-btn" to={`/watch/${type}/${item.id}`}>
            Details &amp; Quality
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Home ───────────────────────────────────────────────────────────────── */
function Home() {
  const [data, setData] = useState({ trending: [], movies: [], tv: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getTrending(), getPopularMovies(), getPopularTV()])
      .then(([t, m, tv]) =>
        setData({
          trending: t.results || [],
          movies: m.results || [],
          tv: tv.results || [],
        })
      )
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  const hero = data.trending.find((x) => x.backdrop_path) || data.movies[0];
  if (loading) return <Loader />;
  return (
    <>
      {hero && <Hero item={hero} />}
      <div className="container">
        {error && <Notice text={error} />}
        <Section title="Trending This Week" items={data.trending} />
        <Section title="Popular Movies (4K / 1080p)" items={data.movies} />
        <Section title="Popular TV Shows" items={data.tv} type="tv" />
      </div>
    </>
  );
}

/* ─── Listing page ───────────────────────────────────────────────────────── */
function Listing({ type }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    (type === "tv" ? getPopularTV() : getPopularMovies())
      .then((d) => setItems(d.results || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [type]);
  if (loading) return <Loader />;
  return (
    <div className="container page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">{type === "tv" ? "Series" : "Cinema"}</div>
          <h1>{type === "tv" ? "TV Shows" : "Movies"}</h1>
        </div>
      </div>
      {error && <Notice text={error} />}
      <div className="grid">
        {items.map((i) => (
          <MediaCard key={i.id} item={i} />
        ))}
      </div>
    </div>
  );
}

/* ─── Search ─────────────────────────────────────────────────────────────── */
function SearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (q) {
      setLoading(true);
      searchMulti(q)
        .then((d) =>
          setItems((d.results || []).filter((x) => x.media_type !== "person"))
        )
        .catch(() => setItems([]))
        .finally(() => setLoading(false));
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [q]);
  if (!q)
    return (
      <div className="container page">
        <h1>Search</h1>
        <p>Type something in the search bar above.</p>
      </div>
    );
  return (
    <div className="container page">
      <div className="eyebrow">Search results</div>
      <h1>Results for &ldquo;{q}&rdquo;</h1>
      {loading ? (
        <Loader />
      ) : (
        <div className="grid">
          {items.map((i) => (
            <MediaCard
              key={`${i.media_type || "movie"}-${i.id}`}
              item={i}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Embed player ───────────────────────────────────────────────────────── */
function EmbedPlayer({ url, reloadKey, isTrailer = false }) {
  const [isIframeLoading, setIsIframeLoading] = useState(true);

  useEffect(() => {
    setIsIframeLoading(true);
  }, [url, reloadKey]);

  return (
    <div className="player-wrapper">
      {isIframeLoading && (
        <div className="player-loading-spinner">
          <LoaderCircle size={38} className="spin" />
          <span>Connecting to High-Speed Video Stream...</span>
        </div>
      )}
      <iframe
        key={`${url}-${reloadKey}`}
        className={`video ${isIframeLoading ? "loading" : "ready"}`}
        src={url}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        referrerPolicy="origin-when-cross-origin"
        onLoad={() => setIsIframeLoading(false)}
        title={isTrailer ? "Official HD Trailer" : "MovieVerse Video Player"}
      />
    </div>
  );
}

/* ─── Watch page ─────────────────────────────────────────────────────────── */
function WatchPage() {
  const { type, id } = useParams();
  const [media, setMedia] = useState(null);
  const [error, setError] = useState("");

  // TV state
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [seasonData, setSeasonData] = useState(null);

  // Server & Player controls
  const [serverIdx, setServerIdx] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [theaterMode, setTheaterMode] = useState(false);
  const [isTrailerActive, setIsTrailerActive] = useState(false);

  // Fetch media metadata
  useEffect(() => {
    setMedia(null);
    setError("");
    setIsTrailerActive(false);
    (type === "tv" ? getTV(id) : getMovie(id))
      .then(setMedia)
      .catch((e) => setError(e.message));
  }, [type, id]);

  // Reset season/ep when switching titles
  useEffect(() => {
    setSeason(1);
    setEpisode(1);
  }, [type, id]);

  // Fetch season episode list for TV
  useEffect(() => {
    if (type === "tv" && media?.number_of_seasons) {
      getSeason(id, season)
        .then(setSeasonData)
        .catch(() => setSeasonData(null));
    }
  }, [type, id, season, media?.number_of_seasons]);

  if (error)
    return (
      <div className="container page">
        <Notice text={error} />
      </div>
    );
  if (!media) return <Loader />;

  const imdbId = media.external_ids?.imdb_id || media.imdb_id;
  const currentServer = SERVERS[serverIdx] || SERVERS[0];
  const trailerUrl = getOfficialTrailerUrl(media.videos);

  const embedUrl = isTrailerActive && trailerUrl
    ? trailerUrl
    : getEmbedUrl({
        type,
        id,
        imdbId,
        season,
        episode,
        serverIndex: serverIdx,
      });

  const title = media.title || media.name;
  const releaseYear = (media.release_date || media.first_air_date || "").slice(0, 4);
  const runtime = media.runtime
    ? `${Math.floor(media.runtime / 60)}h ${media.runtime % 60}m`
    : media.episode_run_time?.length
    ? `${media.episode_run_time[0]}m/ep`
    : null;
  const genres = media.genres?.map((g) => g.name).join(", ");
  const rating = media.vote_average ? media.vote_average.toFixed(1) : null;
  const cast = media.credits?.cast?.slice(0, 6) || [];
  const recommendations = media.recommendations?.results?.slice(0, 6) || [];

  // TV episode handlers
  const totalEpisodesInSeason = seasonData?.episodes?.length || 0;
  const hasPrevEp = type === "tv" && (episode > 1 || season > 1);
  const hasNextEp =
    type === "tv" &&
    (episode < totalEpisodesInSeason || season < (media.number_of_seasons || 1));

  function handlePrevEpisode() {
    if (episode > 1) {
      setEpisode(episode - 1);
    } else if (season > 1) {
      setSeason(season - 1);
      setEpisode(1);
    }
  }

  function handleNextEpisode() {
    if (episode < totalEpisodesInSeason) {
      setEpisode(episode + 1);
    } else if (season < (media.number_of_seasons || 1)) {
      setSeason(season + 1);
      setEpisode(1);
    }
  }

  function handleNextServer() {
    setServerIdx((prev) => (prev + 1) % SERVERS.length);
    setIsTrailerActive(false);
  }

  function handleReloadStream() {
    setReloadKey((prev) => prev + 1);
  }

  return (
    <div className={`watch-page-wrapper ${theaterMode ? "theater-active" : ""}`}>
      <div className={`container page watch-page ${theaterMode ? "theater-container" : ""}`}>
        {/* ── Player Toolbar ── */}
        <div className="player-top-bar">
          <div className="player-meta-left">
            <span className={`quality-badge-pill ${currentServer.badgeClass}`}>
              {isTrailerActive ? "Official Trailer" : currentServer.badge}
            </span>
            <span className="player-server-name">
              {isTrailerActive ? "YouTube 4K/HD Trailer" : currentServer.name}
            </span>
            {!isTrailerActive && currentServer.recommended && (
              <span className="recommended-tag">
                <Sparkles size={12} /> Best Quality
              </span>
            )}
          </div>

          <div className="player-actions-right">
            {/* Trailer toggle */}
            {trailerUrl && (
              <button
                className={`player-tool-btn ${isTrailerActive ? "active" : ""}`}
                onClick={() => setIsTrailerActive((v) => !v)}
                title="Watch Official HD Trailer"
              >
                <Clapperboard size={15} />
                <span>{isTrailerActive ? "Back to Stream" : "Official Trailer"}</span>
              </button>
            )}

            {/* Quick Next Server */}
            {!isTrailerActive && (
              <button
                className="player-tool-btn"
                onClick={handleNextServer}
                title="Switch to next streaming server"
              >
                <Layers size={15} />
                <span>Next Server ({serverIdx + 1}/{SERVERS.length})</span>
              </button>
            )}

            {/* Reload Stream */}
            <button
              className="player-tool-btn"
              onClick={handleReloadStream}
              title="Reload video stream"
            >
              <RotateCcw size={15} />
              <span>Reload</span>
            </button>

            {/* Theater Mode */}
            <button
              className={`player-tool-btn ${theaterMode ? "active" : ""}`}
              onClick={() => setTheaterMode((v) => !v)}
              title={theaterMode ? "Exit Theater Mode" : "Theater Mode"}
            >
              {theaterMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>Theater</span>
            </button>
          </div>
        </div>

        {/* ── Player Frame ── */}
        <div className="player-shell">
          <EmbedPlayer
            url={embedUrl}
            reloadKey={reloadKey}
            isTrailer={isTrailerActive}
          />
        </div>

        {/* ── Episode navigation toolbar for TV ── */}
        {type === "tv" && (
          <div className="episode-nav-bar">
            <button
              className="ep-nav-btn"
              onClick={handlePrevEpisode}
              disabled={!hasPrevEp}
            >
              <ChevronLeft size={16} /> Previous Episode
            </button>
            <div className="ep-nav-indicator">
              Season {season} · Episode {episode}
              {seasonData?.episodes?.find((e) => e.episode_number === episode)?.name
                ? ` — "${seasonData.episodes.find((e) => e.episode_number === episode).name}"`
                : ""}
            </div>
            <button
              className="ep-nav-btn"
              onClick={handleNextEpisode}
              disabled={!hasNextEp}
            >
              Next Episode <ChevronRight size={16} />
            </button>
          </div>
        )}

        <div className="watch-controls">
          {/* Quality highlight banner */}
          <div className="quality-advisory-card">
            <div className="advisory-icon">
              <ShieldCheck size={20} />
            </div>
            <div className="advisory-text">
              <b>High-Definition Stream Engine</b>
              <span>
                {currentServer.name} is streaming in <b>{currentServer.quality}</b> with adaptive bitrate.
                If you encounter slow buffering or low resolution, switch to <b>Server 1 (VidLink)</b> or <b>Server 2 (VidSrc PRO)</b> for instant 4K/1080p playback.
              </span>
            </div>
          </div>

          {/* Title & Overview */}
          <div className="watch-title-header">
            <div className="watch-title-main">
              <h1>{title}</h1>
              <div className="media-tags-row">
                <span className="media-tag-pill highlight">4K Ultra HD</span>
                <span className="media-tag-pill highlight">1080p FHD</span>
                <span className="media-tag-pill">Dolby 5.1</span>
                <span className="media-tag-pill">Multi-Subs</span>
                {releaseYear && (
                  <span className="media-meta-item">
                    <Calendar size={14} /> {releaseYear}
                  </span>
                )}
                {runtime && (
                  <span className="media-meta-item">
                    <Clock size={14} /> {runtime}
                  </span>
                )}
                {rating && (
                  <span className="media-rating-pill">
                    <Star size={14} fill="#fbbf24" color="#fbbf24" /> {rating}
                  </span>
                )}
              </div>
              {genres && <div className="genre-label">{genres}</div>}
              <p className="media-synopsis">{media.overview || "No overview available."}</p>
            </div>
          </div>

          {/* Server Switcher Grid */}
          <div className="server-panel">
            <div className="server-panel-header">
              <div>
                <b>Streaming Servers &amp; Video Quality</b>
                <span className="server-panel-subtitle">
                  Choose a high-speed server below for optimum video resolution &amp; audio.
                </span>
              </div>
              <span className="server-count-badge">
                {SERVERS.length} Servers Active
              </span>
            </div>

            <div className="server-grid">
              {SERVERS.map((s, i) => {
                const isActive = serverIdx === i && !isTrailerActive;
                return (
                  <button
                    key={s.id || s.name}
                    className={`server-card ${isActive ? "active" : ""}`}
                    onClick={() => {
                      setServerIdx(i);
                      setIsTrailerActive(false);
                    }}
                  >
                    <div className="server-card-top">
                      <span className="server-number-name">{s.name}</span>
                      <span className={`server-card-badge ${s.badgeClass}`}>
                        {s.badge}
                      </span>
                    </div>
                    <div className="server-card-desc">
                      <span>{s.tag}</span>
                      {isActive && (
                        <span className="active-dot">
                          <Check size={12} /> Streaming
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cast members */}
          {cast.length > 0 && (
            <div className="cast-section">
              <b>Featured Cast</b>
              <div className="cast-row">
                {cast.map((c) => (
                  <div key={c.id} className="cast-card">
                    <img
                      src={tmdbImage(c.profile_path, "w185") || fallback}
                      alt={c.name}
                      className="cast-avatar"
                    />
                    <div className="cast-info">
                      <div className="cast-name">{c.name}</div>
                      <div className="cast-char">{c.character}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TV Episodes Selection */}
          {type === "tv" && media.number_of_seasons > 0 && (
            <div className="episodes">
              <div className="episode-top">
                <div>
                  <b>Season Episodes</b>
                  <span className="episode-season-count">
                    {media.number_of_seasons} {media.number_of_seasons === 1 ? "Season" : "Seasons"} Available
                  </span>
                </div>
                <select
                  value={season}
                  onChange={(e) => {
                    setSeason(+e.target.value);
                    setEpisode(1);
                  }}
                  className="season-select"
                >
                  {Array.from({ length: media.number_of_seasons }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Season {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <div className="episode-grid">
                {seasonData?.episodes?.map((ep) => {
                  const isCurrent = episode === ep.episode_number;
                  return (
                    <button
                      key={ep.id}
                      className={`episode ${isCurrent ? "active-ep" : ""}`}
                      onClick={() => setEpisode(ep.episode_number)}
                    >
                      <div className="ep-num-box">
                        <span>{ep.episode_number}</span>
                      </div>
                      <div className="ep-details">
                        <div className="ep-header-row">
                          <b className="ep-title">{ep.name}</b>
                          {ep.vote_average > 0 && (
                            <span className="ep-rating">
                              ★ {ep.vote_average.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <small className="ep-desc">
                          {ep.overview || "No episode summary provided."}
                        </small>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="section recommendations-section">
              <div className="section-head">
                <h2>Recommended For You</h2>
              </div>
              <div className="card-row">
                {recommendations.map((item) => (
                  <MediaCard
                    key={`${item.media_type || type}-${item.id}`}
                    item={item}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Login ──────────────────────────────────────────────────────────────── */
function Login() {
  const [busy, setBusy] = useState("");
  async function oauth(provider) {
    setBusy(provider);
    try {
      await signInWithProvider(provider);
    } catch (e) {
      alert(e.message);
    } finally {
      setBusy("");
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand big">
          <span className="brand-mark">M</span> Movie<span>Verse</span>
        </div>
        <h1>Welcome back</h1>
        <p>Sign in to keep your list and watch history.</p>
        {!authConfigured && (
          <Notice text="Supabase is not configured yet. Add the VITE_SUPABASE_* variables to enable authentication." />
        )}
        <button
          className="oauth google"
          disabled={!authConfigured || busy}
          onClick={() => oauth("google")}
        >
          {busy === "google" ? <LoaderCircle className="spin" /> : <span>G</span>}{" "}
          Continue with Google
        </button>
        <button
          className="oauth discord"
          disabled={!authConfigured || busy}
          onClick={() => oauth("discord")}
        >
          Continue with Discord
        </button>
        <button
          className="oauth facebook"
          disabled={!authConfigured || busy}
          onClick={() => oauth("facebook")}
        >
          Continue with Facebook
        </button>
        <div className="divider">or</div>
        <p className="small">
          Email/password authentication can be enabled with Supabase Auth.
        </p>
      </div>
    </div>
  );
}

/* ─── Profile ────────────────────────────────────────────────────────────── */
function Profile() {
  const session = useAuth();
  return (
    <div className="container page">
      <div className="profile-card">
        <div className="profile-avatar">
          <User size={36} />
        </div>
        <div>
          <div className="eyebrow">Account</div>
          <h1>
            {session?.user?.user_metadata?.name ||
              session?.user?.email ||
              "Guest"}
          </h1>
          <p>{session?.user?.email || "Sign in to view your account."}</p>
        </div>
      </div>
      <div className="empty-state">
        <Plus size={28} />
        <h2>Your list is ready</h2>
        <p>
          Favorites and watch history can be stored per user once your Supabase
          database tables are configured.
        </p>
      </div>
    </div>
  );
}

/* ─── App ────────────────────────────────────────────────────────────────── */
export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movies" element={<Listing type="movie" />} />
        <Route path="/tv" element={<Listing type="tv" />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/watch/:type/:id" element={<WatchPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route
          path="*"
          element={
            <div className="container page">
              <h1>404</h1>
              <p>Page not found.</p>
              <Link className="primary-btn" to="/">
                Go home
              </Link>
            </div>
          }
        />
      </Routes>
    </Layout>
  );
}