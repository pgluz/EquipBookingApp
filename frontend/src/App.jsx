import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './views/Login';
import Home from './views/Home';
import Admin from './views/Admin';
import ProtectedRoute from './components/ProtectedRoute'; 
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Logowanie jest otwarte dla każdego */}
        <Route path="/" element={<Login />} />
        
        {/* Widok Home dostępny dla każdego ZALOGOWANEGO */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } 
        />
        
        {/* Widok Admin dostępny TYLKO DLA ADMINA */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin={true}>
              <Admin />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;