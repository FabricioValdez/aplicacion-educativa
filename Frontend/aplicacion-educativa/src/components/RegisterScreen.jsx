import { useState } from "react";
import {
  Baby,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  Smile,
  Star,
  UserCheck,
  UserRound,
} from "lucide-react";

const avatars = [
  { id: "astronaut", emoji: "🚀", label: "Astro" },
  { id: "dino", emoji: "🦖", label: "Dino" },
  { id: "cat", emoji: "🐱", label: "Gatito" },
  { id: "robot", emoji: "🤖", label: "Robot" },
  { id: "star", emoji: "⭐", label: "Estrella" },
  { id: "lion", emoji: "🦁", label: "León" },
];

export default function RegisterScreen({ onRegister = () => {}, onNavigateToLogin = () => {} }) {
  const [role, setRole] = useState("child");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatar, setAvatar] = useState("astronaut");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Por favor ingresa tu nombre.");
      return;
    }
    if (name.trim().length < 2) {
      setError("El nombre debe tener al menos 2 caracteres.");
      return;
    }
    if (!password) {
      setError("Por favor define una clave secreta.");
      return;
    }
    if (password.length < 3) {
      setError("La clave debe tener al menos 3 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las claves secretas no coinciden.");
      return;
    }

    try {
      setLoading(true);
      await onRegister({
        role,
        name: name.trim(),
        password,
        avatar,
      });
    } catch (err) {
      setError(err.message || "Ocurrió un error al crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] overflow-y-auto bg-[#F8FAFC] px-4 py-6 sm:py-10 text-slate-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        {/* Cabecera */}
        <header className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-full border-2 border-[#FBBF24] bg-[#FEF3C7] shadow-[0_3px_0_#FBBF24]">
              <Star className="h-5 w-5 sm:h-6 sm:w-6 fill-[#FBBF24] text-[#B45309]" strokeWidth={2.5} />
            </span>
            <span className="font-heading text-xl sm:text-2xl font-extrabold tracking-tight text-[#075985]">QuestWorld</span>
          </div>
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="rounded-full border-2 border-[#D5E5FF] bg-white px-3.5 sm:px-4 py-1.5 font-heading text-xs font-bold text-[#0284C7] shadow-sm hover:bg-[#EFF6FF] active:scale-95"
          >
            Iniciar Sesión
          </button>
        </header>

        {/* Título */}
        <section className="mt-5 sm:mt-6 text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E0F2FE] px-3.5 py-1 text-xs font-extrabold text-[#0369A1]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Registro Rápido y Seguro</span>
          </div>
          <h1 className="mt-3 font-heading text-2xl sm:text-[2rem] font-extrabold leading-tight text-slate-900">
            ¡Crea tu Cuenta! 🌟
          </h1>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600">
            {role === "adult"
              ? "Crea clases, asigna códigos y diseña ejercicios para tus alumnos"
              : "Prepárate para aprender jugando y acumulando estrellas"}
          </p>
        </section>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 w-full rounded-[2rem] sm:rounded-[2.5rem] border-2 border-[#D5E5FF] bg-white px-5 sm:px-8 py-6 sm:py-7 shadow-soft">
          {/* Selector de Rol */}
          <div className="grid grid-cols-2 rounded-full border-2 border-[#D5E5FF] bg-[#EFF6FF] p-1">
            <button
              type="button"
              onClick={() => {
                setRole("child");
                setError("");
              }}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-2 py-2 font-heading text-sm font-extrabold transition ${
                role === "child"
                  ? "bg-[#0284C7] text-white shadow-[0_3px_0_#0369A1]"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              <Baby className="h-5 w-5" />
              <span>Soy Niño</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRole("adult");
                setError("");
              }}
              className={`flex min-h-12 items-center justify-center gap-2 rounded-full px-2 py-2 font-heading text-sm font-extrabold transition ${
                role === "adult"
                  ? "bg-[#0284C7] text-white shadow-[0_3px_0_#0369A1]"
                  : "text-slate-600 hover:bg-white/70"
              }`}
            >
              <UserRound className="h-5 w-5" />
              <span>Soy Profesor</span>
            </button>
          </div>

          {/* Selector de Avatar (para niños principalmente) */}
          {role === "child" && (
            <div className="mt-5">
              <label className="block text-left font-heading text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                Elige tu Mascota Exploradora
              </label>
              <div className="grid grid-cols-6 gap-1.5">
                {avatars.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAvatar(av.id)}
                    className={`flex flex-col items-center justify-center rounded-2xl p-2 border-2 transition ${
                      avatar === av.id
                        ? "border-[#0284C7] bg-[#EFF6FF] scale-105 shadow-sm"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <span className="text-2xl">{av.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 space-y-4">
            <label className="block text-left">
              <span className="font-heading text-sm font-extrabold text-slate-800">
                {role === "adult" ? "Tu Nombre Completo / Profesor 👨‍🏫" : "Tu Nombre de Explorador 🚀"}
              </span>
              <span className="relative mt-1.5 block">
                <Smile className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0369A1]" strokeWidth={2.5} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={role === "adult" ? "Prof. Mariana Soto" : "Mateo el Valiente"}
                  autoComplete="name"
                  className="h-14 w-full rounded-full border-3 border-[#D5E5FF] bg-[#EFF6FF] pl-12 pr-4 font-heading text-base font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0284C7]"
                />
              </span>
            </label>

            <label className="block text-left">
              <span className="font-heading text-sm font-extrabold text-slate-800">Crea tu Clave Secreta 🔑</span>
              <span className="relative mt-1.5 block">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0369A1]" strokeWidth={2.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  autoComplete="new-password"
                  className="h-14 w-full rounded-full border-3 border-[#D5E5FF] bg-[#EFF6FF] px-12 font-heading text-base font-bold tracking-[0.2em] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0284C7]"
                />
                <button
                  type="button"
                  aria-label="Ver clave"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#0284C7]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </span>
            </label>

            <label className="block text-left">
              <span className="font-heading text-sm font-extrabold text-slate-800">Confirma tu Clave 🔐</span>
              <span className="relative mt-1.5 block">
                <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#0369A1]" strokeWidth={2.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••"
                  autoComplete="new-password"
                  className="h-14 w-full rounded-full border-3 border-[#D5E5FF] bg-[#EFF6FF] px-12 font-heading text-base font-bold tracking-[0.2em] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0284C7]"
                />
              </span>
            </label>
          </div>

          {error && (
            <div role="alert" className="mt-4 rounded-2xl bg-red-50 border border-red-200 p-3 text-center text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex h-15 w-full items-center justify-center gap-2 rounded-full bg-[#0284C7] py-4 font-heading text-lg font-extrabold text-white shadow-button transition hover:bg-[#0369A1] active:translate-y-[2px] active:shadow-none disabled:opacity-60"
          >
            <UserCheck className="h-5 w-5" />
            <span>{loading ? "Creando cuenta..." : "¡Crear Cuenta y Comenzar! 🚀"}</span>
          </button>

          <div className="mt-5 border-t border-slate-100 pt-4 text-center">
            <p className="text-sm font-semibold text-slate-500">¿Ya tienes una cuenta?</p>
            <button
              type="button"
              onClick={onNavigateToLogin}
              className="mt-1 font-heading text-base font-extrabold text-[#0284C7] hover:underline"
            >
              ¡Inicia sesión aquí!
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
