const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8787';

export const getImageUrl = (key: string) => {
  if (!key) return '';
  if (key.startsWith('http')) return key;
  return `${API_URL}/stream/${key}`;
};
