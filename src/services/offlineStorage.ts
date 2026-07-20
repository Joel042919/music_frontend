import { openDB } from 'idb';
import type { Song } from '../components/ui/SongList';

const DB_NAME = 'music-pwa-db';
const STORE_NAME = 'downloaded_songs';

export async function initDB() {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    },
  });
}

// Guarda la metadata de la canción
export async function saveSongMetadata(song: Song) {
  const db = await initDB();
  await db.put(STORE_NAME, song);
}

// Obtiene todas las canciones guardadas
export async function getDownloadedSongs(): Promise<Song[]> {
  const db = await initDB();
  return db.getAll(STORE_NAME);
}

// Función auxiliar para limpiar cabeceras problemáticas (como Vary) que evitan que el caché coincida
async function storeInCacheCleanly(cache: Cache, url: string, response: Response) {
  const headers = new Headers(response.headers);
  headers.delete('vary');
  // Se crea una nueva respuesta limpia sin la cabecera Vary
  const cleanResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
  await cache.put(url, cleanResponse);
}

// Descarga y guarda en Cache API usando presigned url directa para evadir problemas de CORS por redirección
export async function downloadAudioFile(_url: string, streamEndpoint: string) {
  const cache = await caches.open('music-pwa-media');
  
  // Revisamos si ya existe (ignorando Vary por si acaso)
  const existingRes = await cache.match(streamEndpoint, { ignoreVary: true });
  if (existingRes) return; // Ya descargado

  // 1. Obtenemos URL firmada real
  const presignedRes = await fetch(`http://localhost:8787/api/get-download-url?key=${_url}`);
  if (!presignedRes.ok) throw new Error('No se pudo obtener URL de descarga');
  const { url: realUrl } = await presignedRes.json();

  // 2. Fetch directo a R2 (evita Origin: null por redirección cruzada)
  const response = await fetch(realUrl);
  if (response.ok) {
    // 3. Guardamos en cache limpio
    await storeInCacheCleanly(cache, streamEndpoint, response);
  } else {
    throw new Error('No se pudo descargar el archivo de audio');
  }
}

// Función orquestadora para la descarga
export async function downloadSong(song: Song) {
  const streamEndpoint = `http://localhost:8787/stream/${song.url}`;
  
  // 1. Guardamos archivo de audio en Cache API
  await downloadAudioFile(song.url, streamEndpoint);
  
  // 2. Guardamos imagen en Cache API (usando la misma estrategia para evadir CORS si aplica)
  if (song.url_imagen_album) {
    const isExternal = song.url_imagen_album.startsWith('http');
    const imageEndpoint = isExternal ? song.url_imagen_album : `http://localhost:8787/stream/${song.url_imagen_album}`;
      
    const imageCache = await caches.open('music-pwa-media');
    
    // Si ya existe, omitir
    const existingImg = await imageCache.match(imageEndpoint, { ignoreVary: true });
    if (!existingImg) {
      if (isExternal) {
        const imgRes = await fetch(song.url_imagen_album);
        if (imgRes.ok) await storeInCacheCleanly(imageCache, imageEndpoint, imgRes);
      } else {
        // Obtener url firmada de la imagen
        const presignedImgRes = await fetch(`http://localhost:8787/api/get-download-url?key=${song.url_imagen_album}`);
        if (presignedImgRes.ok) {
          const { url: realImgUrl } = await presignedImgRes.json();
          const imgRes = await fetch(realImgUrl);
          if (imgRes.ok) await storeInCacheCleanly(imageCache, imageEndpoint, imgRes);
        }
      }
    }
  }

  // 3. Guardamos metadata en IndexedDB
  await saveSongMetadata(song);
}

// Función para actualizar metadata offline
export async function updateSongMetadata(song: Song) {
  const db = await initDB();
  await db.put(STORE_NAME, song);
}

// Función para eliminar canción descargada
export async function deleteDownloadedSong(songId: string, songUrl: string, imgUrl: string) {
  // Eliminar de IDB
  const db = await initDB();
  await db.delete(STORE_NAME, songId);

  // Eliminar de Cache API
  const streamEndpoint = `http://localhost:8787/stream/${songUrl}`;
  const mediaCache = await caches.open('music-pwa-media');
  await mediaCache.delete(streamEndpoint);

  // Eliminar imagen del cache
  if (imgUrl) {
    const imageEndpoint = imgUrl.startsWith('http') ? imgUrl : `http://localhost:8787/stream/${imgUrl}`;
    await mediaCache.delete(imageEndpoint);
  }
}
