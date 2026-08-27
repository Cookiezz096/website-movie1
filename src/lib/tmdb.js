const KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE = "https://api.themoviedb.org/3";
const IMG = "https://image.tmdb.org/t/p/";

async function request(path, params = {}) {
  if (!KEY) throw new Error("TMDB API key is not configured.");
  const url = new URL(BASE + path);
  url.searchParams.set("api_key", KEY);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB request failed: ${res.status}`);
  return res.json();
}

export const tmdbImage = (path, size = "w500") =>
  path ? `${IMG}${size}${path}` : "";

export const getTrending = () => request("/trending/all/week");
export const getPopularMovies = () => request("/movie/popular");
export const getPopularTV = () => request("/tv/popular");
export const searchMulti = (query) =>
  request("/search/multi", { query, include_adult: "false" });
export const getMovie = (id) => request(`/movie/${id}`, { append_to_response: "credits,videos" });
export const getTV = (id) => request(`/tv/${id}`, { append_to_response: "credits,videos" });
export const getSeason = (id, season) => request(`/tv/${id}/season/${season}`);