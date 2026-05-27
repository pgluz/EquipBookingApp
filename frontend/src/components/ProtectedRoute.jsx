import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requireAdmin }) {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (!token || !userStr) {
    return <Navigate to="/" replace />;
  }

  const user = JSON.parse(userStr);
  const userRole = user.role || 'User';

  // Jeśli widok wymaga wyższych uprawnień, wpuszczamy Admina ATAKŻE Approvera
  if (requireAdmin && userRole !== 'Admin' && userRole !== 'Approver') {
    return <Navigate to="/home" replace />;
  }

  return children;
}

export default ProtectedRoute;