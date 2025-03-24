import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Applications from './pages/Applications';
import Login from './pages/auth/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Users from './pages/Users';
import Clients from './pages/Clients';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/apps" element={
          <ProtectedRoute>
            <Applications />
          </ProtectedRoute>
        } />
        <Route path="/users" element={
          <ProtectedRoute>
            <Users />
          </ProtectedRoute>
        } />
        <Route path="/clients" element={
          <ProtectedRoute>
            <Clients />
          </ProtectedRoute>
        } />
        <Route path="/plugins" element={
          <ProtectedRoute>
            <div className="p-6">Page Plugins (à implémenter)</div>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
