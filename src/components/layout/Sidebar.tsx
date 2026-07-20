import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Disc, Mic2, Upload, ListMusic, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../ui/Modal';
import './Sidebar.css';

// Interfaz para las playlists
interface Playlist {
  id: string;
  name: string;
}

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:8787/api';

export const Sidebar: React.FC = () => {
  const { token } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const fetchPlaylists = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/playlists`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPlaylists(data);
      }
    } catch (err) {
      console.error('Error fetching playlists:', err);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, [token]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName || newPlaylistName.trim() === '') return;

    try {
      const res = await fetch(`${API_URL}/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newPlaylistName.trim() })
      });
      
      if (res.ok) {
        setNewPlaylistName('');
        setIsModalOpen(false);
        fetchPlaylists();
      } else {
        alert('Error al crear la playlist');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>MusicPWA</h2>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3>Library</h3>
          <ul>
            <li>
              <NavLink to="/songs" className={({ isActive }) => isActive ? 'active' : ''}>
                <Home size={20} /> Songs
              </NavLink>
            </li>
            <li>
              <NavLink to="/albums" className={({ isActive }) => isActive ? 'active' : ''}>
                <Disc size={20} /> Albums
              </NavLink>
            </li>
            <li>
              <NavLink to="/artists" className={({ isActive }) => isActive ? 'active' : ''}>
                <Mic2 size={20} /> Artists
              </NavLink>
            </li>
            <li>
              <NavLink to="/uploads" className={({ isActive }) => isActive ? 'active' : ''}>
                <Upload size={20} /> Uploads
              </NavLink>
            </li>
          </ul>
        </div>

        <div className="nav-section playlists-section">
          <div className="playlists-header">
            <h3>Playlists</h3>
            <button className="btn-icon" onClick={() => setIsModalOpen(true)}><PlusCircle size={18} /></button>
          </div>
          <ul>
            {playlists.map(pl => (
              <li key={pl.id}>
                <NavLink to={`/playlists/${pl.id}`} className={({ isActive }) => isActive ? 'active' : ''}>
                  <ListMusic size={20} /> {pl.name}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Crear Playlist">
        <div className="modal-form-group">
          <label>Nombre de la nueva playlist</label>
          <input 
            type="text" 
            value={newPlaylistName} 
            onChange={(e) => setNewPlaylistName(e.target.value)} 
            placeholder="Mi playlist genial" 
            autoFocus
          />
        </div>
        <div className="modal-actions">
          <button className="modal-btn secondary" onClick={() => setIsModalOpen(false)}>Cancelar</button>
          <button className="modal-btn primary" onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>Crear</button>
        </div>
      </Modal>
    </aside>
  );
};
