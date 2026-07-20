import { createContext, useState, useContext, useRef, useEffect, type ReactNode } from 'react';
import type { Song } from '../components/ui/SongList';

interface PlayerContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  playSong: (song: Song) => void;
  togglePlay: () => void;
  seek: (percent: number) => void;
  setVolume: (val: number) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    
    const audio = audioRef.current;
    
    const handleTimeUpdate = () => {
      if (audio.duration) {
        setProgress((audio.currentTime / audio.duration) * 100);
      }
    };
    
    const handleLoadedMetadata = () => {
      setDuration(audio.duration * 1000); // ms
    };
    
    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      // Aquí se llamaría a 'playNext' si hubiera una cola
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  const playSong = (song: Song) => {
    setCurrentSong(song);
    if (audioRef.current) {
      // Como estamos trabajando con R2, la url es el fileKey. 
      // El endpoint de streaming es /stream/:key
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';
      const streamUrl = `${API_URL}/stream/${song.url}`;
      audioRef.current.src = streamUrl;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error('Playback error:', e));
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentSong) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(e => console.error('Playback error:', e));
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (percent: number) => {
    if (audioRef.current && audioRef.current.duration) {
      const time = (percent / 100) * audioRef.current.duration;
      audioRef.current.currentTime = time;
      setProgress(percent);
    }
  };

  const setVolume = (val: number) => {
    if (audioRef.current) {
      audioRef.current.volume = val;
      setVolumeState(val);
    }
  };

  return (
    <PlayerContext.Provider value={{
      currentSong,
      isPlaying,
      progress,
      duration,
      volume,
      playSong,
      togglePlay,
      seek,
      setVolume
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
};
