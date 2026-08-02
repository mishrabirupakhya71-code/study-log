import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { getStudyHeatmapData } from '../services/db.js';

function getIntensity(minutes) {
  if (!minutes || minutes === 0) return 0;
  if (minutes < 30) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

const COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export function StudyCalendar() {
  const [weeks, setWeeks] = useState([]);

  useEffect(() => {
    getStudyHeatmapData(140).then(heatmap => {
      const result = [];
      const today = new Date();
      const start = new Date(today);
      start.setDate(start.getDate() - 139);
      start.setDate(start.getDate() - start.getDay());
      let currentWeek = [];
      const d = new Date(start);
      while (d <= today) {
        const dateStr = d.toISOString().split('T')[0];
        currentWeek.push({ date: dateStr, minutes: heatmap[dateStr] || 0, day: d.getDay() });
        if (d.getDay() === 6) { result.push(currentWeek); currentWeek = []; }
        d.setDate(d.getDate() + 1);
      }
      if (currentWeek.length > 0) result.push(currentWeek);
      setWeeks(result);
    });
  }, []);

  return (
    <div class="study-calendar">
      <h3 class="section-title">📅 Study Calendar</h3>
      <div class="heatmap-container">
        <div class="heatmap-days">
          {DAYS.map(d => <div class="heatmap-day-label">{d}</div>)}
        </div>
        <div class="heatmap-grid">
          {weeks.map((week, wi) => (
            <div class="heatmap-week" key={wi}>
              {week.map(cell => (
                <div class="heatmap-cell" style={{backgroundColor: COLORS[getIntensity(cell.minutes)]}} title={`${cell.date}: ${cell.minutes || 0} min`} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div class="heatmap-legend">
        <span>Less</span>
        {COLORS.map(c => <div class="heatmap-cell" style={{backgroundColor: c}} />)}
        <span>More</span>
      </div>
    </div>
  );
}
