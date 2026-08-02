import { h } from 'preact';
import { useRef } from 'preact/hooks';

export function PhotoPicker({ onPhoto }) {
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onPhoto({ file, dataUrl: reader.result, name: file.name });
    reader.readAsDataURL(file);
  }

  return (
    <div class="photo-picker">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:'none'}} onChange={handleFile} />
      <input ref={galleryRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile} />
      <button class="btn btn-secondary btn-sm" onClick={() => cameraRef.current.click()}>📷 Camera</button>
      <button class="btn btn-secondary btn-sm" onClick={() => galleryRef.current.click()}>🖼️ Gallery</button>
    </div>
  );
}
