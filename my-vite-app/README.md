# Anikai

A modern anime and movie streaming web app built with React + Vite.

Features multi-server streaming, SUB/DUB/S-SUB support, title/episode-specific health checks, auto-failover, watch history, and release countdowns.

## Tech Stack
- React 19 + Vite 7
- React Router 7
- Supabase (optional auth)
- TMDB API
- Lucide React icons

## Getting Started

```bash
npm install
npm run dev
```

Add your API keys to `.env`:
```
VITE_TMDB_API_KEY=your_key
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
