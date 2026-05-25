import { useEffect, useState } from 'react';
import { createEquipment, deleteEquipment, getEquipmentList } from '../services/equipmentService';
import AdminUsersPermissions from './AdminUsersPermissions';
import './Admin.css';

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

function Admin() {
  const [form, setForm] = useState(initialForm);
  const [equipmentList, setEquipmentList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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

  useEffect(() => {
    loadEquipment();
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

  return (
    <main className="admin-page">
      <header className="admin-header">
        <h1 className="admin-title">Panel administratora</h1>
        <p className="admin-subtitle">
          Dodawanie i usuwanie sprzętu dostępnego w systemie rezerwacji.
        </p>
      </header>

      {error && <p className="admin-alert admin-alert-error">{error}</p>}
      {successMessage && <p className="admin-alert admin-alert-success">{successMessage}</p>}

      <section className="admin-layout">
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
                          <span className="admin-status">{formatStatus(status)}</span>
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
      </section>
     <AdminUsersPermissions />
    </main>
  );
}

export default Admin;
