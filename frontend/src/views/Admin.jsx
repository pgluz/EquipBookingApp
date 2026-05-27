import { useEffect, useState } from 'react';
import { createEquipment, deleteEquipment, getEquipmentList } from '../services/equipmentService';
import { getAllReservations, acceptReservation, rejectReservation, deleteReservation} from '../services/reservationService';
import './Admin.css';
import { useNavigate } from 'react-router-dom';
import { getUsers, createUser } from '../services/userService';

const initialForm = {
  name: '',
  type: '',
  description: '',
  location: '',
  status: 'Available',
};

const statusOptions = [
  { value: 'Available', label: 'Dostępny' },
  { value: 'Unavailable', label: 'Niedostępny' },
  { value: 'Damaged', label: 'Uszkodzony' },
];

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

function getStatusColorClass(status) { // Pomocnicza funkcja do kolorowania statusów sprzętu
  const s = status?.toLowerCase() || '';
  if (s === 'available' || s === 'dostępny') return 'status-badge-green';
  if (s === 'unavailable' || s === 'damaged' || s === 'niedostępny' || s === 'uszkodzony') return 'status-badge-red';
  if (s === 'borrowed' || s === 'wypożyczony') return 'status-badge-yellow';
  return '';
}

function Admin() {
  const [form, setForm] = useState(initialForm);
  const [equipmentList, setEquipmentList] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoadingReservations, setIsLoadingReservations] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();
  // Odczytanie roli z LocalStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = currentUser.role || 'User';

  // Stany dla użytkowników
  const [usersList, setUsersList] = useState([]);
  const [userForm, setUserForm] = useState({ login: '', password: '', email: '', role: 'User' });
  const [isSavingUser, setIsSavingUser] = useState(false);

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }

  async function loadUsers() {
    if (userRole !== 'Admin') return;
    try {
      const data = await getUsers();
      setUsersList(data);
    } catch (err) {
      setError(err.message || 'Nie udało się pobrać listy kont.');
    }
  }

  async function loadEquipment() {
    try {
      setIsLoading(true);
      setError('');

      const data = await getEquipmentList();
      setEquipmentList(data);
    } catch (err) {
      setError(err.message || 'Nie udało się pobrać listy sprzętu.');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadReservations() {
    try {
      setIsLoadingReservations(true);
      const data = await getAllReservations();
      setReservations(data);
    } catch (err) {
      setError(err.message || 'Nie udało się pobrać rezerwacji.');
    } finally {
      setIsLoadingReservations(false);
    }
  }

  useEffect(() => {
    loadEquipment();
    loadReservations();
    loadUsers();
  }, []);

  function handleInputChange(event) {
    const { name, value } = event.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!form.name.trim() || !form.type.trim() || !form.location.trim()) {
      setError('Uzupełnij nazwę, rodzaj i lokalizację sprzętu.');
      return;
    }

    try {
      setIsSaving(true);

      await createEquipment({
        name: form.name.trim(),
        type: form.type.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        status: form.status,
      });

      setForm(initialForm);
      setSuccessMessage('Sprzęt został dodany.');
      await loadEquipment();
    } catch (err) {
      setError(err.message || 'Nie udało się dodać sprzętu.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(equipment) {
    const id = getEquipmentId(equipment);
    const name = getEquipmentValue(equipment, 'name', 'Name');

    if (!id) {
      setError('Nie można usunąć sprzętu bez identyfikatora.');
      return;
    }

    const confirmed = window.confirm(`Czy na pewno usunąć sprzęt "${name || id}"?`);

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setSuccessMessage('');

      await deleteEquipment(id);

      setSuccessMessage('Sprzęt został usunięty.');
      await loadEquipment();
    } catch (err) {
      setError(err.message || 'Nie udało się usunąć sprzętu.');
    }
  } 
  
  async function handleAccept(id) {
    try {
      await acceptReservation(id);
      setSuccessMessage('Rezerwacja została zaakceptowana.');
      loadReservations();
      loadEquipment();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleReject(id) {
    try {
      await rejectReservation(id);
      setSuccessMessage('Rezerwacja została odrzucona.');
      loadReservations();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteReservation(id) {
    const confirmed = window.confirm('Czy na pewno chcesz trwale usunąć tę rezerwację z bazy?');
    if (!confirmed) return;

    try {
      await deleteReservation(id);
      setSuccessMessage('Rezerwacja została usunięta.');
      loadReservations();
    } catch (err) {
      setError(err.message);
    }
  }

  // Funkcja do obsługi formularza userów
  function handleUserInputChange(event) {
    const { name, value } = event.target;
    setUserForm(curr => ({ ...curr, [name]: value }));
  }

  async function handleUserSubmit(event) {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!userForm.login.trim() || !userForm.password.trim() || !userForm.role) {
      setError('Uzupełnij login, hasło i rolę.');
      return;
    }

    try {
      setIsSavingUser(true);
      await createUser(userForm);
      setUserForm({ login: '', password: '', email: '', role: 'User' });
      setSuccessMessage('Konto zostało pomyślnie utworzone.');
      await loadUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSavingUser(false);
    }
  }

  return (
    <main className="admin-page">
      <header className="admin-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="admin-title">Panel administratora</h1>
          <p className="admin-subtitle">
            Dodawanie i usuwanie sprzętu
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="admin-button" 
            style={{ backgroundColor: '#4b5563', padding: '8px 16px', minHeight: 'auto' }} 
            onClick={() => navigate('/home')}
          >
            Strona główna
          </button>
          <button 
            className="admin-button" 
            style={{ backgroundColor: '#dc2626', padding: '8px 16px', minHeight: 'auto' }}
            onClick={handleLogout}
          >
            Wyloguj
          </button>
        </div>
      </header>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {successMessage && <p className="admin-alert admin-alert-success">{successMessage}</p>}
      <section className="admin-layout">
        
        {userRole === 'Admin' && (
          <>
            <div className="admin-card">
              <h2 className="admin-card-title">Dodaj sprzęt</h2>

              <form className="admin-form" onSubmit={handleSubmit}>
                <div className="admin-field">
                  <label htmlFor="name">Nazwa sprzętu</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleInputChange}
                    placeholder="Np. Laptop Dell"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="type">Rodzaj</label>
                  <input
                    id="type"
                    name="type"
                    type="text"
                    value={form.type}
                    onChange={handleInputChange}
                    placeholder="Np. laptop, projektor"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="description">Opis</label>
                  <textarea
                    id="description"
                    name="description"
                    value={form.description}
                    onChange={handleInputChange}
                    placeholder="Krótki opis sprzętu"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="location">Lokalizacja</label>
                  <input
                    id="location"
                    name="location"
                    type="text"
                    value={form.location}
                    onChange={handleInputChange}
                    placeholder="Np. sala 203"
                  />
                </div>

                <div className="admin-field">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                  >
                    {statusOptions.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <button className="admin-button" type="submit" disabled={isSaving}>
                  {isSaving ? 'Dodawanie...' : 'Dodaj sprzęt'}
                </button>
              </form>
            </div>

            <div className="admin-card">
              <h2 className="admin-card-title">Lista sprzętu</h2>

              {isLoading ? (
                <p className="admin-empty">Ładowanie listy sprzętu...</p>
              ) : equipmentList.length === 0 ? (
                <p className="admin-empty">Brak sprzętu do wyświetlenia.</p>
              ) : (
                <div className="admin-table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nazwa</th>
                        <th>Rodzaj</th>
                        <th>Opis</th>
                        <th>Lokalizacja</th>
                        <th>Status</th>
                        <th>Akcje</th>
                      </tr>
                    </thead>

                    <tbody>
                      {equipmentList.map((equipment) => {
                        const id = getEquipmentId(equipment);
                        const name = getEquipmentValue(equipment, 'name', 'Name');
                        const type = getEquipmentValue(equipment, 'type', 'Type');
                        const description = getEquipmentValue(equipment, 'description', 'Description');
                        const location = getEquipmentValue(equipment, 'location', 'Location');
                        const status = getEquipmentValue(equipment, 'status', 'Status');

                        return (
                          <tr key={id || name}>
                            <td>{name}</td>
                            <td>{type}</td>
                            <td>{description || '-'}</td>
                            <td>{location}</td>
                            <td>
                              <span className={`admin-status ${getStatusColorClass(status)}`}>
                                {formatStatus(status)}
                              </span>
                            </td>
                            <td>
                              <button
                                className="admin-button-danger"
                                type="button"
                                onClick={() => handleDelete(equipment)}
                              >
                                Usuń
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="admin-card" style={{ marginTop: '24px' }}>
              <h2 className="admin-card-title">Zarządzanie użytkownikami</h2>
              
              <form className="admin-form" onSubmit={handleUserSubmit}>
                <div className="admin-field">
                  <label htmlFor="userLogin">Login</label>
                  <input id="userLogin" name="login" type="text" value={userForm.login} onChange={handleUserInputChange} />
                </div>
                <div className="admin-field">
                  <label htmlFor="userPassword">Hasło</label>
                  <input id="userPassword" name="password" type="password" value={userForm.password} onChange={handleUserInputChange} />
                </div>
                <div className="admin-field">
                  <label htmlFor="userEmail">E-mail (do powiadomień)</label>
                  <input id="userEmail" name="email" type="email" value={userForm.email} onChange={handleUserInputChange} />
                </div>
                <div className="admin-field">
                  <label htmlFor="userRole">Rola w systemie</label>
                  <select id="userRole" name="role" value={userForm.role} onChange={handleUserInputChange}>
                    <option value="User">Zwykły Użytkownik (tylko rezerwacje)</option>
                    <option value="Approver">Akceptant (rezerwacje + panel akceptacji)</option>
                    <option value="Admin">Administrator (pełen dostęp)</option>
                  </select>
                </div>
                <button className="admin-button" type="submit" disabled={isSavingUser}>
                  {isSavingUser ? 'Tworzenie...' : 'Utwórz konto'}
                </button>
              </form>

              <div className="admin-table-wrapper" style={{ marginTop: '24px' }}>
                <table className="admin-table">
                  <thead>
                    <tr><th>ID</th><th>Login</th><th>Email</th><th>Rola</th></tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td><strong>{u.login}</strong></td>
                        <td>{u.email || '-'}</td>
                        <td><span className="admin-status">{u.role}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div className="admin-card" style={{ marginTop: '24px' }}>
          <h2 className="admin-card-title">Zarządzanie rezerwacjami</h2>

          {isLoadingReservations ? (
            <p className="admin-empty">Ładowanie rezerwacji...</p>
          ) : reservations.length === 0 ? (
            <p className="admin-empty">Brak zgłoszonych rezerwacji.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Użytkownik</th>
                    <th>Sprzęt</th>
                    <th>Termin</th>
                    <th>Cel</th>
                    <th>Status</th>
                    <th>Akcje</th>
                  </tr>
                </thead>
                <tbody>
                  {reservations.map((res) => (
                    <tr key={res.id}>
                      <td><strong>{res.userName}</strong></td>
                      <td>{res.equipmentName}</td>
                      <td>
                        {new Date(res.startDate).toLocaleDateString('pl-PL')} - <br/>
                        {new Date(res.endDate).toLocaleDateString('pl-PL')}
                      </td>
                      <td>{res.purpose}</td>
                      <td>
                        <span className="admin-status">{res.status}</span>
                      </td>
                      <td>
                        {res.status === 'Oczekująca' && (
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                            <button
                              className="admin-button"
                              style={{ padding: '6px 12px', minHeight: 'auto', backgroundColor: '#166534' }}
                              onClick={() => handleAccept(res.id)}
                            >
                              Akceptuj
                            </button>
                            <button
                              className="admin-button-danger"
                              style={{ padding: '6px 12px' }}
                              onClick={() => handleReject(res.id)}
                            >
                              Odrzuć
                            </button>
                          </div>
                        )}
                        <button
                          className="admin-button-danger"
                          style={{ padding: '6px 12px', width: '100%' }}
                          onClick={() => handleDeleteReservation(res.id)}
                        >
                          Usuń trwale
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}

export default Admin;
