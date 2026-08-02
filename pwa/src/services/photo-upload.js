import { getSetting } from './db.js';

export async function compressImage(file, maxWidth = 1200) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (maxWidth / w) * h; w = maxWidth; }
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.85);
    };
    img.src = URL.createObjectURL(file);
  });
}

export async function uploadPhoto(file) {
  const workerUrl = await getSetting('workerUrl');
  const secret = await getSetting('sharedSecret');
  if (!workerUrl || !secret) throw new Error('Worker not configured');

  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append('photo', compressed, file.name);

  const res = await fetch(workerUrl + '/api/upload/photo', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${secret}` },
    body: formData,
  });
  if (!res.ok) throw new Error('Upload failed');
  const data = await res.json();
  return data.url; // GitHub Release Asset download URL
}
