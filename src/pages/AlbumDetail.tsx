import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SongList, type Song } from '../components/ui/SongList';
import { usePlayer } from '../context/PlayerContext';
import { getImageUrl } from '../utils/imageUrl';
import { downloadSong } from '../services/offlineStorage';
import './Detail.css';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:8787/api';

export const AlbumDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [albumInfo, setAlbumInfo] = useState<any>(null);
  const { playSong } = usePlayer();

  useEffect(() => {
    // Buscar detalle del álbum para la imagen de cabecera
    fetch(`${API_URL}/albums`)
      .then(res => res.json())
      .then(data => {
        const found = data.find((a: any) => a.id === id);
        if (found) setAlbumInfo(found);
      })
      .catch(err => console.error(err));

    // Buscar canciones
    fetch(`${API_URL}/albums/${id}/songs`)
      .then(res => res.json())
      .then(data => {
        setSongs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching album songs:', err);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="page-padding">Cargando...</div>;

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
      <div className="detail-header glass">
        {albumInfo && (
          <>
            <img 
              src={getImageUrl(albumInfo.url_album) || 'https://via.placeholder.com/200'} 
              alt={albumInfo.album} 
              className="detail-image shadow-xl"
            />
            <div className="detail-info">
              <span>Álbum</span>
              <h1 className="detail-title">{albumInfo.album}</h1>
              <p>{songs.length} canciones</p>
            </div>
          </>
        )}
      </div>
      <div className="page-padding">
        <SongList songs={songs} onPlay={playSong} onDownload={handleDownload} />
      </div>
    </div>
  );
};
