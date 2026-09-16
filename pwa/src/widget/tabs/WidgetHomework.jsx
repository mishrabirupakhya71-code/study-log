/**
 * Widget Homework Tab
 * Adapted from pages/Homework.jsx — uses widget-db
 */

import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getAllHomework, addHomework, updateHomework, deleteHomework, getAllSubjects, addToSyncQueue } from '../widget-db.js';
import { getToday } from '../../utils/time.js';

const FILTER_TABS = ['all', 'pending', 'completed', 'overdue'];

export function WidgetHomework() {
  const [homework, setHomework] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [showAdd, setShowAdd] = useState(false);
  const [newHw, setNewHw] = useState({ title: '', subjectId: '', dueDate: '', notes: '' });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [hw, subs] = await Promise.all([getAllHomework(), getAllSubjects()]);
    setHomework(hw);
    setSubjects(subs);
  }

  function getFiltered() {
    const today = getToday();
    return homework.filter(hw => {
      if (filter === 'pending') return !hw.completed;
      if (filter === 'completed') return hw.completed;
      if (filter === 'overdue') return !hw.completed && hw.dueDate < today;
      return true;
    }).sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return (a.dueDate || '').localeCompare(b.dueDate || '');
    });
  }

  async function handleAdd() {
    if (!newHw.title.trim()) return;
    const subject = subjects.find(s => s.id == newHw.subjectId);
    const hw = {
      title: newHw.title.trim(),
      subjectId: newHw.subjectId || null,
      subjectName: subject?.name || 'General',
      subjectColor: subject?.color || '#888',
      dueDate: newHw.dueDate || null,
      notes: newHw.notes || '',
      completed: false,
      createdAt: new Date().toISOString(),
    };
    await addHomework(hw);
    await addToSyncQueue('assignment', hw);
    setNewHw({ title: '', subjectId: '', dueDate: '', notes: '' });
    setShowAdd(false);
    loadData();
  }

  async function handleToggle(hw) {
    hw.completed = !hw.completed;
    hw.completedAt = hw.completed ? new Date().toISOString() : null;
    await updateHomework(hw);
    loadData();
  }

  async function handleDelete(id) {
    await deleteHomework(id);
    loadData();
  }

  const filtered = getFiltered();
  const today = getToday();
  const pendingCount = homework.filter(h => !h.completed).length;
  const overdueCount = homework.filter(h => !h.completed && h.dueDate && h.dueDate < today).length;

  return (
    <div class="ss-tab-content ss-homework">
      <div class="ss-hw-stats">
        <div class="ss-hw-stat"><span class="ss-hw-stat-value">{pendingCount}</span><span class="ss-hw-stat-label">Pending</span></div>
        <div class="ss-hw-stat ss-hw-stat-overdue"><span class="ss-hw-stat-value">{overdueCount}</span><span class="ss-hw-stat-label">Overdue</span></div>
      </div>

      <div class="ss-filter-tabs">
        {FILTER_TABS.map(f => (
          <button key={f} class={`ss-filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      <button class="ss-btn ss-btn-primary ss-btn-block" onClick={() => setShowAdd(!showAdd)}>+ Add Assignment</button>

      {showAdd && (
        <div class="ss-hw-form">
          <input class="ss-input" placeholder="Assignment title" value={newHw.title} onInput={e => setNewHw({ ...newHw, title: e.target.value })} autoFocus />
          <select class="ss-input ss-select" value={newHw.subjectId} onChange={e => setNewHw({ ...newHw, subjectId: e.target.value })}>
            <option value="">General</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input class="ss-input" type="date" value={newHw.dueDate} onInput={e => setNewHw({ ...newHw, dueDate: e.target.value })} />
          <textarea class="ss-input ss-textarea" placeholder="Notes (optional)" value={newHw.notes} onInput={e => setNewHw({ ...newHw, notes: e.target.value })} rows={2} />
          <div class="ss-modal-actions">
            <button class="ss-btn ss-btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button class="ss-btn ss-btn-primary" onClick={handleAdd} disabled={!newHw.title.trim()}>Save</button>
          </div>
        </div>
      )}

      <div class="ss-hw-list">
        {filtered.map(hw => {
          const isOverdue = !hw.completed && hw.dueDate && hw.dueDate < today;
          return (
            <div class={`ss-hw-card ${hw.completed ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`} key={hw.id}>
              <button class={`ss-hw-check ${hw.completed ? 'checked' : ''}`} onClick={() => handleToggle(hw)}>{hw.completed ? '✓' : ''}</button>
              <div class="ss-hw-info">
                <span class="ss-hw-title">{hw.title}</span>
                <div class="ss-hw-meta">
                  <span class="ss-subject-tag ss-subject-tag-sm" style={{ backgroundColor: hw.subjectColor }}>{hw.subjectName}</span>
                  {hw.dueDate && <span class={`ss-hw-due ${isOverdue ? 'overdue' : ''}`}>{isOverdue ? '⚠️' : '📅'} {new Date(hw.dueDate + 'T00:00').toLocaleDateString()}</span>}
                </div>
              </div>
              <button class="ss-btn-icon ss-btn-delete" onClick={() => handleDelete(hw.id)}>🗑</button>
            </div>
          );
        })}
        {filtered.length === 0 && <div class="ss-empty-state">{filter === 'pending' ? '🎉 All done!' : `No ${filter} assignments`}</div>}
      </div>
    </div>
  );
}
