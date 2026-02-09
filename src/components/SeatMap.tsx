import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useConfirmReservation, useHoldSeats, useSeatAvailability } from '../hooks/useReservations';
import { Seat, SeatAvailability } from '../services/api';
import { wsService } from '../services/websocket';
import './SeatMap.css';

interface SeatMapProps {
  showtimeId: string;
  onClose: () => void;
}

function SeatMap({ showtimeId, onClose }: SeatMapProps) {
  const queryClient = useQueryClient();
  const { data: availability, isLoading, error: queryError } = useSeatAvailability(showtimeId);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [currentReservation, setCurrentReservation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const holdMutation = useHoldSeats();
  const confirmMutation = useConfirmReservation();

  useEffect(() => {
    connectWebSocket();

    return () => {
      wsService.leaveShowtime(showtimeId);
      wsService.offSeatUpdate();
    };
  }, [showtimeId]);

  const connectWebSocket = () => {
    wsService.connect();
    wsService.joinShowtime(showtimeId);
    wsService.onSeatUpdate((data: SeatAvailability) => {
      // Invalidate and refetch seat availability when WebSocket updates
      queryClient.invalidateQueries({ queryKey: ['reservations', 'seat-availability', showtimeId] });
      
      // Update selected seats if they're no longer available
      setSelectedSeats((prev) =>
        prev.filter((seat) => {
          const seatData = data.availability[seat.row - 1]?.[seat.column - 1];
          return seatData?.status === 'available' || seatData?.status === 'hold';
        })
      );
    });
  };

  const handleSeatClick = (row: number, column: number, status: string) => {
    if (status === 'confirmed' || holdMutation.isPending || confirmMutation.isPending) return;

    const seat: Seat = { row, column, status: 'available' };
    const isSelected = selectedSeats.some((s) => s.row === row && s.column === column);

    if (isSelected) {
      setSelectedSeats(selectedSeats.filter((s) => !(s.row === row && s.column === column)));
    } else {
      if (status === 'available') {
        setSelectedSeats([...selectedSeats, seat]);
      }
    }
  };

  const handleHoldSeats = async () => {
    if (selectedSeats.length === 0) {
      setError('Please select at least one seat');
      return;
    }

    try {
      setError(null);
      const reservation = await holdMutation.mutateAsync({ showtimeId, seats: selectedSeats });
      setCurrentReservation(reservation._id);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to hold seats');
    }
  };

  const handleConfirm = async () => {
    if (!currentReservation) return;

    try {
      setError(null);
      await confirmMutation.mutateAsync(currentReservation);
      alert('Reservation confirmed successfully!');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm reservation');
    }
  };

  const getSeatStatus = (row: number, column: number): string => {
    if (!availability) return 'available';
    const seat = availability.availability[row - 1]?.[column - 1];
    return seat?.status || 'available';
  };

  const isSeatSelected = (row: number, column: number): boolean => {
    return selectedSeats.some((s) => s.row === row && s.column === column);
  };

  if (isLoading) {
    return <div className="seat-map-loading">Loading seat map...</div>;
  }

  if (!availability || queryError) {
    return <div className="seat-map-error">Failed to load seat map</div>;
  }

  const {  availability: seats } = availability;

  return (
    <div className="seat-map">
      <div className="seat-map-info">
        <p>Select your seats</p>
        <div className="seat-legend">
          <div className="legend-item">
            <div className="legend-seat available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-seat selected"></div>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="legend-seat held"></div>
            <span>Held</span>
          </div>
          <div className="legend-item">
            <div className="legend-seat booked"></div>
            <span>Booked</span>
          </div>
        </div>
      </div>

      <div className="screen-indicator">SCREEN</div>

      <div className="seat-grid">
        {seats.map((row, rowIndex) => (
          <div key={rowIndex} className="seat-row">
            <span className="row-label">{rowIndex + 1}</span>
            {row.map((seat, colIndex) => {
              const status = getSeatStatus(seat.row, seat.column);
              const selected = isSeatSelected(seat.row, seat.column);
              const seatClass = `seat ${status} ${selected ? 'selected' : ''}`;

              return (
                <button
                  key={colIndex}
                  className={seatClass}
                  onClick={() => handleSeatClick(seat.row, seat.column, status)}
                  disabled={status === 'confirmed' || holdMutation.isPending || confirmMutation.isPending}
                  title={`Row ${seat.row}, Seat ${seat.column}`}
                >
                  {seat.column}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {error && <div className="seat-map-error-message">{error}</div>}

      <div className="seat-map-actions">
        {!currentReservation ? (
          <button
            className="hold-btn"
            onClick={handleHoldSeats}
            disabled={selectedSeats.length === 0 || holdMutation.isPending}
          >
            {holdMutation.isPending ? 'Holding...' : `Hold ${selectedSeats.length} Seat(s)`}
          </button>
        ) : (
          <div className="reservation-actions">
            <p className="reservation-info">
              Seats held! Confirm within 5 minutes or they will be released.
            </p>
            <div className="action-buttons">
              <button className="confirm-btn" onClick={handleConfirm} disabled={confirmMutation.isPending}>
                {confirmMutation.isPending ? 'Confirming...' : 'Confirm Reservation'}
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setCurrentReservation(null);
                  setSelectedSeats([]);
                }}
                disabled={confirmMutation.isPending}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SeatMap;
