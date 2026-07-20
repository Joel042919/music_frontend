import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { getImageUrl } from '../utils/imageUrl';
import './Grid.css';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:8787/api';

interface Artist {
  id: string;
  autor: string;
  url_autor: string;
}

export const Artists: React.FC = () => {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/artists`)
      .then(res => res.json())
      .then(data => {
        setArtists(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching artists:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="page-padding">Cargando artistas...</div>;

  return (
    <div className="page-padding">
      <h2 className="section-title">Artistas</h2>
      <div className="grid-container">
        {artists.map(artist => (
          <Card
            key={artist.id}
            id={artist.id}
            title={artist.autor}
            image={getImageUrl(artist.url_autor) || 'https://via.placeholder.com/150'}
            onClick={(id) => navigate(`/artists/${id}`)}
          />
        ))}
      </div>
    </div>
  );
};
