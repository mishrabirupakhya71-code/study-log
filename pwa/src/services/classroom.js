import { getSetting, setSetting } from './db.js';
import { addHomework, getAllHomework } from './db.js';

// Requires Google Identity Services script in index.html:
// <script src="https://accounts.google.com/gsi/client" async defer></script>

const SCOPES = 'https://www.googleapis.com/auth/classroom.coursework.me.readonly';

export function initGoogleAuth(clientId, onToken) {
  return new Promise((resolve) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (tokenResponse) => {
        if (tokenResponse && tokenResponse.access_token) {
          onToken(tokenResponse.access_token);
        }
      },
    });
    resolve(client);
  });
}

export async function fetchCourses(token) {
  const res = await fetch('https://classroom.googleapis.com/v1/courses?courseStates=ACTIVE', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('API Error fetching courses');
  const data = await res.json();
  return data.courses || [];
}

export async function fetchCourseWork(token, courseId) {
  const res = await fetch(`https://classroom.googleapis.com/v1/courses/${courseId}/courseWork`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`API Error fetching coursework for course ${courseId}`);
  const data = await res.json();
  return data.courseWork || [];
}

export async function importGoogleClassroom(clientId, onProgress) {
  return new Promise(async (resolve, reject) => {
    try {
      let storedToken = await getSetting('gclass_token');
      let tokenClient;

      const doImport = async (token) => {
        await setSetting('gclass_token', token);
        onProgress('Fetching courses...');
        const courses = await fetchCourses(token);

        onProgress('Fetching assignments...');
        const allLocalHw = await getAllHomework();
        const existingIds = new Set(allLocalHw.map(hw => hw.classroomId).filter(Boolean));

        let newCount = 0;

        for (const course of courses) {
          const coursework = await fetchCourseWork(token, course.id);

          for (const work of coursework) {
            if (existingIds.has(work.id)) continue; 

            let dueDateStr = '';
            if (work.dueDate) {
              const { year, month, day } = work.dueDate;
              dueDateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            } else {
              continue; 
            }

            const newHw = {
              title: work.title,
              subject: course.name,
              dueDate: dueDateStr,
              priority: 'medium',
              description: work.description || '',
              source: 'Google Classroom',
              classroomId: work.id,
              url: work.alternateLink
            };

            await addHomework(newHw);
            newCount++;
          }
        }
        resolve(newCount);
      };

      if (!storedToken) {
        tokenClient = await initGoogleAuth(clientId, doImport);
        tokenClient.requestAccessToken();
      } else {
        try {
          await doImport(storedToken);
        } catch (e) {
          tokenClient = await initGoogleAuth(clientId, doImport);
          tokenClient.requestAccessToken();
        }
      }
    } catch (e) {
      reject(e);
    }
  });
}
