// Embed stream servers — each returns a URL based on TMDB ID, type, season & episode.
// Multiple servers are offered so the user can switch if one is down.

export const SERVERS = [
  {
    name: "Server 1 · VidSrc",
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "Server 2 · VidSrc.xyz",
    movie: (id) => `https://vidsrc.xyz/embed/movie?tmdb=${id}`,
    tv: (id, s, e) => `https://vidsrc.xyz/embed/tv?tmdb=${id}&season=${s}&episode=${e}`,
  },
  {
    name: "Server 3 · AutoEmbed",
    movie: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tv: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
  {
    name: "Server 4 · SuperEmbed",
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    name: "Server 5 · 2Embed",
    movie: (id) => `https://www.2embed.cc/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.cc/embedtv/${id}&s=${s}&e=${e}`,
  },
];

export function getEmbedUrl({ type, id, season = 1, episode = 1, serverIndex = 0 }) {
  const srv = SERVERS[serverIndex] || SERVERS[0];
  return type === "tv" ? srv.tv(id, season, episode) : srv.movie(id);
}