import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getAllDdays, addDday, deleteDday } from '../services/db.js';
import { daysUntil } from '../utils/time.js';

export function DdayCounter() {
  const [ddays, setDdays] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');

  useEffect(() => { getAllDdays().then(setDdays); }, []);

  async function handleAdd() {
    if (!title.trim() || !targetDate) return;
    await addDday({ title: title.trim(), targetDate });
    setDdays(await getAllDdays());
    setTitle(''); setTargetDate(''); setShowAdd(false);
  }

  async function handleDelete(id) {
    await deleteDday(id);
    setDdays(await getAllDdays());
  }

  return (
    <div class="dday-counter">
      <div class="section-header">
        <h3 class="section-title">🎯 D-Day</h3>
        <button class="btn-icon" onClick={() => setShowAdd(!showAdd)}>+</button>
      </div>
      {showAdd && (
        <div class="dday-form">
          <input class="input" placeholder="Exam name" value={title} onInput={e => setTitle(e.target.value)} />
          <input class="input" type="date" value={targetDate} onInput={e => setTargetDate(e.target.value)} />
          <button class="btn btn-primary btn-sm" onClick={handleAdd}>Add</button>
        </div>
      )}
      <div class="dday-list">
        {ddays.sort((a, b) => new Date(a.targetDate) - new Date(b.targetDate)).map(d => {
          const days = daysUntil(d.targetDate);
          const isPast = days < 0;
          return (
            <div class={`dday-card ${isPast ? 'past' : ''}`} key={d.id}>
              <div class="dday-info">
                <span class="dday-title">{d.title}</span>
                <span class="dday-date">{new Date(d.targetDate).toLocaleDateString()}</span>
              </div>
              <div class="dday-count">
                <span class={`dday-number ${days <= 7 ? 'urgent' : ''}`}>
                  {isPast ? `D+${Math.abs(days)}` : days === 0 ? 'D-Day!' : `D-${days}`}
                </span>
              </div>
              <button class="btn-icon btn-delete" onClick={() => handleDelete(d.id)}>✕</button>
            </div>
          );
        })}
        {ddays.length === 0 && <div class="empty-state">No exam dates set</div>}
      </div>
    </div>
  );
}
