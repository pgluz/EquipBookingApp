import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/authService';
import './Login.css';

function Login() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (token) {
      navigate('/home');
    }
  }, [navigate]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (!login.trim() || !password.trim()) {
      setError('Podaj login i hasło.');
      return;
    }

    try {
      setIsLoading(true);

      const data = await loginUser(login.trim(), password);
      const token = data?.token || data?.jwt || data?.accessToken;

      if (!token) {
        throw new Error('Backend nie zwrócił tokena logowania.');
      }

      localStorage.setItem('token', token);

      if (data?.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      navigate('/home');
    } catch (err) {
      setError(err.message || 'Nie udało się zalogować.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <h1 id="login-title" className="login-title">
          Logowanie
        </h1>

        <p className="login-subtitle">
          Zaloguj się do systemu rezerwacji sprzętu.
        </p>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login">Login</label>
            <input
              id="login"
              type="text"
              value={login}
              onChange={(event) => setLogin(event.target.value)}
              placeholder="Wpisz login"
              autoComplete="username"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Hasło</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Wpisz hasło"
              autoComplete="current-password"
            />
          </div>

          {error && <p className="login-error">{error}</p>}

          <button className="login-button" type="submit" disabled={isLoading}>
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
