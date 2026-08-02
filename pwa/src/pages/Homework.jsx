import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getAllHomework, addHomework, updateHomework, deleteHomework, getAllSubjects } from '../services/db.js';
import { daysUntil } from '../utils/time.js';

export function Homework() {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('pending');
  const [form, setForm] = useState({ title: '', subject: '', dueDate: '', priority: 'medium', description: '' });

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setAssignments(await getAllHomework());
    setSubjects(await getAllSubjects());
  }

  async function handleAdd() {
    if (!form.title.trim() || !form.dueDate) return;
    await addHomework({ ...form, source: 'manual' });
    setForm({ title: '', subject: '', dueDate: '', priority: 'medium', description: '' });
    setShowAdd(false);
    loadData();
  }

  async function toggleComplete(hw) {
    await updateHomework({ ...hw, status: hw.status === 'completed' ? 'pending' : 'completed' });
    loadData();
  }

  async function handleDelete(id) {
    await deleteHomework(id);
    loadData();
  }

  const filtered = assignments.filter(a => filter === 'all' ? true : a.status === filter)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
  const priorityColors = { high: '#FF6B6B', medium: '#FFEAA7', low: '#82E0AA' };

  return (
    <div class="page homework-page">
      <header class="page-header">
        <h1>📚 Homework</h1>
        <button class="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Add</button>
      </header>
      <div class="filter-tabs">
        {['pending', 'completed', 'all'].map(f => (
          <button class={`filter-tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)} key={f}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>
      {showAdd && (
        <div class="add-form card">
          <input class="input" placeholder="Assignment title" value={form.title} onInput={e => setForm({...form, title: e.target.value})} />
          <select class="input" value={form.subject} onInput={e => setForm({...form, subject: e.target.value})}>
            <option value="">Select subject</option>
            {subjects.map(s => <option value={s.name} key={s.id}>{s.name}</option>)}
          </select>
          <input class="input" type="date" value={form.dueDate} onInput={e => setForm({...form, dueDate: e.target.value})} />
          <select class="input" value={form.priority} onInput={e => setForm({...form, priority: e.target.value})}>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
          <textarea class="input textarea" placeholder="Description (optional)" value={form.description} onInput={e => setForm({...form, description: e.target.value})} />
          <div class="form-actions">
            <button class="btn btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            <button class="btn btn-primary" onClick={handleAdd}>Save</button>
          </div>
        </div>
      )}
      <div class="assignment-list">
        {filtered.map(hw => {
          const days = daysUntil(hw.dueDate);
          const isOverdue = days < 0 && hw.status !== 'completed';
          const isUrgent = days >= 0 && days <= 2 && hw.status !== 'completed';
          return (
            <div class={`assignment-card card ${hw.status === 'completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`} key={hw.id}>
              <div class="hw-left">
                <button class={`check-btn ${hw.status === 'completed' ? 'checked' : ''}`} onClick={() => toggleComplete(hw)}>
                  {hw.status === 'completed' ? '✅' : '⬜'}
                </button>
              </div>
              <div class="hw-content">
                <div class="hw-title">{hw.title}</div>
                <div class="hw-meta">
                  {hw.subject && <span class="hw-subject">{hw.subject}</span>}
                  <span class="hw-priority" style={{color: priorityColors[hw.priority]}}>●</span>
                </div>
              </div>
              <div class="hw-right">
                <span class={`hw-due ${isOverdue ? 'overdue' : ''} ${isUrgent ? 'urgent' : ''}`}>
                  {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today!' : `${days}d left`}
                </span>
                <button class="btn-icon btn-delete" onClick={() => handleDelete(hw.id)}>🗑</button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <div class="empty-state">No assignments {filter !== 'all' ? `(${filter})` : ''}</div>}
      </div>
    </div>
  );
}
