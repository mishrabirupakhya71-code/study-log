import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getDailyLog } from '../services/db.js';
import { getToday, formatTime } from '../utils/time.js';

const EVENT_LABELS = {
  exit_home: { emoji: '🏠', text: 'Departed Home' },
  enter_college: { emoji: '🏫', text: 'Arrived College' },
  exit_college: { emoji: '🏫', text: 'Departed College' },
  enter_home: { emoji: '🏠', text: 'Arrived Home' },
};

export function LocationLog() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    getDailyLog(getToday()).then(log => { if (log?.locationEvents) setEvents(log.locationEvents); });
  }, []);

  if (events.length === 0) return null;

  return (
    <div class="location-log">
      <h3 class="section-title">🚶 Today's Commute</h3>
      <div class="location-timeline">
        {events.map((e, i) => {
          const label = EVENT_LABELS[e.event] || { emoji: '📍', text: e.event };
          return (
            <div class="location-event" key={i}>
              <span class="event-time">{formatTime(e.timestamp)}</span>
              <div class="event-dot" />
              <span class="event-text">{label.emoji} {label.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
