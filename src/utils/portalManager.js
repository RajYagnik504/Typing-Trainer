const STUDENT_KEY = 'tc_student_session';
const TEACHER_KEY = 'tc_teacher_session';

export function saveStudent(name, classroomCode) {
  try {
    localStorage.setItem(STUDENT_KEY, JSON.stringify({
      name, classroomCode, joinedAt: Date.now()
    }));
  } catch(e) {}
}

export function getStudent() {
  try {
    const s = localStorage.getItem(STUDENT_KEY);
    return s ? JSON.parse(s) : null;
  } catch(e) { return null; }
}

export function saveTeacher(name, classroomName, classroomCode) {
  try {
    localStorage.setItem(TEACHER_KEY, JSON.stringify({
      name, classroomName, classroomCode, createdAt: Date.now()
    }));
  } catch(e) {}
}

export function getTeacher() {
  try {
    const t = localStorage.getItem(TEACHER_KEY);
    return t ? JSON.parse(t) : null;
  } catch(e) { return null; }
}

export function clearPortalSession() {
  try {
    localStorage.removeItem(STUDENT_KEY);
    localStorage.removeItem(TEACHER_KEY);
  } catch(e) {}
}

export function generateClassroomCode() {
  const digits = Math.floor(1000 + Math.random() * 9000);
  return `TC-${digits}`;
}

export function isValidClassroomCode(code) {
  return /^TC-\d{4}$/.test(code.trim().toUpperCase());
}
