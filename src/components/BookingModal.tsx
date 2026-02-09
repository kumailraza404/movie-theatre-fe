import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import SeatMap from './SeatMap';
import Login from '../pages/Login';
import './BookingModal.css';

interface BookingModalProps {
  showtimeId: string;
  movieTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

function BookingModal({ showtimeId, movieTitle, isOpen, onClose }: BookingModalProps) {
  const { isAuthenticated } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowLogin(!isAuthenticated);
    }
  }, [isOpen, isAuthenticated]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <div className="modal-header">
          <h2>{movieTitle}</h2>
        </div>
        <div className="modal-body">
          {showLogin ? (
            <div className="login-container">
              <Login onSuccess={() => setShowLogin(false)} />
            </div>
          ) : (
            <SeatMap showtimeId={showtimeId} onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

export default BookingModal;
