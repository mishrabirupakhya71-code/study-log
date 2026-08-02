import { h } from 'preact';
import { todayMinutes } from '../store/state.js';
import { StudyTimer } from '../components/StudyTimer.jsx';
import { StreakBoard } from '../components/StreakBoard.jsx';
import { StudyCalendar } from '../components/StudyCalendar.jsx';
import { GoalProgress } from '../components/GoalProgress.jsx';
import { DdayCounter } from '../components/DdayCounter.jsx';
import { LocationLog } from '../components/LocationLog.jsx';
import { formatDuration } from '../utils/time.js';

export function Dashboard() {
  return (
    <div class="page dashboard">
      <header class="page-header">
        <h1 class="app-title">StudySync</h1>
        <div class="today-total">
          <span class="today-label">Today</span>
          <span class="today-value">{formatDuration(todayMinutes.value * 60000)}</span>
        </div>
      </header>
      <StreakBoard />
      <StudyTimer />
      <GoalProgress />
      <LocationLog />
      <StudyCalendar />
      <DdayCounter />
    </div>
  );
}
