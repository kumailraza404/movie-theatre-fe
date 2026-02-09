import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMyReservations, useConfirmReservation, useCancelReservation, Reservation } from '../hooks/useReservations';
import LoadingAnimation from '../components/LoadingAnimation';
import './MyMovies.css';

function MyMovies() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { data: reservations = [], isLoading, error } = useMyReservations();
  const confirmMutation = useConfirmReservation();
  const cancelMutation = useCancelReservation();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
  }, [isAuthenticated, navigate]);

  const handleConfirm = async (reservationId: string) => {
    try {
      setConfirmingId(reservationId);
      await confirmMutation.mutateAsync(reservationId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to confirm reservation');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCancel = async (reservationId: string) => {
    if (!confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }
    try {
      await cancelMutation.mutateAsync(reservationId);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel reservation');
    }
  };

  if (isLoading) {
    return (
      <div className="my-movies">
        <div className="container">
          <LoadingAnimation message="Loading your movies..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-movies">
        <div className="container">
          <div className="error">Failed to load your reservations</div>
        </div>
      </div>
    );
  }

  // Filter out expired hold reservations
  const heldReservations = reservations.filter((r) => {
    if (r.status !== 'hold') return false;
    // Check if expired
    if (r.expiresAt) {
      const now = new Date().getTime();
      const expires = new Date(r.expiresAt).getTime();
      return expires > now; // Only include if not expired
    }
    // If no expiresAt, check remainingTime
    if (r.remainingTime !== undefined) {
      return r.remainingTime > 0;
    }
    // If neither exists, include it (shouldn't happen, but be safe)
    return true;
  });
  const confirmedReservations = reservations.filter((r) => r.status === 'confirmed');

  return (
    <div className="my-movies">
      <div className="container">
        <h1 className="page-title">My Movies</h1>

        {heldReservations.length > 0 && (
          <section className="reservations-section">
            <h2 className="section-title">Pending Confirmation</h2>
            <div className="reservations-grid">
              {heldReservations.map((reservation) => (
                <ReservationCard
                  key={reservation._id}
                  reservation={reservation}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  confirmingId={confirmingId}
                />
              ))}
            </div>
          </section>
        )}

        {confirmedReservations.length > 0 && (
          <section className="reservations-section">
            <h2 className="section-title">Confirmed Reservations</h2>
            <div className="reservations-grid">
              {confirmedReservations.map((reservation) => (
                <ReservationCard
                  key={reservation._id}
                  reservation={reservation}
                  onConfirm={handleConfirm}
                  onCancel={handleCancel}
                  confirmingId={confirmingId}
                />
              ))}
            </div>
          </section>
        )}

        {heldReservations.length === 0 && confirmedReservations.length === 0 && (
          <div className="no-reservations">
            <p>You don't have any reservations yet.</p>
            <button onClick={() => navigate('/')} className="browse-btn">
              Browse Movies
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface ReservationCardProps {
  reservation: Reservation;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  confirmingId: string | null;
}

function ReservationCard({ reservation, onConfirm, onCancel, confirmingId }: ReservationCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (reservation.status === 'hold' && reservation.expiresAt) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const expires = new Date(reservation.expiresAt!).getTime();
        const remaining = Math.max(0, Math.floor((expires - now) / 1000));
        setTimeRemaining(remaining);
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);

      return () => clearInterval(interval);
    }
  }, [reservation.status, reservation.expiresAt]);

  const formatShowtime = (datetime: string) => {
    const date = new Date(datetime);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  const formatSeats = (seats: Array<{ row: number; column: number }>) => {
    return seats.map((s) => `R${s.row}C${s.column}`).join(', ');
  };

  const formatTimeRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!reservation.movie || !reservation.showtime) {
    return null;
  }

  const { date, time } = formatShowtime(reservation.showtime.datetime);
  const isExpired = reservation.status === 'hold' && timeRemaining !== null && timeRemaining === 0;

  return (
    <div className={`reservation-card ${reservation.status} ${isExpired ? 'expired' : ''}`}>
      <div className="reservation-poster">
        {reservation.movie.posterPath ? (
          <img
            src={`https://image.tmdb.org/t/p/w300${reservation.movie.posterPath}`}
            alt={reservation.movie.title}
          />
        ) : (
          <div className="no-poster">No Image</div>
        )}
      </div>
      <div className="reservation-info">
        <h3 className="reservation-movie-title">{reservation.movie.title}</h3>
        <div className="reservation-details">
          <div className="detail-item">
            <span className="detail-label">Showtime:</span>
            <span className="detail-value">{date} at {time}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Seats:</span>
            <span className="detail-value">{formatSeats(reservation.seats)}</span>
          </div>
          {reservation.status === 'hold' && timeRemaining !== null && (
            <div className="detail-item">
              <span className="detail-label">Time Remaining:</span>
              <span className={`detail-value countdown ${isExpired ? 'expired' : ''}`}>
                {isExpired ? 'Expired' : formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          )}
        </div>
        <div className="reservation-actions">
          {reservation.status === 'hold' && !isExpired && (
            <button
              className="confirm-btn"
              onClick={() => onConfirm(reservation._id)}
              disabled={confirmingId === reservation._id}
            >
              {confirmingId === reservation._id ? 'Confirming...' : 'Confirm Reservation'}
            </button>
          )}
          <button
            className="cancel-btn"
            onClick={() => onCancel(reservation._id)}
            disabled={confirmingId === reservation._id}
          >
            {reservation.status === 'hold' ? 'Cancel Hold' : 'Cancel Reservation'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default MyMovies;
