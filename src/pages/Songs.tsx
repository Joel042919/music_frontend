import React, { useEffect, useState } from 'react';
import { SongList, type Song } from '../components/ui/SongList';
import { usePlayer } from '../context/PlayerContext';
import { getDownloadedSongs, downloadSong } from '../services/offlineStorage';
import './Grid.css';

const API_URL = 'http://localhost:8787/api';

export const Songs: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(!navigator.onLine);
  const { playSong } = usePlayer();

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        if (isOfflineMode) {
          const offlineSongs = await getDownloadedSongs();
          setSongs(offlineSongs);
        } else {
          const res = await fetch(`${API_URL}/songs`);
          const data = await res.json();
          setSongs(data);
        }
      } catch (err) {
        console.error('Error fetching songs:', err);
        // Fallback a offline
        const offlineSongs = await getDownloadedSongs();
        setSongs(offlineSongs);
      } finally {
        setLoading(false);
      }
    };

    fetchSongs();

    const handleOnline = () => setIsOfflineMode(false);
    const handleOffline = () => setIsOfflineMode(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isOfflineMode]);

  const handlePlay = (song: Song) => {
    playSong(song);
  };

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
    <div className="page-padding">
      <h2 className="section-title">
        {isOfflineMode ? 'Canciones Descargadas (Offline)' : 'Todas las Canciones'}
      </h2>
      {loading ? (
        <div>Cargando canciones...</div>
      ) : (
        <SongList 
          songs={songs} 
          onPlay={handlePlay} 
          onDownload={!isOfflineMode ? handleDownload : undefined} 
        />
      )}
    </div>
  );
};
