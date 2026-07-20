import React, { useState, useEffect } from 'react';
import { uploadToR2 } from '../services/r2Upload';
import './Grid.css';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : 'http://localhost:8787/api';

export const Uploads: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'music' | 'author' | 'album'>('music');

  return (
    <div className="page-padding">
      <h2 className="section-title">Subidas y Creación</h2>
      
      <div className="tabs" style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <button 
          onClick={() => setActiveTab('music')}
          style={{ padding: '8px 16px', background: activeTab === 'music' ? 'var(--primary)' : 'transparent', border: '1px solid var(--primary)', borderRadius: '20px', color: 'white', cursor: 'pointer' }}
        >Subir Música</button>
        <button 
          onClick={() => setActiveTab('author')}
          style={{ padding: '8px 16px', background: activeTab === 'author' ? 'var(--primary)' : 'transparent', border: '1px solid var(--primary)', borderRadius: '20px', color: 'white', cursor: 'pointer' }}
        >Nuevo Autor</button>
        <button 
          onClick={() => setActiveTab('album')}
          style={{ padding: '8px 16px', background: activeTab === 'album' ? 'var(--primary)' : 'transparent', border: '1px solid var(--primary)', borderRadius: '20px', color: 'white', cursor: 'pointer' }}
        >Nuevo Álbum</button>
      </div>

      <div className="card glass" style={{ maxWidth: '600px', padding: '24px' }}>
        {activeTab === 'music' && <UploadMusicForm />}
        {activeTab === 'author' && <CreateAuthorForm />}
        {activeTab === 'album' && <CreateAlbumForm />}
      </div>
    </div>
  );
};

// --- FORMULARIO DE MÚSICA ---
const UploadMusicForm = () => {
  const [name, setName] = useState('');
  const [autorId, setAutorId] = useState(''); 
  const [albumId, setAlbumId] = useState(''); 
  const [genreId, setGenreId] = useState('');
  const [tipo, setTipo] = useState('pista');
  const [lyrics, setLyrics] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Listas para los selects
  const [autores, setAutores] = useState<any[]>([]);
  const [albumes, setAlbumes] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);

  useEffect(() => {
    const fetchSelects = async () => {
      try {
        const [resAutores, resAlbumes, resGenres] = await Promise.all([
          fetch(`${API_URL}/artists`),
          fetch(`${API_URL}/albums`),
          fetch(`${API_URL}/genres`)
        ]);
        if (resAutores.ok) setAutores(await resAutores.json());
        if (resAlbumes.ok) setAlbumes(await resAlbumes.json());
        if (resGenres.ok) setGenres(await resGenres.json());
      } catch (err) {
        console.error("Error cargando listas:", err);
      }
    };
    fetchSelects();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !imageFile || !name || !autorId || !albumId) {
      setMessage('Por favor, completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    setMessage('Subiendo archivos a R2...');

    try {
      // Subir imagen de la canción a la carpeta "song"
      const imageKey = await uploadToR2(imageFile, 'song');
      
      // Subir MP3 a la carpeta "music"
      const audioKey = await uploadToR2(audioFile, 'music');

      let parsedLyrics = null;
      if (lyrics.trim() !== '') {
        try {
          parsedLyrics = JSON.parse(lyrics);
        } catch (e) {
          throw new Error('El formato de los Lyrics JSON es inválido.');
        }
      }

      setMessage('Guardando metadata en Base de Datos...');
      const dbRes = await fetch(`${API_URL}/music`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          autor: autorId,
          album: albumId,
          genre_id: genreId || null,
          duration: 180000, 
          url: audioKey,
          url_imagen_album: imageKey,
          tipo: tipo,
          lyrics: parsedLyrics
        }),
      });

      const dbData = await dbRes.json();
      if (!dbRes.ok) throw new Error(dbData.error);

      setMessage('¡Música subida exitosamente!');
      setName('');
      setAutorId('');
      setAlbumId('');
      setGenreId('');
      setTipo('pista');
      setLyrics('');
      setImageFile(null);
      setAudioFile(null);
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3>Subir Pista de Audio</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Nombre de la Canción</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '8px' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Autor</label>
        <select value={autorId} onChange={e => setAutorId(e.target.value)} required style={{ padding: '8px', background: '#222', color: 'white' }}>
          <option value="">Selecciona un Autor</option>
          {autores.map(a => <option key={a.id} value={a.id}>{a.autor}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Álbum</label>
        <select value={albumId} onChange={e => setAlbumId(e.target.value)} required style={{ padding: '8px', background: '#222', color: 'white' }}>
          <option value="">Selecciona un Álbum</option>
          {albumes.map(a => <option key={a.id} value={a.id}>{a.album}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Género (Opcional)</label>
        <select value={genreId} onChange={e => setGenreId(e.target.value)} style={{ padding: '8px', background: '#222', color: 'white' }}>
          <option value="">Sin Género</option>
          {genres.map(g => <option key={g.id} value={g.id}>{g.genre}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Tipo</label>
        <select value={tipo} onChange={e => setTipo(e.target.value)} required style={{ padding: '8px', background: '#222', color: 'white' }}>
          <option value="original" selected>Original</option>
          <option value="pista">Pista</option>
          <option value="remix">Remix</option>
          <option value="live">En Vivo</option>
          <option value="cover">Cover</option>
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Lyrics (JSON Opcional)</label>
        <textarea 
          value={lyrics} 
          onChange={e => setLyrics(e.target.value)} 
          placeholder='[{"time": 0, "text": "Intro..."}]' 
          style={{ padding: '8px', minHeight: '80px', background: '#222', color: 'white' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Imagen de la Canción (Portada)</label>
        <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} required />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Archivo MP3</label>
        <input type="file" accept="audio/mpeg" onChange={e => setAudioFile(e.target.files?.[0] || null)} required />
      </div>

      <button type="submit" disabled={loading} style={{ padding: '12px', background: 'var(--primary)', border: 'none', borderRadius: '24px', fontWeight: 'bold', marginTop: '16px', color: 'white', cursor: 'pointer' }}>
        {loading ? 'Procesando...' : 'Subir Canción'}
      </button>
      {message && <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{message}</div>}
    </form>
  );
}

// --- FORMULARIO DE AUTOR ---
const CreateAuthorForm = () => {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return;

    setLoading(true);
    try {
      setMessage('Subiendo imagen a R2...');
      const fileKey = await uploadToR2(file, 'autores');

      setMessage('Guardando en Base de Datos...');
      const res = await fetch(`${API_URL}/autores`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autor: name, url_autor: fileKey })
      });

      if (!res.ok) throw new Error('Error guardando el autor en la base de datos');

      setMessage('¡Autor creado exitosamente!');
      setName('');
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3>Crear Nuevo Autor</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Nombre del Autor</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '8px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Foto de Perfil</label>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} required />
      </div>
      <button type="submit" disabled={loading} style={{ padding: '12px', background: 'var(--primary)', border: 'none', borderRadius: '24px', fontWeight: 'bold', marginTop: '16px', color: 'white', cursor: 'pointer' }}>
        {loading ? 'Procesando...' : 'Crear Autor'}
      </button>
      {message && <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{message}</div>}
    </form>
  );
}

// --- FORMULARIO DE ÁLBUM ---
const CreateAlbumForm = () => {
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return;

    setLoading(true);
    try {
      setMessage('Subiendo portada a R2...');
      const fileKey = await uploadToR2(file, 'albums');

      setMessage('Guardando en Base de Datos...');
      const res = await fetch(`${API_URL}/albumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ album: name, url_album: fileKey })
      });

      if (!res.ok) throw new Error('Error guardando el álbum en la base de datos');

      setMessage('¡Álbum creado exitosamente!');
      setName('');
      setFile(null);
    } catch (err: any) {
      console.error(err);
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h3>Crear Nuevo Álbum</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Nombre del Álbum</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required style={{ padding: '8px' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <label>Foto de Portada</label>
        <input type="file" accept="image/*" onChange={e => setFile(e.target.files?.[0] || null)} required />
      </div>
      <button type="submit" disabled={loading} style={{ padding: '12px', background: 'var(--primary)', border: 'none', borderRadius: '24px', fontWeight: 'bold', marginTop: '16px', color: 'white', cursor: 'pointer' }}>
        {loading ? 'Procesando...' : 'Crear Álbum'}
      </button>
      {message && <div style={{ marginTop: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{message}</div>}
    </form>
  );
}
