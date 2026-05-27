import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requireAdmin }) {
  // Sprawdzamy czy w ogóle jest token w localStorage
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  // Jeśli brak tokena -> natychmiastowe wyrzucenie do logowania
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Jeśli ścieżka wymaga bycia adminem, sprawdzamy dane użytkownika
  if (requireAdmin) {
    if (!userStr) {
      return <Navigate to="/home" replace />; // Brak obiektu user = wyrzucamy!
    }
    try {
      const user = JSON.parse(userStr);
      if (user.login !== 'admin') {
        return <Navigate to="/home" replace />;
      }
    } catch (error) {
      return <Navigate to="/" replace />;
    }
  }

  // Jeśli wszystko gra, przepuszczamy użytkownika do komponentu docelowego
  return children;
}

export default ProtectedRoute;