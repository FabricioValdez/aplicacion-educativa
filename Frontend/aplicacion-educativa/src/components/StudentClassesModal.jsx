import { useState } from "react";
import { Check, CheckCircle2, ChevronRight, Plus, School, X } from "lucide-react";
import { joinClass } from "../api";
import { useUser } from "../context/useUser";

export default function StudentClassesModal({
  isOpen,
  onClose,
  classes = [],
  activeClass,
  onSelectClass,
  onClassJoined,
}) {
  const { user } = useUser();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Por favor escribe el código de la clase.");
      return;
    }

    setError("");
    setSuccessMsg("");
    try {
      setLoading(true);
      const result = await joinClass(user.id, code.trim());
      setSuccessMsg(result.class?.alreadyEnrolled ? "Ya estabas en esta clase." : "¡Te has unido con éxito a la clase!");
      setCode("");
      if (onClassJoined) {
        await onClassJoined(result.class);
      }
      setTimeout(() => {
        setSuccessMsg("");
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || "Código no válido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-sm sm:max-w-md rounded-[2rem] border-2 border-[#D5E5FF] bg-white p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-100 text-lg">🏫</span>
            <h3 className="font-heading text-lg font-extrabold text-slate-800">
              Mis Clases Escolares
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario para Unirse con Código */}
        <form onSubmit={handleJoin} className="mt-4 rounded-2xl bg-[#EFF6FF] border border-blue-200 p-3.5">
          <label className="block text-left font-heading text-xs font-black uppercase tracking-wider text-[#0369A1] mb-1.5">
            ¿Tienes un código de tu profesor? 🔑
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej. MAT402"
              maxLength={10}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="flex-1 rounded-xl border-2 border-blue-300 bg-white px-3 py-2 font-heading text-sm font-black uppercase tracking-widest text-slate-800 outline-none focus:border-[#0284C7]"
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-[#0284C7] px-4 py-2 font-heading text-xs font-black text-white shadow-button hover:bg-[#0369A1] disabled:opacity-60"
            >
              {loading ? "..." : "Unirme"}
            </button>
          </div>
          {error && <p className="mt-2 text-xs font-bold text-red-600">{error}</p>}
          {successMsg && (
            <div className="mt-2 flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successMsg}</span>
            </div>
          )}
        </form>

        {/* Lista de clases inscritas */}
        <div className="mt-4">
          <h4 className="font-heading text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Selecciona tu clase activa ({classes.length})
          </h4>

          {classes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center">
              <p className="text-xs font-semibold text-slate-400">
                Aún no estás en ninguna clase. Ingresa el código arriba para comenzar.
              </p>
            </div>
          ) : (
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
              {classes.map((cls) => {
                const isSelected = activeClass?.id === cls.id;
                return (
                  <button
                    key={cls.id}
                    type="button"
                    onClick={() => {
                      onSelectClass(cls);
                      onClose();
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl border-2 p-3 text-left transition ${
                      isSelected
                        ? "border-[#0284C7] bg-[#EFF6FF] shadow-sm"
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-sm font-extrabold text-slate-800">
                          {cls.name}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                            Activa
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-semibold text-slate-400">
                        Prof: {cls.teacherName || "Profesor"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-1 text-right">
                        <span className="font-heading text-xs font-black text-amber-800">
                          ⭐ {cls.classPoints}
                        </span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
