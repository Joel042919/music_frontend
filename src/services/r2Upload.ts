const ROOT_URL = 'http://localhost:8787';

/**
 * Obtiene una URL firmada y sube el archivo a Cloudflare R2
 * @param file Archivo a subir
 * @param folder Carpeta en R2 (opcional, ej: 'autores' o 'albums')
 * @returns El fileKey único con el que se guardó en R2
 */
export async function uploadToR2(file: File, folder?: string): Promise<string> {
  let url = `${ROOT_URL}/get-presigned-url?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`;
  if (folder) {
    url += `&folder=${encodeURIComponent(folder)}`;
  }

  const presignedRes = await fetch(url);
  const presignedData = await presignedRes.json();

  if (!presignedRes.ok) {
    throw new Error(presignedData.error || 'Error al obtener la URL firmada');
  }

  const { uploadUrl, fileKey } = presignedData;

  const r2Res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!r2Res.ok) {
    throw new Error('Error al subir el archivo a R2');
  }

  return fileKey;
}
