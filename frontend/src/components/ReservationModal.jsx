import { useState } from 'react';
import { createReservation } from '../services/reservationService';
import './ReservationModal.css';

function ReservationModal({ equipment, onClose, onSuccess }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Funkcje pomocnicze, bo Twój sprzęt ma różnie zapisane klucze
  const equipmentName = equipment?.name ?? equipment?.Name ?? 'Nieznany sprzęt';
  const equipmentId = equipment?.id ?? equipment?.Id;

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!startDate || !endDate || !purpose.trim()) {
      setError('Proszę wypełnić wszystkie pola.');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError('Data zakończenia musi być późniejsza niż data rozpoczęcia.');
      return;
    }

    try {
      setIsLoading(true);
      
      await createReservation({
        equipmentId: equipmentId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        purpose: purpose.trim()
      });

      onSuccess(); // Zamyka modal i odświeża listę/pokazuje sukces
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Rezerwacja sprzętu</h2>
        <p className="modal-subtitle">Wypożyczasz: <strong>{equipmentName}</strong></p>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label htmlFor="startDate">Data rozpoczęcia</label>
            <input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="endDate">Data zakończenia</label>
            <input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="modal-field">
            <label htmlFor="purpose">Cel rezerwacji</label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Np. Projekt z programowania, wyjazd na konferencję..."
            />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="modal-cancel">
              Anuluj
            </button>
            <button type="submit" disabled={isLoading} className="modal-submit">
              {isLoading ? 'Przetwarzanie...' : 'Potwierdź rezerwację'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ReservationModal;