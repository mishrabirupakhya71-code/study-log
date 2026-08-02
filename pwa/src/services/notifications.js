export async function requestPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

export function showNotification(title, body, tag) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, { body, tag, icon: '/icon-192.png', badge: '/icon-192.png' });
}

export async function checkDueAssignments(homework) {
  const now = new Date();
  const twoDaysFromNow = new Date(now.getTime() + 2 * 86400000);
  const dueSoon = homework.filter(hw => {
    if (hw.status === 'completed') return false;
    const due = new Date(hw.dueDate);
    return due <= twoDaysFromNow && due >= now;
  });
  for (const hw of dueSoon) {
    const daysLeft = Math.ceil((new Date(hw.dueDate) - now) / 86400000);
    showNotification(
      `📚 ${hw.title}`,
      daysLeft === 0 ? 'Due today!' : `Due in ${daysLeft} day${daysLeft > 1 ? 's' : ''}`,
      `hw-${hw.id}`
    );
  }
}
