import { h } from 'preact';
import { daysUntil } from '../utils/time.js';

const priorityColors = { high: '#FF6B6B', medium: '#FFEAA7', low: '#82E0AA' };

export function AssignmentCard({ hw, onToggle, onDelete }) {
  const days = daysUntil(hw.dueDate);
  const isOverdue = days < 0 && hw.status !== 'completed';
  const isUrgent = days >= 0 && days <= 2 && hw.status !== 'completed';
  return (
    <div class={`assignment-card card ${hw.status === 'completed' ? 'completed' : ''} ${isOverdue ? 'overdue' : ''}`}>
      <div class="hw-left">
        <button class={`check-btn ${hw.status === 'completed' ? 'checked' : ''}`} onClick={() => onToggle(hw)}>
          {hw.status === 'completed' ? '✅' : '⬜'}
        </button>
      </div>
      <div class="hw-content">
        <div class="hw-title">{hw.title}</div>
        <div class="hw-meta">
          {hw.subject && <span class="hw-subject">{hw.subject}</span>}
          <span class="hw-priority" style={{ color: priorityColors[hw.priority] }}>●</span>
        </div>
      </div>
      <div class="hw-right">
        <span class={`hw-due ${isOverdue ? 'overdue' : ''} ${isUrgent ? 'urgent' : ''}`}>
          {isOverdue ? `${Math.abs(days)}d overdue` : days === 0 ? 'Today!' : `${days}d left`}
        </span>
        <button class="btn-icon btn-delete" onClick={() => onDelete(hw.id)}>🗑</button>
      </div>
    </div>
  );
}
