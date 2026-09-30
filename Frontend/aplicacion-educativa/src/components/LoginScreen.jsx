import { useState } from "react";
import {
  Baby,
  Eye,
  EyeOff,
  LockKeyhole,
  Smile,
  Sparkles,
  Star,
  UserPlus,
  UserRound,
} from "lucide-react";

const roles = [
  { id: "child", label: "Soy Niño", icon: Baby },
  { id: "adult", label: "Soy Profesor / Tutor", icon: UserRound },
];

export default function LoginScreen({ onLogin = () => {}, onNavigateToRegister = () => {} }) {
  const [role, setRole] = useState("child");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Por favor ingresa tu nombre.");
      return;
    }
    if (!password.trim()) {
      setError("Por favor ingresa tu clave secreta.");
      return;
    }

    try {
      setLoading(true);
      await onLogin({ role, name, password });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] overflow-y-auto bg-[#F8FAFC] px-4 py-6 sm:py-10 text-slate-900 sm:px-6">
      <div className="mx-auto flex w-full max-w-md flex-col items-center">
        {/* Cabecera limpia sin botón de volumen */}
        <header className="flex w-full items-center justify-center">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="grid h-12 w-12 sm:h-14 sm:w-14 place-items-center rounded-full border-2 border-[#FBBF24] bg-[#FEF3C7] shadow-[0_4px_0_#FBBF24]">
              <Star className="h-7 w-7 sm:h-8 sm:w-8 fill-[#FBBF24] text-[#B45309]" strokeWidth={2.5} />
            </span>
            <span className="font-heading text-2xl sm:text-[1.9rem] font-extrabold tracking-tight text-[#075985]">QuestWorld</span>
          </div>
        </header>

        {/* Bienvenida y Mascota */}
        <section className="mt-5 sm:mt-7 text-center" aria-labelledby="welcome-title">
          <div className="relative mx-auto grid h-32 w-32 sm:h-40 sm:w-40 place-items-center rounded-full border-[6px] sm:border-[7px] border-[#E0EDFF] bg-white shadow-[0_6px_0_#D6E5FA]">
            <div className="grid h-22 w-22 sm:h-28 sm:w-28 place-items-center rounded-full bg-[#EFF6FF] text-5xl sm:text-6xl" role="img" aria-label="Mascota astronauta">
              🚀
            </div>
            <div className="absolute -bottom-3 sm:-bottom-4 rounded-full border-3 sm:border-4 border-white bg-[#047857] px-3 sm:px-4 py-0.5 sm:py-1 font-heading text-xs sm:text-sm font-extrabold text-white shadow-[0_3px_0_#065F46]">
              <Sparkles className="mr-1 inline h-3.5 w-3.5 sm:h-4 sm:w-4" />¡HOLA!
            </div>
          </div>
          <h1 id="welcome-title" className="mt-6 sm:mt-8 font-heading text-2xl sm:text-3xl md:text-[2.1rem] font-extrabold leading-tight tracking-tight text-slate-900">
            {role === "adult" ? "¡Hola, Docente o Tutor!" : "¡Bienvenido, Explorador!"}
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-sm sm:text-base font-semibold text-slate-600">
            {role === "adult"
              ? "Accede a tus clases y ejercicios pedagógicos"
              : "Ingresa a tu gran aventura galáctica de aprendizaje"}
          </p>
        </section>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="mt-6 sm:mt-7 w-full rounded-[2rem] sm:rounded-[2.5rem] border-2 border-[#D5E5FF] bg-white px-5 sm:px-8 py-6 sm:py-8 shadow-soft">
          {/* Selector de Rol */}
          <div className="grid grid-cols-2 rounded-full border-2 border-[#D5E5FF] bg-[#EFF6FF] p-1">
            {roles.map(({ id, label, icon: Icon }) => {
              const isActive = role === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setRole(id);
                    setError("");
                  }}
                  aria-pressed={isActive}
                  className={`flex min-h-14 items-center justify-center gap-2 rounded-full px-2 py-2 font-heading text-sm font-extrabold transition ${
                    isActive
                      ? "bg-[#0284C7] text-white shadow-[0_4px_0_#0369A1]"
                      : "text-slate-600 hover:bg-white/70"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" strokeWidth={2.5} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-5">
            <label className="block text-left">
              <span className="font-heading text-base font-extrabold text-slate-800">
                {role === "adult" ? "Tu nombre o usuario 👨‍🏫" : "Tu nombre de explorador 🚀"}
              </span>
              <span className="relative mt-2 block">
                <Smile className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-[#0369A1]" strokeWidth={2.5} />
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={role === "adult" ? "Profesor Juan" : "Lucas el Astronauta"}
                  autoComplete="username"
                  className="h-14 sm:h-16 w-full rounded-full border-3 sm:border-4 border-[#D5E5FF] bg-[#EFF6FF] pl-12 sm:pl-14 pr-4 sm:pr-5 font-heading text-base sm:text-lg font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0284C7]"
                />
              </span>
            </label>

            <label className="block text-left">
              <span className="font-heading text-sm sm:text-base font-extrabold text-slate-800">Tu clave secreta 🔑</span>
              <span className="relative mt-2 block">
                <LockKeyhole className="pointer-events-none absolute left-4 sm:left-5 top-1/2 h-5 w-5 sm:h-6 sm:w-6 -translate-y-1/2 text-[#0369A1]" strokeWidth={2.5} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="••••"
                  autoComplete="current-password"
                  className="h-14 sm:h-16 w-full rounded-full border-3 sm:border-4 border-[#D5E5FF] bg-[#EFF6FF] px-12 sm:px-14 font-heading text-base sm:text-lg font-bold tracking-[0.2em] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0284C7]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-4 sm:right-5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-500 transition hover:text-[#0369A1] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0284C7]"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 sm:h-6 sm:w-6" /> : <Eye className="h-5 w-5 sm:h-6 sm:w-6" />}
                </button>
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
            className="mt-6 h-14 sm:h-16 w-full rounded-full bg-[#0284C7] px-4 font-heading text-lg sm:text-xl font-extrabold text-white shadow-button transition hover:bg-[#0369A1] active:translate-y-[2px] active:shadow-none disabled:opacity-60 touch-manipulation"
          >
            {loading ? "Entrando..." : role === "adult" ? "Ingresar al Panel 🏫" : "¡Comenzar Aventura! 🚀"}
          </button>

          {/* Botón para Crear Cuenta / Registrarse */}
          <div className="mt-6 border-t-2 border-slate-100 pt-5 text-center">
            <p className="text-sm font-semibold text-slate-500">¿Aún no tienes una cuenta?</p>
            <button
              type="button"
              onClick={onNavigateToRegister}
              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#0284C7] bg-[#EFF6FF] py-3.5 font-heading text-base font-extrabold text-[#0284C7] transition hover:bg-[#0284C7] hover:text-white"
            >
              <UserPlus className="h-5 w-5" />
              <span>Crear cuenta nueva</span>
            </button>
          </div>
        </form>

        <footer className="pb-5 pt-8 text-center">
          <p className="text-xs font-semibold text-slate-400">Ambiente seguro y educativo • QuestWorld</p>
        </footer>
      </div>
    </main>
  );
}