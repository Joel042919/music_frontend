import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SongList, type Song } from '../components/ui/SongList';
import { usePlayer } from '../context/PlayerContext';
import { useAuth } from '../context/AuthContext';
import { getDownloadedSongs, downloadSong } from '../services/offlineStorage';
import './Detail.css';

const API_URL = 'http://localhost:8787/api';

export const PlaylistDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [playlistInfo, setPlaylistInfo] = useState<any>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  
  const { playSong } = usePlayer();
  const { token } = useAuth();

  useEffect(() => {
    const fetchPlaylistData = async () => {
      if (!token) return;

      try {
        if (isOfflineMode) {
          // Si estamos offline, no podemos saber qué canciones pertenecen a la playlist
          // ya que IndexedDB solo guarda canciones sueltas. Por pedido del usuario, 
          // mostramos las descargas locales.
          const offlineSongs = await getDownloadedSongs();
          setSongs(offlineSongs);
          setPlaylistInfo({ name: 'Playlist (Offline)' });
        } else {
          // Buscar detalle de la playlist
          const plRes = await fetch(`${API_URL}/playlists`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (plRes.ok) {
            const data = await plRes.json();
            const found = data.find((p: any) => p.id === id);
            if (found) setPlaylistInfo(found);
          }

          // Buscar canciones de la playlist
          const songsRes = await fetch(`${API_URL}/playlists/${id}/songs`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (songsRes.ok) {
            const songsData = await songsRes.json();
            setSongs(songsData);
          }
        }
      } catch (err) {
        console.error('Error fetching playlist songs:', err);
        // Fallback a offline
        const offlineSongs = await getDownloadedSongs();
        setSongs(offlineSongs);
        setPlaylistInfo({ name: 'Playlist (Modo Sin Conexión)' });
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistData();

    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [id, token, isOfflineMode]);

  if (loading) return <div className="page-padding">Cargando playlist...</div>;

  const handleDownload = async (song: Song) => {
    try {
      await downloadSong(song);
      alert(`Canción ${song.name} descargada para uso offline.`);
    } catch (e) {
      console.error(e);
      alert('Error al descargar la canción');
    }
  };

  return (
    <div className="detail-page">
      <div className="detail-header glass" style={{ background: 'linear-gradient(to bottom, rgba(50, 50, 100, 0.5), rgba(18, 18, 18, 1))' }}>
        <div className="detail-info">
          <span>Playlist</span>
          <h1 className="detail-title">{playlistInfo?.name || 'Cargando...'}</h1>
          <p>{songs.length} canciones</p>
        </div>
      </div>
      <div className="page-padding">
        <SongList 
          songs={songs} 
          onPlay={playSong} 
          onDownload={!isOfflineMode ? handleDownload : undefined} 
        />
      </div>
    </div>
  );
};
