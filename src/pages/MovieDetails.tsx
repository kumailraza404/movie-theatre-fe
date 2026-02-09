import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BookingModal from '../components/BookingModal';
import LoadingAnimation from '../components/LoadingAnimation';
import { useMovieDetails } from '../hooks/useMovies';
import { useShowtimesByMovie } from '../hooks/useShowtimes';
import './MovieDetails.css';

function MovieDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedShowtime, setSelectedShowtime] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const movieId = id ? parseInt(id, 10) : undefined;
  const { data: movie, isLoading: movieLoading, error: movieError } = useMovieDetails(movieId);
  
  // Get tmdbId from movie or use the id param
  const tmdbId = movie?.tmdbId?.toString() || id;
  const { data: showtimes = [] } = useShowtimesByMovie(tmdbId);

  const handleBookClick = (showtimeId: string) => {
    setSelectedShowtime(showtimeId);
    setIsModalOpen(true);
  };

  const formatShowtime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  if (movieLoading) {
    return (
      <div className="movie-details">
        <div className="container">
          <LoadingAnimation message="Loading movies..." />
        </div>
      </div>
    );
  }

  if (movieError || !movie) {
    return (
      <div className="movie-details">
        <div className="container">
          <div className="error">{movieError?.message || 'Movie not found'}</div>
          <button onClick={() => navigate('/')} className="back-btn">
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="movie-details">
      <div className="container">
        <button onClick={() => navigate('/')} className="back-btn">
          ← Back to Home
        </button>

        <div className="movie-header">
          <div className="movie-poster-large">
            {movie.posterPath ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.posterPath}`}
                alt={movie.title}
              />
            ) : (
              <div className="no-poster-large">No Image</div>
            )}
          </div>
          <div className="movie-content">
            <h1 className="movie-title">{movie.title}</h1>
            <div className="movie-meta-info">
              <span className="rating">
                ⭐ {movie.voteAverage?.toFixed(1) || 'N/A'}
                {movie.voteCount && ` (${movie.voteCount} reviews)`}
              </span>
              {movie.runtime && (
                <span className="runtime">{movie.runtime} min</span>
              )}
              <span className="release-date">
                {movie.releaseDate
                  ? new Date(movie.releaseDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </span>
            </div>
            {movie.genres && movie.genres.length > 0 && (
              <div className="movie-genres">
                {movie.genres.map((genre: string, index: number) => (
                  <span key={index} className="genre-tag">
                    {genre}
                  </span>
                ))}
              </div>
            )}
            <div className="movie-overview">
              <h2>Overview</h2>
              <p>{movie.overview || 'No overview available.'}</p>
            </div>
          </div>
        </div>

        <div className="showtimes-section">
          <h2>Showtimes</h2>
          {showtimes.length === 0 ? (
            <div className="no-showtimes">
              <p>No showtimes available. Please check back later.</p>
            </div>
          ) : (
            <div className="showtimes-list">
              {showtimes.map((showtime: any) => {
                const { date, time } = formatShowtime(showtime.datetime);
                return (
                  <div key={showtime._id} className="showtime-card">
                    <div className="showtime-info">
                      <div className="showtime-date">{date}</div>
                      <div className="showtime-time">{time}</div>
                    </div>
                    <button
                      className="book-btn"
                      onClick={() => handleBookClick(showtime._id)}
                    >
                      Book Now
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {selectedShowtime && (
          <BookingModal
            showtimeId={selectedShowtime}
            movieTitle={movie.title}
            isOpen={isModalOpen}
            onClose={() => {
              setIsModalOpen(false);
              setSelectedShowtime(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default MovieDetails;
