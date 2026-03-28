import { useState, useEffect, useCallback } from 'react'
import './App.css'

const API_KEY = '2da3559cbb2d814dd153524906862353'
const BASE_URL = 'https://api.themoviedb.org/3'
const IMG_BASE = 'https://image.tmdb.org/t/p/w500'
const MOVIES_PER_PAGE = 20

function MovieCard({ movie }) {
  const poster = movie.poster_path
    ? `${IMG_BASE}${movie.poster_path}`
    : 'https://via.placeholder.com/300x450?text=No+Image'

  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'

  const ratingColor =
    parseFloat(rating) >= 7.5
      ? '#2ecc71'
      : parseFloat(rating) >= 5.5
      ? '#f5a623'
      : '#e74c3c'

  return (
    <div className="movie-card">
      <div className="movie-poster-wrap">
        <img
          className="movie-poster"
          src={poster}
          alt={movie.title}
          loading="lazy"
        />
        <div className="movie-rating-badge" style={{ background: ratingColor }}>
          ★ {rating}
        </div>
      </div>
      <div className="movie-info">
        <h3 className="movie-title">{movie.title}</h3>
        <p className="movie-meta">
          <span className="meta-label">Released</span>
          <span>{movie.release_date || 'Unknown'}</span>
        </p>
        <p className="movie-meta">
          <span className="meta-label">Rating</span>
          <span>{rating}</span>
        </p>
      </div>
    </div>
  )
}

export default function App() {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('')

  const fetchMovies = useCallback(async (page) => {
    setLoading(true)
    setError(null)
    try {
      let url
      if (searchQuery.trim()) {
        url = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(searchQuery)}&page=${page}`
      } else {
        url = `${BASE_URL}/movie/now_playing?api_key=${API_KEY}&page=${page}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error(`TMDB API error: ${res.status}`)
      const data = await res.json()
      setMovies(data.results || [])
      setTotalPages(Math.min(data.total_pages || 1, 500))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [searchQuery])

  useEffect(() => {
    fetchMovies(currentPage)
  }, [currentPage, fetchMovies])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const displayedMovies = [...movies].sort((a, b) => {
    if (sortBy === 'date_desc') return b.release_date?.localeCompare(a.release_date || '') || 0
    if (sortBy === 'date_asc') return a.release_date?.localeCompare(b.release_date || '') || 0
    if (sortBy === 'rating_desc') return b.vote_average - a.vote_average
    if (sortBy === 'rating_asc') return a.vote_average - b.vote_average
    return 0
  })

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1))
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages))

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setCurrentPage(1)
      fetchMovies(1)
    }
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <h1 className="site-title">Movie Explorer</h1>
          <div className="controls">
            <div className="search-wrap">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="Search for a movie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
            </div>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="">Sort By</option>
              <option value="date_desc">Release Date ↓</option>
              <option value="date_asc">Release Date ↑</option>
              <option value="rating_desc">Rating ↓</option>
              <option value="rating_asc">Rating ↑</option>
            </select>
          </div>
        </div>
      </header>

      <main className="main">
        {error && (
          <div className="error-banner">
            <span>⚠️</span> {error}
          </div>
        )}

        {loading ? (
          <div className="loading-grid">
            {Array.from({ length: MOVIES_PER_PAGE }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-poster" />
                <div className="skeleton-line" style={{ width: '70%' }} />
                <div className="skeleton-line" style={{ width: '50%' }} />
              </div>
            ))}
          </div>
        ) : displayedMovies.length === 0 ? (
          <div className="empty-state">
            <p>No movies found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
          </div>
        ) : (
          <div className="movie-grid">
            {displayedMovies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </main>

      {!loading && displayedMovies.length > 0 && (
        <footer className="pagination">
          <button className="page-btn" onClick={handlePrev} disabled={currentPage === 1}>
            ← Previous
          </button>
          <span className="page-info">
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>
          <button className="page-btn" onClick={handleNext} disabled={currentPage === totalPages}>
            Next →
          </button>
        </footer>
      )}
    </div>
  )
}
