import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getSetting, setSetting } from '../services/db.js';

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeeklyPlanner() {
  const [schedule, setSchedule] = useState({});
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    getSetting('weeklySchedule').then(s => { if (s) setSchedule(s); });
  }, []);
  function toggleBlock(day, hour) {
    const key = `${day}-${hour}`;
    setSchedule(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }
  async function handleSave() {
    await setSetting('weeklySchedule', schedule);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }
  return (
    <div class="weekly-planner">
      <div class="section-header">
        <h3 class="section-title">🔒 Study Lockdown Schedule</h3>
        <button class="btn btn-primary btn-sm" onClick={handleSave}>{saved ? '✓ Saved!' : 'Save'}</button>
      </div>
      <p class="card-desc">Tap to select study hours. Blocked apps will be locked during these times.</p>
      <div class="planner-grid">
        <div class="planner-header">
          <div class="planner-label" />
          {HOURS.filter(h => h >= 6 && h <= 23).map(h => (
            <div class="planner-hour-label" key={h}>{h}</div>
          ))}
        </div>
        {DAYS_OF_WEEK.map(day => (
          <div class="planner-row" key={day}>
            <div class="planner-label">{day.slice(0, 3)}</div>
            {HOURS.filter(h => h >= 6 && h <= 23).map(h => (
              <div key={h}
                class={`planner-cell ${schedule[`${day}-${h}`] ? 'active' : ''}`}
                onClick={() => toggleBlock(day, h)} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
