import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingAnimation from '../components/LoadingAnimation';
import { useNowPlayingMovies } from '../hooks/useMovies';
import './Homepage.css';

function Homepage() {
  const navigate = useNavigate();
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNowPlayingMovies();

  // Observer ref for intersection observer
  const observerTarget = useRef<HTMLDivElement>(null);

  // Flatten all pages into a single array
  const movies = data?.pages.flatMap((page) => page.results || []) || [];

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleMovieClick = (movieId: number) => {
    navigate(`/movie/${movieId}`);
  };

  if (isLoading) {
    return (
      <div className="homepage">
        <div className="container">
          <LoadingAnimation message="Loading movies..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="homepage">
        <div className="container">
          <div className="error">Failed to load movies</div>
        </div>
      </div>
    );
  }

  return (
    <div className="homepage">
      <div className="container">
        <h1 className="page-title">Now Playing</h1>
        <div className="movies-grid">
          {movies.map((movie: any) => (
            <div
              key={movie.id || movie.tmdbId}
              className="movie-card"
              onClick={() => handleMovieClick(movie.id || movie.tmdbId)}
            >
              <div className="movie-poster">
                {(movie.posterPath || movie.poster_path) ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.posterPath || movie.poster_path}`}
                    alt={movie.title}
                  />
                ) : (
                  <div className="no-poster">No Image</div>
                )}
              </div>
              <div className="movie-info">
                <h3 className="movie-title">{movie.title}</h3>
                <div className="movie-meta">
                  <span className="movie-rating">
                    ⭐ {(movie.voteAverage || movie.vote_average)?.toFixed(1) || 'N/A'}
                  </span>
                  <span className="movie-date">
                    {(movie.releaseDate || movie.release_date)
                      ? new Date(movie.releaseDate || movie.release_date).getFullYear()
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Intersection observer target and loading indicator */}
        <div ref={observerTarget} className="scroll-observer">
          {isFetchingNextPage && (
            <div className="load-more-loader">
              <LoadingAnimation message="Loading more movies..." />
            </div>
          )}
          {!hasNextPage && movies.length > 0 && (
            <div className="end-message">
              <p>You've reached the end!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Homepage;
