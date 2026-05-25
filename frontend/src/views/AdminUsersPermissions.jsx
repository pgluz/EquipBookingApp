import { useEffect, useState } from 'react';
import { getUsers, updateUserPermissions } from '../services/usersService';
import './AdminUsersPermissions.css';

const permissionFields = [
  {
    key: 'canReserve',
    pascalKey: 'CanReserve',
    label: 'Rezerwacja',
  },
  {
    key: 'canMarkBorrowed',
    pascalKey: 'CanMarkBorrowed',
    label: 'Oznacz jako wypożyczony',
  },
  {
    key: 'canMarkAvailable',
    pascalKey: 'CanMarkAvailable',
    label: 'Oznacz jako dostępny',
  },
  {
    key: 'canMarkUnavailable',
    pascalKey: 'CanMarkUnavailable',
    label: 'Oznacz jako niedostępny',
  },
];

function getUserValue(user, camelCaseKey, pascalCaseKey) {
  return user?.[camelCaseKey] ?? user?.[pascalCaseKey] ?? '';
}

function getUserId(user) {
  return user?.id ?? user?.Id;
}

function getPermissionValue(user, permissionField) {
  return Boolean(user?.[permissionField.key] ?? user?.[permissionField.pascalKey] ?? false);
}

function buildPermissionsPayload(user, changedField, checked) {
  const permissions = {};

  permissionFields.forEach((field) => {
    permissions[field.key] = getPermissionValue(user, field);
  });

  // Backend oczekuje pełnego zestawu uprawnień, więc zmieniamy tylko jedno pole.
  permissions[changedField.key] = checked;

  return permissions;
}

function mergePermissionChange(user, permissions) {
  return {
    ...user,
    canReserve: permissions.canReserve,
    canMarkBorrowed: permissions.canMarkBorrowed,
    canMarkAvailable: permissions.canMarkAvailable,
    canMarkUnavailable: permissions.canMarkUnavailable,
  };
}

function AdminUsersPermissions() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  async function loadUsers() {
    try {
      setIsLoading(true);
      setError('');

      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Nie udało się pobrać listy użytkowników.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handlePermissionChange(user, permissionField, checked) {
    const userId = getUserId(user);

    if (!userId) {
      setError('Nie można zmienić uprawnień użytkownika bez identyfikatora.');
      return;
    }

    const permissions = buildPermissionsPayload(user, permissionField, checked);

    try {
      setSavingUserId(userId);
      setError('');
      setSuccessMessage('');

      const updatedUser = await updateUserPermissions(userId, permissions);

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) => {
          const currentUserId = getUserId(currentUser);

          if (currentUserId !== userId) {
            return currentUser;
          }

          return updatedUser || mergePermissionChange(currentUser, permissions);
        })
      );

      setSuccessMessage('Uprawnienia użytkownika zostały zaktualizowane.');
    } catch (err) {
      setError(err.message || 'Nie udało się zaktualizować uprawnień.');
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <section className="admin-users-card">
      <div className="admin-users-header">
        <div>
          <h2 className="admin-users-title">Uprawnienia użytkowników</h2>
          <p className="admin-users-subtitle">
            Nadawanie dostępu do rezerwacji i zmiany statusu sprzętu.
          </p>
        </div>

        <button
          className="admin-users-refresh-button"
          type="button"
          onClick={loadUsers}
          disabled={isLoading}
        >
          {isLoading ? 'Odświeżanie...' : 'Odśwież'}
        </button>
      </div>

      {error && <p className="admin-users-alert admin-users-alert-error">{error}</p>}
      {successMessage && <p className="admin-users-alert admin-users-alert-success">{successMessage}</p>}

      {isLoading ? (
        <p className="admin-users-empty">Ładowanie listy użytkowników...</p>
      ) : users.length === 0 ? (
        <p className="admin-users-empty">Brak użytkowników do wyświetlenia.</p>
      ) : (
        <div className="admin-users-table-wrapper">
          <table className="admin-users-table">
            <thead>
              <tr>
                <th>Login</th>
                <th>Email</th>
                {permissionFields.map((permission) => (
                  <th key={permission.key}>{permission.label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {users.map((user) => {
                const userId = getUserId(user);
                const login = getUserValue(user, 'login', 'Login');
                const email = getUserValue(user, 'email', 'Email');
                const isSavingCurrentUser = savingUserId === userId;

                return (
                  <tr key={userId || login}>
                    <td>{login}</td>
                    <td>{email || '-'}</td>

                    {permissionFields.map((permission) => (
                      <td key={permission.key}>
                        <label className="admin-users-checkbox-label">
                          <input
                            type="checkbox"
                            checked={getPermissionValue(user, permission)}
                            disabled={isSavingCurrentUser}
                            onChange={(event) =>
                              handlePermissionChange(user, permission, event.target.checked)
                            }
                          />
                          <span>Tak</span>
                        </label>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default AdminUsersPermissions;
