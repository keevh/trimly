import { useState, type FormEvent, type ReactNode } from "react";
import {
  FlaskConical,
  Hourglass,
  Scissors,
  ShieldAlert,
  ShieldBan,
} from "lucide-react";

export default function Demo() {
  const [url, setUrl] = useState("https://ejemplo.com/tu-enlace-muy-largo");
  const [alias, setAlias] = useState("mi-alias");

  const handleShorten = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const targetAlias = alias.trim() || "demo";
    window.location.href = `/stats?id=${encodeURIComponent(targetAlias)}`;
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center pt-16 pb-24 px-4 md:px-10 max-w-4xl mx-auto">
      <div className="text-center mb-10 w-full">
        <h1 className="text-4xl font-bold text-on-surface mb-4">
          Prueba la Demo de Trimly
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
          Experimenta la precisión y velocidad de nuestro sistema de
          acortamiento de enlaces.
        </p>
      </div>

      <div className="w-full bg-surface-container-lowest border border-outline-variant rounded-3xl p-8 shadow-xl shadow-black/20 mb-8 z-10 relative">
        <form onSubmit={handleShorten} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">
              Pega tu enlace largo
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              className="w-full px-4 py-4 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all font-mono text-sm"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-on-surface-variant tracking-wider uppercase">
              Alias personalizado (Opcional)
            </label>
            <div className="flex w-full rounded-xl overflow-hidden border border-outline-variant focus-within:border-primary-container focus-within:ring-1 focus-within:ring-primary-container transition-all">
              <div className="bg-surface-container-lowest px-4 py-4 flex items-center justify-center border-r border-outline-variant shrink-0 border-r-2 border-r-on-surface-variant">
                <span className="text-sm font-mono text-on-surface-variant">
                  trimly.keevh.dev/
                </span>
              </div>
              <input
                type="text"
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                className="w-full px-4 py-4 bg-surface-container text-on-surface focus:outline-none font-mono text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-primary-container text-white font-semibold py-4 rounded-xl hover:bg-primary transition-colors flex items-center justify-center gap-2 mt-2 shadow-[inset_0_1px_rgba(255,255,255,0.2)]"
          >
            <Scissors className="w-5 h-5" />
            Recortar enlace
          </button>
        </form>
      </div>

      <p className="text-sm text-on-surface-variant text-center mb-16 max-w-xl">
        Los enlaces creados en esta demo expiran en 24 horas y no garantizan
        disponibilidad a largo plazo.
      </p>

      <div className="w-full max-w-4xl">
        <h3 className="text-lg font-bold text-on-surface mb-6">
          Demo Usage Policy
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PolicyCard
            icon={<Hourglass className="w-6 h-6" />}
            title="Expiración"
            description="Enlaces borrados tras 24h automáticamente."
          />
          <PolicyCard
            icon={<FlaskConical className="w-6 h-6" />}
            title="Uso limitado"
            description="Diseñado estrictamente para fines de prueba y evaluación."
          />
          <PolicyCard
            icon={<ShieldAlert className="w-6 h-6" />}
            title="Sin datos sensibles"
            description="No apto para transmitir o enlazar información privada."
          />
          <PolicyCard
            icon={<ShieldBan className="w-6 h-6" />}
            title="Moderación"
            description="Enlaces detectados como maliciosos serán eliminados de inmediato."
          />
        </div>
      </div>
    </div>
  );
}

function PolicyCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 shadow-sm flex flex-col gap-4">
      <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center text-primary-container border border-outline-variant">
        {icon}
      </div>
      <h4 className="font-semibold text-on-surface">{title}</h4>
      <p className="text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}
