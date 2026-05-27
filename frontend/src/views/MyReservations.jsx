import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyReservations } from '../services/reservationService';
import './Home.css';

function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const data = await getMyReservations();
        setReservations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Prosty formater daty
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pl-PL');

  return (
    <main className="home-page">
      <header className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="home-title">Moje rezerwacje</h1>
          <p className="home-subtitle">Historia Twoich wypożyczeń i status próśb.</p>
        </div>
        <button className="home-refresh-button" onClick={() => navigate('/home')}>
          Wróć do listy sprzętu
        </button>
      </header>

      <section className="home-card">
        {error && <p className="home-alert">{error}</p>}

        {isLoading ? (
          <p className="home-empty">Ładowanie rezerwacji...</p>
        ) : reservations.length === 0 ? (
          <p className="home-empty">Nie masz jeszcze żadnych rezerwacji.</p>
        ) : (
          <div className="home-table-wrapper">
            <table className="home-table">
              <thead>
                <tr>
                  <th>Sprzęt</th>
                  <th>Data rozpoczęcia</th>
                  <th>Data zakończenia</th>
                  <th>Cel</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((res) => (
                  <tr key={res.id}>
                    <td><strong>{res.equipmentName}</strong></td>
                    <td>{formatDate(res.startDate)}</td>
                    <td>{formatDate(res.endDate)}</td>
                    <td>{res.purpose}</td>
                    <td>
                      <span className="home-status">{res.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

export default MyReservations;