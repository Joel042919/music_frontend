import React, { useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Heart } from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { getImageUrl } from '../../utils/imageUrl';
import './BottomPlayer.css';

const formatDuration = (ms: number) => {
  if (!ms) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export const BottomPlayer: React.FC = () => {
  const { currentSong, isPlaying, progress, duration, togglePlay, seek, volume, setVolume } = usePlayer();
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
      seek(percent);
    }
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (volumeRef.current) {
      const rect = volumeRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percent = Math.max(0, Math.min(1, clickX / rect.width));
      setVolume(percent);
    }
  };

  return (
    <div className="bottom-player glass">
      <div className="player-now-playing">
        {currentSong ? (
          <>
            <img 
              src={getImageUrl(currentSong.url_imagen_album) || 'https://via.placeholder.com/50'} 
              alt={currentSong.name} 
              className="album-art"
            />
            <div className="track-info">
              <div className="track-name">{currentSong.name}</div>
              <div className="track-artist">{currentSong.artist_name || 'Desconocido'}</div>
            </div>
            <button className="btn-icon like-btn"><Heart size={18} /></button>
          </>
        ) : (
          <div className="track-info">
            <div className="track-name" style={{ color: 'var(--text-secondary)' }}>Sin reproducir</div>
          </div>
        )}
      </div>

      <div className="player-controls-container">
        <div className="player-controls">
          <button className="btn-icon" disabled={!currentSong}><Shuffle size={18} /></button>
          <button className="btn-icon" disabled={!currentSong}><SkipBack size={22} /></button>
          <button className="btn-play" onClick={togglePlay} disabled={!currentSong}>
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
          </button>
          <button className="btn-icon" disabled={!currentSong}><SkipForward size={22} /></button>
          <button className="btn-icon active" disabled={!currentSong}><Repeat size={18} /></button>
        </div>
        
        <div className="player-progress">
          <span className="time">{formatDuration((progress / 100) * duration)}</span>
          <div className="progress-bar" ref={progressRef} onClick={handleProgressClick}>
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
            <div className="progress-handle" style={{ left: `${progress}%` }}></div>
          </div>
          <span className="time">{formatDuration(duration)}</span>
        </div>
      </div>

      <div className="player-options">
        <Volume2 size={18} className="volume-icon" />
        <div className="volume-bar" ref={volumeRef} onClick={handleVolumeClick}>
          <div className="volume-fill" style={{ width: `${volume * 100}%` }}></div>
        </div>
      </div>
    </div>
  );
};
