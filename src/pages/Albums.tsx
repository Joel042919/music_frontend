import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { getImageUrl } from '../utils/imageUrl';
import './Grid.css'; // Compartido con Artists

const API_URL = 'http://localhost:8787/api'; // Asegurar misma constante

interface Album {
  id: string;
  album: string;
  url_album: string;
}

export const Albums: React.FC = () => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/albums`)
      .then(res => res.json())
      .then(data => {
        setAlbums(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching albums:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-padding">Cargando álbumes...</div>;

  return (
    <div className="page-padding">
      <h2 className="section-title">Álbumes</h2>
      <div className="grid-container">
        {albums.map(album => (
          <Card
            key={album.id}
            id={album.id}
            title={album.album}
            image={getImageUrl(album.url_album) || 'https://via.placeholder.com/150'}
            onClick={(id) => navigate(`/albums/${id}`)}
          />
        ))}
      </div>
    </div>
  );
};
