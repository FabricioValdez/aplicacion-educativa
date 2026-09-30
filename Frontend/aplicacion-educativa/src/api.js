const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_URL = rawApiUrl.endsWith("/") ? rawApiUrl.slice(0, -1) : rawApiUrl;

async function request(path, options = {}) {
  const { headers = {}, ...restOptions } = options;
  const response = await fetch(`${API_URL}${path}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo completar la solicitud.");
  return data;
}

export function login(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
}

export function register(userData) {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

export function getClasses(userId) {
  return request("/classes", { headers: { "x-user-id": userId } });
}

export function createClass(userId, classData) {
  return request("/classes", {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify(classData),
  });
}

export function joinClass(userId, code) {
  return request("/classes/join", {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify({ code }),
  });
}

export function addClassPoints(userId, classId, points) {
  return request(`/classes/${classId}/points`, {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify({ points }),
  });
}

export function getClassStudents(userId, classId) {
  return request(`/classes/${classId}/students`, {
    headers: { "x-user-id": userId },
  });
}

export function getCustomExercises(userId, subject = "", classId = "") {
  const query = new URLSearchParams();
  if (subject) query.append("subject", subject);
  if (classId) query.append("classId", classId);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return request(`/exercises${qStr}`, {
    headers: { "x-user-id": userId },
  });
}

export function createCustomExercise(userId, exerciseData) {
  return request("/exercises", {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify(exerciseData),
  });
}

export function deleteCustomExercise(userId, exerciseId) {
  return request(`/exercises/${exerciseId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  });
}

// Lecciones para Alumnos y Profesores
export function getSubjectLessons(userId, subject, classId = "") {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  return request(`/subjects/${subject}/lessons${query}`, {
    headers: { "x-user-id": userId },
  });
}

export function getLessonDetails(lessonId, subject = "math") {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return request(`/lessons/${lessonId}${query}`);
}

export function getLessonExercises(lessonId, subject = "math") {
  const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return request(`/lessons/${lessonId}${query}`);
}

export function getTeacherLessons(userId, subject = "", classId = "") {
  const query = new URLSearchParams();
  if (subject) query.append("subject", subject);
  if (classId) query.append("classId", classId);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return request(`/teachers/${userId}/lessons${qStr}`, {
    headers: { "x-user-id": userId },
  });
}

export function createTeacherLesson(userId, lessonData) {
  return request(`/teachers/${userId}/lessons`, {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify(lessonData),
  });
}

export function deleteTeacherLesson(userId, lessonId) {
  return request(`/teachers/${userId}/lessons/${lessonId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  });
}

export function getLessonStudentProgress(userId, lessonId, classId = "") {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  return request(`/teachers/${userId}/lessons/${lessonId}/students${query}`, {
    headers: { "x-user-id": userId },
  });
}


export function getDailyChallenge(userId) {
  return request("/challenges/daily", { headers: { "x-user-id": userId } });
}

export function advanceDailyChallenge(userId) {
  return request("/challenges/daily/progress", {
    method: "POST",
    headers: { "x-user-id": userId },
  });
}

export function getActivities(userId) {
  return request("/activities", { headers: { "x-user-id": userId } });
}

export function getActivity(userId, activityId) {
  return request(`/activities/${activityId}`, { headers: { "x-user-id": userId } });
}

export function submitActivityAnswer(userId, activityId, payload) {
  const body =
    typeof payload === "object" && payload !== null && ("answer" in payload || "questionId" in payload)
      ? payload
      : { answer: payload };

  return request(`/activities/${activityId}/answer`, {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify(body),
  });
}

export function saveLessonProgress(userId, progress) {
  return request("/user/progress", {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify(progress),
  });
}

export function logout(userId) {
  return request("/auth/logout", {
    method: "POST",
    headers: { "x-user-id": userId },
  });
}

export function updateUserProfile(userId, profileData) {
  return request("/user/profile", {
    method: "PUT",
    headers: { "x-user-id": userId },
    body: JSON.stringify(profileData),
  });
}

export function buyShieldWithPoints(userId) {
  return request("/user/buy-shield-points", {
    method: "POST",
    headers: { "x-user-id": userId },
  });
}

export function createCheckoutSession(userId, packageType = "lives_refill") {
  return request("/payments/create-checkout-session", {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify({ userId, packageType }),
  });
}

export function createLivesCheckoutSession(userId) {
  return createCheckoutSession(userId, "lives_refill");
}

export function confirmLivesPayment(userId, sessionId) {
  return request("/payments/confirm", {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify({ sessionId }),
  });
}

export function mockCheckout(userId, packageType = "lives_refill") {
  return request("/payments/mock-checkout", {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify({ packageType }),
  });
}

export function mockLivesCheckout(userId) {
  return mockCheckout(userId, "lives_refill");
}

export function getUserProfile(userId) {
  return request("/user/profile", { headers: { "x-user-id": userId } });
}

export function checkUserStreak(userId) {
  return request("/user/check-streak", {
    method: "POST",
    headers: { "x-user-id": userId },
  });
}

export function addUserPoints(userId, points, reason) {
  return request("/user/add-points", {
    method: "POST",
    headers: { "x-user-id": userId },
    body: JSON.stringify({ points, reason }),
  });
}

export function getLeaderboard(userId, classId = "") {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  return request(`/missions/leaderboard${query}`, { headers: { "x-user-id": userId } });
}

export function getUserAchievements(userId) {
  return request("/achievements", { headers: { "x-user-id": userId } });
}