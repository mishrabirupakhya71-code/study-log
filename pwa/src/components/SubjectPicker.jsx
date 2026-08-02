import { h } from 'preact';
import { useState } from 'preact/hooks';
import { addSubject } from '../services/db.js';

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F1948A', '#82E0AA'];

export function SubjectPicker({ subjects, onSelect, onClose, onSubjectsChange }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  async function handleCreate() {
    if (!newName.trim()) return;
    const id = await addSubject({ name: newName.trim(), color: selectedColor, totalMinutes: 0 });
    const subject = { id, name: newName.trim(), color: selectedColor, totalMinutes: 0 };
    onSubjectsChange([...subjects, subject]);
    onSelect(subject);
  }

  return (
    <div class="modal-overlay" onClick={onClose}>
      <div class="modal" onClick={e => e.stopPropagation()}>
        <div class="modal-header">
          <h3>{isCreating ? 'Create Subject' : 'Select Subject'}</h3>
          <button class="modal-close" onClick={onClose}>✕</button>
        </div>
        {isCreating ? (
          <div class="subject-create">
            <input type="text" class="input" placeholder="Subject name (e.g., Math)" value={newName} onInput={e => setNewName(e.target.value)} autoFocus />
            <div class="color-grid">
              {COLORS.map(c => (<button class={`color-swatch ${c === selectedColor ? 'selected' : ''}`} style={{backgroundColor: c}} onClick={() => setSelectedColor(c)} />))}
            </div>
            <div class="modal-actions">
              <button class="btn btn-secondary" onClick={() => setIsCreating(false)}>Back</button>
              <button class="btn btn-primary" onClick={handleCreate} disabled={!newName.trim()}>Create</button>
            </div>
          </div>
        ) : (
          <div class="subject-list">
            {subjects.map(s => (
              <button class="subject-item" onClick={() => onSelect(s)}>
                <span class="subject-dot" style={{backgroundColor: s.color}} />
                <span class="subject-name">{s.name}</span>
                <span class="subject-time">{Math.round(s.totalMinutes / 60)}h</span>
              </button>
            ))}
            <button class="subject-item add-new" onClick={() => setIsCreating(true)}>
              <span class="subject-dot">+</span>
              <span class="subject-name">New Subject</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
