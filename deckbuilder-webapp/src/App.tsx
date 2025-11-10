import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DeckEditor from './pages/DeckEditor';
import DeckList from './pages/DeckList';
import PullRequests from './pages/PullRequests';
import AuthCallback from './pages/AuthCallback';
import './App.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/decks"
          element={
            <ProtectedRoute>
              <DeckList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/deck/:owner/:repo/:path"
          element={
            <ProtectedRoute>
              <DeckEditor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pulls/:owner/:repo"
          element={
            <ProtectedRoute>
              <PullRequests />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
