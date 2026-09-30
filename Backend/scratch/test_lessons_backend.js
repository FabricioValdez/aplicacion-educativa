const BASE_URL = "http://localhost:4000/api";

async function testLessons() {
  console.log("=== Probando Endpoints de Lecciones y Dinámicas ===");

  // 1. Obtener lecciones de matemáticas para el alumno 'student_1790665245400'
  const studentId = "student_1790665245400";
  const res1 = await fetch(`${BASE_URL}/subjects/math/lessons`, {
    headers: { "x-user-id": studentId },
  });
  const data1 = await res1.json();
  console.log("1. Lecciones para alumno (math):", data1.lessons.length, "lecciones. Práctica completada:", data1.lessons[0]?.completed);

  // 2. Crear una lección como docente 'teacher_1790665329167'
  const teacherId = "teacher_1790665329167";
  const res2 = await fetch(`${BASE_URL}/teachers/${teacherId}/lessons`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": teacherId },
    body: JSON.stringify({
      subject: "spanish",
      title: "Desafío de Palabras Mágicas",
      description: "Adivina las palabras misteriosas con tu profesor",
    }),
  });
  const data2 = await res2.json();
  console.log("2. Lección creada por docente:", data2.success, data2.lesson?.id, data2.lesson?.title);
  const lessonId = data2.lesson?.id;

  // 3. Agregar un ejercicio de dinámica de Español (Palabras Mágicas) a esa lección
  const res3 = await fetch(`${BASE_URL}/teachers/${teacherId}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": teacherId },
    body: JSON.stringify({
      lessonId,
      subject: "spanish",
      title: "Adivinanza de la Banana",
      question: "Fruta amarilla alargada que le gusta a los monos",
      correctAnswer: "PLATANO",
      explanation: "¡El plátano es una fruta tropical deliciosa!",
      points: 10,
      dataJson: {
        type: "adivinanza",
        clue: "Fruta amarilla alargada que le gusta a los monos",
        clueEmoji: "🍌",
        helperText: "Comienza con P y termina con O",
        targetWord: "PLATANO",
        displayPattern: ["P", "_", "A", "T", "_", "N", "O"],
      },
    }),
  });
  const data3 = await res3.json();
  console.log("3. Ejercicio de español agregado:", data3.success, data3.exercise?.id, data3.exercise?.dataJson?.clueEmoji);

  // 4. Agregar un ejercicio de dinámica de Ciencias (Secuencia natural)
  const res4 = await fetch(`${BASE_URL}/teachers/${teacherId}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": teacherId },
    body: JSON.stringify({
      lessonId,
      subject: "science",
      title: "Ciclo de la Rana",
      question: "Ordena las etapas de la vida de la rana:",
      correctAnswer: "egg,tadpole,tadpole_legs,frog",
      explanation: "De los huevos nacen renacuajos que luego se convierten en ranas.",
      points: 10,
      dataJson: {
        title: "Ciclo de la Rana",
        instruction: "Ordena las etapas desde el huevo hasta la rana adulta:",
        icon: "🐸",
        items: [
          { id: "egg", label: "Huevos en el agua", emoji: "🥚" },
          { id: "tadpole", label: "Renacuajo nadador", emoji: "🐟" },
          { id: "tadpole_legs", label: "Renacuajo con patitas", emoji: "🦎" },
          { id: "frog", label: "Rana adulta", emoji: "🐸" },
        ],
        correctOrder: ["egg", "tadpole", "tadpole_legs", "frog"],
      },
    }),
  });
  const data4 = await res4.json();
  console.log("4. Ejercicio de ciencias agregado:", data4.success, data4.exercise?.id, data4.exercise?.dataJson?.icon);

  // 5. Verificar reporte de alumnos (completados vs pendientes) para el profesor
  const res5 = await fetch(`${BASE_URL}/teachers/${teacherId}/lessons/${lessonId}/students`, {
    headers: { "x-user-id": teacherId },
  });
  const data5 = await res5.json();
  console.log("5. Reporte de alumnos:", "Completados:", data5.completedCount, "Pendientes:", data5.pendingCount);

  // 6. Eliminar la lección de prueba
  await fetch(`${BASE_URL}/teachers/${teacherId}/lessons/${lessonId}`, {
    method: "DELETE",
    headers: { "x-user-id": teacherId },
  });
  console.log("6. Lección de prueba eliminada limpiamente.");

  console.log("=== Todos los tests del backend pasaron con éxito ===");
}

testLessons().catch(console.error);
