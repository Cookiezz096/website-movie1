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
  Menu,
  X,
  Film,
  AlertCircle,
  LoaderCircle,
  Plus,
  Tv,
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
          <span> A modern movie &amp; TV discovery experience.</span>
        </div>
        <small>Metadata powered by TMDB.</small>
      </footer>
    </div>
  );
}

/* ─── Shared UI ──────────────────────────────────────────────────────────── */
function Loader() {
  return (
    <div className="loader">
      <LoaderCircle className="spin" size={34} />
      <span>Loading...</span>
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
      </div>
      <div className="card-title">{title}</div>
      <div className="card-meta">
        {(item.release_date || item.first_air_date || "").slice(0, 4)}{" "}
        {item.vote_average ? `• ${item.vote_average.toFixed(1)}` : ""}
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
        backgroundImage: `linear-gradient(90deg,#08090d 0%,rgba(8,9,13,.78) 42%,rgba(8,9,13,.12) 100%),linear-gradient(0deg,#08090d 0%,transparent 35%),url(${tmdbImage(item.backdrop_path, "original")})`,
      }}
    >
      <div className="hero-content">
        <div className="eyebrow">Featured today</div>
        <h1>{item.title || item.name}</h1>
        <p>{item.overview || "Discover something great to watch."}</p>
        <div className="hero-actions">
          <Link className="primary-btn" to={`/watch/${type}/${item.id}`}>
            <Play fill="currentColor" size={18} /> Watch now
          </Link>
          <Link className="ghost-btn" to={`/watch/${type}/${item.id}`}>
            Details
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
        <Section title="Popular Movies" items={data.movies} />
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
function EmbedPlayer({ url }) {
  return (
    <iframe
      key={url}
      className="video"
      src={url}
      allowFullScreen
      allow="autoplay; fullscreen; picture-in-picture"
      referrerPolicy="origin"
      title="Video player"
    />
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

  // Server selection
  const [serverIdx, setServerIdx] = useState(0);

  // Fetch media metadata
  useEffect(() => {
    setMedia(null);
    setError("");
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

  const embedUrl = getEmbedUrl({ type, id, season, episode, serverIndex: serverIdx });
  const title = media.title || media.name;

  return (
    <div className="container page watch-page">
      {/* ── Player ── */}
      <div className="player-shell">
        <EmbedPlayer url={embedUrl} />
      </div>

      <div className="watch-controls">
        {/* Title & overview */}
        <div className="watch-title">
          <h1>{title}</h1>
          {type === "tv" && (
            <div className="ep-label">
              Season {season} · Episode {episode}
            </div>
          )}
          <p>{media.overview}</p>
        </div>

        {/* Server switcher */}
        <div className="server-panel">
          <b>Servers</b>
          <div className="server-buttons">
            {SERVERS.map((s, i) => (
              <button
                key={s.name}
                className={serverIdx === i ? "server active" : "server"}
                onClick={() => setServerIdx(i)}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* TV episodes */}
        {type === "tv" && media.number_of_seasons > 0 && (
          <div className="episodes">
            <div className="episode-top">
              <b>Episodes</b>
              <select
                value={season}
                onChange={(e) => {
                  setSeason(+e.target.value);
                  setEpisode(1);
                }}
              >
                {Array.from({ length: media.number_of_seasons }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Season {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="episode-grid">
              {seasonData?.episodes?.map((ep) => (
                <button
                  key={ep.id}
                  className={
                    episode === ep.episode_number
                      ? "episode active-ep"
                      : "episode"
                  }
                  onClick={() => setEpisode(ep.episode_number)}
                >
                  <span>{ep.episode_number}</span>
                  <div>
                    <b>{ep.name}</b>
                    <small>{ep.overview || "No episode description."}</small>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
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