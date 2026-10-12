import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/common/ProtectedRoute.jsx';
import Toast from './components/common/Toast.jsx';
import ConfirmDialog from './components/common/ConfirmDialog.jsx';
import PlayerBar from './components/player/PlayerBar.jsx';

import Home from './pages/Home.jsx';
import Search from './pages/Search.jsx';
import Library from './pages/Library.jsx';
import Liked from './pages/Liked.jsx';
import PlaylistDetail from './pages/PlaylistDetail.jsx';
import AlbumDetail from './pages/AlbumDetail.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminUpload from './pages/AdminUpload.jsx';
import NotFound from './pages/NotFound.jsx';

/** Login/Register are only reachable by logged-out visitors. */
function GuestOnly({ children }) {
  return <ProtectedRoute inverted>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
        <Route path="/register" element={<GuestOnly><Register /></GuestOnly>} />

        {/* Pages rendered inside the persistent shell (sidebar + topbar + mobile nav) */}
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/library" element={<Library />} />
          <Route path="/liked" element={<Liked />} />
          <Route path="/playlist/:id" element={<PlaylistDetail />} />
          <Route path="/album/:id" element={<AlbumDetail />} />
          <Route
            path="/profile"
            element={<ProtectedRoute><Profile /></ProtectedRoute>}
          />
          <Route
            path="/admin"
            element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>}
          />
          <Route
            path="/admin/upload"
            element={<ProtectedRoute adminOnly><AdminUpload /></ProtectedRoute>}
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>

      {/* Rendered once at the root so playback survives every navigation,
          including visits to the login page. */}
      <PlayerBar />
      <Toast />
      <ConfirmDialog />
    </BrowserRouter>
  );
}
