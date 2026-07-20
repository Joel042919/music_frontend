import React from 'react';
import { Play, MoreHorizontal, Volume2, CheckCircle } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUrl';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { usePlayer } from '../../context/PlayerContext';
import { getDownloadedSongs } from '../../services/offlineStorage';
import './SongList.css';

export interface Song {
  id: string;
  name: string;
  duration: number;
  url: string;
  url_imagen_album: string;
  artist_name?: string;
  album_name?: string;
}

interface SongListProps {
  songs: Song[];
  onPlay: (song: Song) => void;
  onDownload?: (song: Song) => void;
}

const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const SongList: React.FC<SongListProps> = ({ songs, onPlay, onDownload }) => {
  const [dropdownOpenId, setDropdownOpenId] = React.useState<string | null>(null);
  const [selectedSongForPlaylist, setSelectedSongForPlaylist] = React.useState<Song | null>(null);
  const [downloadedIds, setDownloadedIds] = React.useState<Set<string>>(new Set());
  
  const { currentSong } = usePlayer();

  // Cierra el menú al hacer clic en cualquier lado de la pantalla
  React.useEffect(() => {
    const closeDropdown = () => setDropdownOpenId(null);
    document.addEventListener('click', closeDropdown);
    return () => document.removeEventListener('click', closeDropdown);
  }, []);

  // Cargar IDs de canciones descargadas
  React.useEffect(() => {
    getDownloadedSongs().then(dSongs => {
      setDownloadedIds(new Set(dSongs.map(s => s.id)));
    }).catch(console.error);
  }, [songs]);

  return (
    <>
      <div className="song-list">
        <div className="song-list-header">
          <div className="col-index">#</div>
          <div className="col-title">Título</div>
          <div className="col-album">Álbum</div>
          <div className="col-duration">Duración</div>
          <div className="col-actions"></div>
        </div>
        
        <div className="song-list-body">
          {songs.map((song, index) => {
            const isCurrent = currentSong?.id === song.id;
            const isDownloaded = downloadedIds.has(song.id);
            
            return (
            <div key={song.id} className={`song-row ${isCurrent ? 'active' : ''}`} onDoubleClick={() => onPlay(song)}>
              <div className="col-index">
                {isCurrent ? (
                  <span className="index-num playing-indicator"><Volume2 size={16} color="#1db954" /></span>
                ) : (
                  <span className="index-num">{index + 1}</span>
                )}
                <button className="play-btn" onClick={() => onPlay(song)}>
                  <Play size={16} fill="currentColor" />
                </button>
              </div>
              
              <div className="col-title">
                <img src={getImageUrl(song.url_imagen_album)} alt={song.name} className="song-thumb" />
                <div className="song-info">
                  <span className="song-name" style={{ color: isCurrent ? '#1db954' : '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {song.name}
                    {isDownloaded && <span title="Descargada" style={{ display: 'flex' }}><CheckCircle size={14} color="#1db954" /></span>}
                  </span>
                  <span className="song-artist">{song.artist_name || 'Desconocido'}</span>
                </div>
              </div>
              
              <div className="col-album">
                {song.album_name || '-'}
              </div>
              
              <div className="col-duration">
                {formatDuration(song.duration)}
              </div>
              
              <div className="col-actions" style={{ position: 'relative' }}>
                <button 
                  className="action-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownOpenId(dropdownOpenId === song.id ? null : song.id);
                  }}
                >
                  <MoreHorizontal size={18} />
                </button>

                {dropdownOpenId === song.id && (
                  <div className="dropdown-menu glass" style={{
                    position: 'absolute',
                    right: '100%',
                    top: 0,
                    zIndex: 100,
                    padding: '8px',
                    borderRadius: '8px',
                    minWidth: '150px'
                  }}>
                    {onDownload && (
                      <button 
                        className="dropdown-item" 
                        style={{width: '100%', padding: '8px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDropdownOpenId(null);
                          onDownload(song);
                        }}
                      >
                        Descargar
                      </button>
                    )}
                    <button 
                      className="dropdown-item" 
                      style={{width: '100%', padding: '8px', textAlign: 'left', background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownOpenId(null);
                        setSelectedSongForPlaylist(song);
                      }}
                    >
                      Agregar a Playlist
                    </button>
                  </div>
                )}
              </div>
            </div>
            );
          })}
        </div>
      </div>
      
      {selectedSongForPlaylist && (
        <AddToPlaylistModal 
          isOpen={!!selectedSongForPlaylist} 
          onClose={() => setSelectedSongForPlaylist(null)} 
          song={selectedSongForPlaylist} 
        />
      )}
    </>
  );
};
