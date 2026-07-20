import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { type Song } from './SongList';
import './Modal.css';

interface Playlist {
  id: string;
  name: string;
}

interface AddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
}

const API_URL = 'http://localhost:8787/api';

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({ isOpen, onClose, song }) => {
  const { token } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      setLoading(true);
      fetch(`${API_URL}/playlists`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setPlaylists(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
    }
  }, [isOpen, token]);

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!song || !token) return;
    
    try {
      const res = await fetch(`${API_URL}/playlists/${playlistId}/songs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ music_id: song.id })
      });
      
      if (res.ok) {
        alert('Canción agregada a la playlist');
        onClose();
      } else {
        alert('Error al agregar a playlist');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Agregar a Playlist">
      {song && <p style={{marginBottom: '16px'}}>Selecciona una playlist para: <strong>{song.name}</strong></p>}
      
      {loading ? (
        <p>Cargando tus playlists...</p>
      ) : playlists.length === 0 ? (
        <p>No tienes playlists creadas. Crea una desde la barra lateral.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '300px', overflowY: 'auto' }}>
          {playlists.map(pl => (
            <li key={pl.id} style={{ marginBottom: '8px' }}>
              <button 
                className="modal-btn secondary" 
                style={{ width: '100%', textAlign: 'left', padding: '12px' }}
                onClick={() => handleAddToPlaylist(pl.id)}
              >
                {pl.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
};
