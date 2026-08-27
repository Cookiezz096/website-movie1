// High-Quality Multi-Server Embed Sources for Movies and TV Series
// Provides adaptive bitrate streams, 4K / 1080p Full HD resolutions, multi-language subtitles, and automatic fallbacks.

export const SERVERS = [
  {
    id: "vidlink",
    name: "Server 1 · VidLink",
    quality: "4K / 1080p UHD",
    badge: "4K UHD",
    badgeClass: "badge-4k",
    tag: "Ultra HD · Fast Load",
    recommended: true,
    movie: (id) =>
      `https://vidlink.pro/movie/${id}?primaryColor=a991ff&secondaryColor=151720&iconColor=a991ff&autoplay=false`,
    tv: (id, s, e) =>
      `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=a991ff&secondaryColor=151720&iconColor=a991ff&autoplay=false`,
  },
  {
    id: "vidsrc-pro",
    name: "Server 2 · VidSrc PRO",
    quality: "1080p Full HD",
    badge: "1080p FHD",
    badgeClass: "badge-fhd",
    tag: "Full HD · Multi-Subs",
    recommended: true,
    movie: (id, imdb) =>
      `https://vidsrc.cc/v2/embed/movie/${imdb || id}?autoPlay=false`,
    tv: (id, s, e, imdb) =>
      `https://vidsrc.cc/v2/embed/tv/${imdb || id}/${s}/${e}?autoPlay=false`,
  },
  {
    id: "embedsu",
    name: "Server 3 · EmbedSu",
    quality: "1080p HD",
    badge: "1080p HD",
    badgeClass: "badge-hd",
    tag: "Fast HLS · Subtitles",
    recommended: true,
    movie: (id) => `https://embed.su/embed/movie/${id}`,
    tv: (id, s, e) => `https://embed.su/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "vidsrcto",
    name: "Server 4 · VidSrc TO",
    quality: "1080p HD",
    badge: "1080p HD",
    badgeClass: "badge-hd",
    tag: "High Stability",
    movie: (id) => `https://vidsrc.to/embed/movie/${id}`,
    tv: (id, s, e) => `https://vidsrc.to/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "superembed",
    name: "Server 5 · SuperEmbed",
    quality: "1080p / 720p HD",
    badge: "Multi-HD",
    badgeClass: "badge-multi",
    tag: "Multiple Built-in Mirrors",
    movie: (id) => `https://multiembed.mov/?video_id=${id}&tmdb=1`,
    tv: (id, s, e) =>
      `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}`,
  },
  {
    id: "autoembed",
    name: "Server 6 · AutoEmbed",
    quality: "1080p HD",
    badge: "HD Stream",
    badgeClass: "badge-hd",
    tag: "Global Edge CDN",
    movie: (id) => `https://player.autoembed.cc/embed/movie/${id}`,
    tv: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}`,
  },
  {
    id: "smashystream",
    name: "Server 7 · SmashyStream",
    quality: "HD Stream",
    badge: "HD Stream",
    badgeClass: "badge-hd",
    tag: "Alternative Fast Mirror",
    movie: (id) => `https://player.smashy.stream/movie/${id}`,
    tv: (id, s, e) =>
      `https://player.smashy.stream/tv/${id}?s=${s}&e=${e}`,
  },
  {
    id: "moviesapi",
    name: "Server 8 · MoviesAPI",
    quality: "HD Stream",
    badge: "HD Stream",
    badgeClass: "badge-hd",
    tag: "Alternative Server",
    movie: (id) => `https://moviesapi.club/movie/${id}`,
    tv: (id, s, e) => `https://moviesapi.club/tv/${id}-${s}-${e}`,
  },
  {
    id: "2embed",
    name: "Server 9 · 2Embed",
    quality: "HD Stream",
    badge: "HD Stream",
    badgeClass: "badge-hd",
    tag: "Backup Mirror",
    movie: (id) => `https://www.2embed.skin/embed/${id}`,
    tv: (id, s, e) => `https://www.2embed.skin/embedtv/${id}&s=${s}&e=${e}`,
  },
  {
    id: "videasy",
    name: "Server 10 · Videasy",
    quality: "1080p HD",
    badge: "1080p HD",
    badgeClass: "badge-hd",
    tag: "Clean HD Player",
    movie: (id) => `https://player.videasy.net/movie/${id}`,
    tv: (id, s, e) => `https://player.videasy.net/tv/${id}/${s}/${e}`,
  },
];

/**
 * Returns the embed URL for a given media item and selected server.
 */
export function getEmbedUrl({
  type,
  id,
  imdbId = null,
  season = 1,
  episode = 1,
  serverIndex = 0,
}) {
  const srv = SERVERS[serverIndex] || SERVERS[0];
  return type === "tv"
    ? srv.tv(id, season, episode, imdbId)
    : srv.movie(id, imdbId);
}