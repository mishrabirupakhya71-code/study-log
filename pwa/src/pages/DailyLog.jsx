import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getDailyLog, getSessionsByDate, updateDailyLog } from '../services/db.js';
import { getToday, formatTime, formatDuration } from '../utils/time.js';

const EVENT_LABELS = {
  exit_home: '🏠 Departed Home',
  enter_college: '🏫 Arrived College',
  exit_college: '🏫 Departed College',
  enter_home: '🏠 Arrived Home',
};

export function DailyLog() {
  const [log, setLog] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(getToday());

  useEffect(() => { loadLog(date); }, [date]);

  async function loadLog(d) {
    const logData = await getDailyLog(d);
    setLog(logData);
    setNotes(logData?.notes || '');
    setSessions(await getSessionsByDate(d));
  }

  async function saveNotes() {
    const existing = (await getDailyLog(date)) || { date, locationEvents: [], photos: [] };
    await updateDailyLog({ ...existing, notes });
  }

  const totalMs = sessions.reduce((sum, s) => sum + s.duration, 0);

  return (
    <div class="page daily-log-page">
      <header class="page-header">
        <h1>📋 Daily Log</h1>
        <input class="input date-pick" type="date" value={date} onInput={e => setDate(e.target.value)} />
      </header>
      <div class="card">
        <h3 class="card-title">🚶 Location Log</h3>
        {log?.locationEvents?.length > 0 ? (
          <div class="log-events">
            {log.locationEvents.map((e, i) => (
              <div class="log-event" key={i}>
                <span class="log-time">{formatTime(e.timestamp)}</span>
                <span class="log-text">{EVENT_LABELS[e.event] || e.event}</span>
              </div>
            ))}
          </div>
        ) : (
          <div class="empty-state">No location events recorded</div>
        )}
      </div>
      <div class="card">
        <h3 class="card-title">📖 Study Sessions</h3>
        {sessions.length > 0 ? (
          <>
            {sessions.map(s => (
              <div class="session-item" key={s.id}>
                <span class="session-dot" style={{backgroundColor: s.subjectColor}} />
                <span class="session-subject">{s.subjectName}</span>
                <span class="session-time">{formatTime(s.startTime)} - {formatTime(s.endTime)}</span>
                <span class="session-duration">{formatDuration(s.duration)}</span>
              </div>
            ))}
            <div class="session-total"><strong>Total: {formatDuration(totalMs)}</strong></div>
          </>
        ) : (
          <div class="empty-state">No study sessions</div>
        )}
      </div>
      <div class="card">
        <h3 class="card-title">📝 Notes</h3>
        <textarea class="input textarea notes-area" placeholder="Write your notes for today..." value={notes} onInput={e => setNotes(e.target.value)} onBlur={saveNotes} rows={4} />
      </div>
    </div>
  );
}
