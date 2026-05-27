import { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { createReservation, getReservedDates } from '../services/reservationService';
import './ReservationModal.css';

function ReservationModal({ equipment, onClose, onSuccess }) {
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [purpose, setPurpose] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [excludedIntervals, setExcludedIntervals] = useState([]);

  const equipmentName = equipment?.name ?? equipment?.Name ?? 'Nieznany sprzęt';
  const equipmentId = equipment?.id ?? equipment?.Id;

  // Pobieranie zajętych terminów przy starcie
  useEffect(() => {
    async function fetchDates() {
      try {
        const data = await getReservedDates(equipmentId);
        // Przekształcamy daty z backendu na format rozumiany przez DatePicker
        const intervals = data.map(res => ({
          start: new Date(res.startDate),
          end: new Date(res.endDate)
        }));
        setExcludedIntervals(intervals);
      } catch (err) {
        console.error("Błąd pobierania dat:", err);
      }
    }
    if (equipmentId) fetchDates();
  }, [equipmentId]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!startDate || !endDate || !purpose.trim()) {
      setError('Proszę wypełnić wszystkie pola i wybrać daty.');
      return;
    }

    try {
      setIsLoading(true);
      
      const startIso = new Date(startDate.getTime() - (startDate.getTimezoneOffset() * 60000)).toISOString();
      const endIso = new Date(endDate.getTime() - (endDate.getTimezoneOffset() * 60000)).toISOString();

      await createReservation({
        equipmentId: equipmentId,
        startDate: startIso,
        endDate: endIso,
        purpose: purpose.trim()
      });

      onSuccess();
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
            <label>Data rozpoczęcia i zakończenia</label>
            <DatePicker
              selected={startDate}
              onChange={(dates) => {
                const [start, end] = dates;
                setStartDate(start);
                setEndDate(end);
              }}
              startDate={startDate}
              endDate={endDate}
              selectsRange
              minDate={new Date()} // Blokuje daty wsteczne
              excludeDateIntervals={excludedIntervals} // Blokuje zajęte dni
              placeholderText="Kliknij, aby wybrać zakres"
              className="custom-datepicker-input"
              dateFormat="dd/MM/yyyy"
              isClearable
            />
          </div>

          <div className="modal-field">
            <label htmlFor="purpose">Cel rezerwacji</label>
            <textarea
              id="purpose"
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Np. Projekt z programowania..."
            />
          </div>

          {error && <p className="modal-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="modal-cancel">Anuluj</button>
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