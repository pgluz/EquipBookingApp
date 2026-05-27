import { useEffect, useMemo, useState } from 'react';
import { getHomeEquipmentList } from '../services/homeEquipmentService';
import './Home.css';
import ReservationModal from '../components/ReservationModal';
import { useNavigate } from 'react-router-dom';

function getEquipmentValue(equipment, camelCaseKey, pascalCaseKey) {
  return equipment?.[camelCaseKey] ?? equipment?.[pascalCaseKey] ?? '';
}

function getEquipmentId(equipment) {
  return equipment?.id ?? equipment?.Id;
}

function formatStatus(status) {
  const statusMap = {
    Available: 'Dostępny',
    Unavailable: 'Niedostępny',
    Damaged: 'Uszkodzony',
    Borrowed: 'Wypożyczony',
  };

  return statusMap[status] || status || 'Brak statusu';
}

function equipmentMatchesSearch(equipment, searchText) {
  const normalizedSearch = searchText.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  const searchableValues = [
    getEquipmentValue(equipment, 'name', 'Name'),
    getEquipmentValue(equipment, 'type', 'Type'),
    getEquipmentValue(equipment, 'description', 'Description'),
    getEquipmentValue(equipment, 'location', 'Location'),
    getEquipmentValue(equipment, 'status', 'Status'),
  ];

  return searchableValues.some((value) =>
    String(value || '').toLowerCase().includes(normalizedSearch)
  );
}

function Home() {
  const [equipmentList, setEquipmentList] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState(null); // Trzyma sprzęt do rezerwacji
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate(); // Nawigacja do rezerwacji
  
  async function loadEquipment() {
    try {
      setIsLoading(true);
      setError('');

      const data = await getHomeEquipmentList();
      setEquipmentList(data);
    } catch (err) {
      setError(err.message || 'Nie udało się pobrać listy sprzętu.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadEquipment();
  }, []);

  const filteredEquipment = useMemo(
    () => equipmentList.filter((equipment) => equipmentMatchesSearch(equipment, searchText)),
    [equipmentList, searchText]
  );

  return (
    <main className="home-page">

      <header className="home-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="home-title">Dostępny sprzęt</h1>
        </div>
        <button 
          className="home-refresh-button" 
          style={{ backgroundColor: '#4b5563' }} 
          onClick={() => navigate('/my-reservations')}
        >
          Moje rezerwacje
        </button>
      </header>


      <section className="home-card">
        <div className="home-toolbar">
          <input
            className="home-search"
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Szukaj po nazwie, rodzaju, opisie, lokalizacji lub statusie"
          />

          <button
            className="home-refresh-button"
            type="button"
            onClick={loadEquipment}
            disabled={isLoading}
          >
            {isLoading ? 'Odświeżanie...' : 'Odśwież'}
          </button>
        </div>

        {error && <p className="home-alert">{error}</p>}
        {successMessage && <p className="home-alert" style={{ backgroundColor: '#dcfce7', color: '#166534' }}>{successMessage}</p>}

        {isLoading ? (
          <p className="home-empty">Ładowanie listy sprzętu...</p>
        ) : filteredEquipment.length === 0 ? (
          <p className="home-empty">
            {searchText ? 'Brak sprzętu pasującego do wyszukiwania.' : 'Brak sprzętu do wyświetlenia.'}
          </p>
        ) : (
          <div className="home-table-wrapper">
            <table className="home-table">
              <thead>
                <tr>
                  <th>Nazwa sprzętu</th>
                  <th>Rodzaj</th>
                  <th>Opis</th>
                  <th>Lokalizacja</th>
                  <th>Status</th>
                  <th>Akcje</th>
                </tr>
              </thead>

              <tbody>
                {filteredEquipment.map((equipment) => {
                  const id = getEquipmentId(equipment);
                  const name = getEquipmentValue(equipment, 'name', 'Name');
                  const type = getEquipmentValue(equipment, 'type', 'Type');
                  const description = getEquipmentValue(equipment, 'description', 'Description');
                  const location = getEquipmentValue(equipment, 'location', 'Location');
                  const status = getEquipmentValue(equipment, 'status', 'Status');

                  return (
                    <tr key={id || name}>
                      <td>{name || '-'}</td>
                      <td>{type || '-'}</td>
                      <td>{description || '-'}</td>
                      <td>{location || '-'}</td>
                      <td>
                        <span className="home-status">{formatStatus(status)}</span>
                      </td>
                      <td>
                        <button className="home-refresh-button"
                        style={{ padding: '6px 12px', minHeight: 'auto' }}
                        onClick={() => setSelectedEquipment(equipment)}
                        disabled={status !== 'Dostępny' && status !== 'Available'} // Blokujemy rezerwację jeśli nie jest dostępny
                        >
                          Zarezerwuj
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* Renderowanie modala */}
      {selectedEquipment && (
        <ReservationModal
          equipment={selectedEquipment}
          onClose={() => setSelectedEquipment(null)}
          onSuccess={() => {
            setSelectedEquipment(null);
            setSuccessMessage('Rezerwacja została pomyślnie wysłana do akceptacji!');
            loadEquipment(); // Opcjonalnie odświeża tabelę
            setTimeout(() => setSuccessMessage(''), 5000); // Ukrywa komunikat po 5s
          }}
        />
      )}
    </main>
  );
}

export default Home;
