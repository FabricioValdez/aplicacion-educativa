export const LESSON_KEY_MAP = {
  math: "matematicas",
  matematicas: "math",
  spanish: "espanol",
  espanol: "spanish",
  science: "ciencias",
  ciencias: "science",
  geography: "geografia",
  geografia: "geography",
};

export function isLessonCompleted(activityId, completedLessons = []) {
  if (!activityId || !Array.isArray(completedLessons)) return false;
  const mapped = LESSON_KEY_MAP[activityId];
  return (
    completedLessons.includes(activityId) ||
    (Boolean(mapped) && completedLessons.includes(mapped))
  );
}

export function isLessonItemCompleted(lesson, completedLessons = []) {
  if (!lesson || !Array.isArray(completedLessons)) return false;
  if (lesson.completed) return true;

  const id = String(lesson.id || "");
  const subject = String(lesson.subject || "");
  const mapped = LESSON_KEY_MAP[subject] || subject;

  return (
    completedLessons.includes(id) ||
    completedLessons.includes(`lesson_${id}`) ||
    completedLessons.includes(`${subject}_practice`) ||
    completedLessons.includes(`${mapped}_practice`) ||
    (lesson.isDefault && (completedLessons.includes(subject) || completedLessons.includes(mapped)))
  );
}

export function isSubjectFullyCompleted(subjectId, subjectLessons = [], completedLessons = []) {
  if (!subjectId || !Array.isArray(completedLessons)) return false;

  // Si tenemos la lista de lecciones de la materia, deben estar todas completadas
  if (Array.isArray(subjectLessons) && subjectLessons.length > 0) {
    return subjectLessons.every((l) => isLessonItemCompleted(l, completedLessons));
  }

  // De lo contrario, fallback al comportamiento estándar
  return isLessonCompleted(subjectId, completedLessons);
}

export function getCompletedSubjectsCount(activities = [], completedLessons = [], subjectLessonsMap = {}) {
  if (!Array.isArray(activities)) return 0;
  return activities.filter((act) => {
    const lessons = subjectLessonsMap[act.id] || [];
    return isSubjectFullyCompleted(act.id, lessons, completedLessons);
  }).length;
}

export function getNextPendingActivity(activities = [], completedLessons = [], subjectLessonsMap = {}) {
  if (!Array.isArray(activities)) return null;
  return activities.find((act) => {
    const lessons = subjectLessonsMap[act.id] || [];
    return !isSubjectFullyCompleted(act.id, lessons, completedLessons);
  }) || null;
}
