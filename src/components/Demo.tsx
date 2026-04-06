import { useState, type ReactNode } from "react";
import type * as React from "react";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Hourglass,
  ShieldAlert,
  ShieldCheck,
  Scissors,
  Sparkles,
} from "lucide-react";

type CreateLinkResponse = {
  slug: string;
  shortUrl: string;
  statsUrl: string;
  managementToken: string;
  expiresAt: string;
  error?: string;
  message?: string;
  limit?: number;
  windowHours?: number;
};

type DemoResult = {
  slug: string;
  shortUrl: string;
  statsUrl: string;
  managementToken: string;
  expiresAt: string;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Demo() {
  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<"shortUrl" | "token" | null>(null);

  const copyValue = async (value: string, key: "shortUrl" | "token") => {
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleShorten = async (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          destinationUrl: url.trim(),
          customAlias: alias.trim() || undefined,
          source: "demo",
        }),
      });

      const payload = (await response.json()) as CreateLinkResponse;

      if (!response.ok) {
        if (response.status === 429) {
          setError(
            payload.message ??
              `Has alcanzado el límite de ${payload.limit ?? 3} enlaces cada ${
                payload.windowHours ?? 24
              } horas.`,
          );
        } else if (payload.error === "alias_taken") {
          setError("Ese alias ya está en uso.");
        } else if (payload.error === "invalid_alias") {
          setError(
            "El alias debe tener entre 3 y 32 caracteres y usar solo letras, números, guiones o guiones bajos.",
          );
        } else if (payload.error === "invalid_url") {
          setError("La URL de destino no es válida.");
        } else {
          setError(payload.message ?? "No se pudo crear el enlace.");
        }

        return;
      }

      setResult({
        slug: payload.slug,
        shortUrl: payload.shortUrl,
        statsUrl: payload.statsUrl,
        managementToken: payload.managementToken,
        expiresAt: payload.expiresAt,
      });
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-grow flex flex-col items-center pt-16 pb-24 px-4 md:px-10 max-w-5xl mx-auto">
      <div className="text-center mb-10 w-full">
        <div className="inline-flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-low px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-on-surface-variant mb-6">
          <Sparkles className="w-4 h-4 text-primary-container" />
          Demo real con postgres
        </div>
        <h1 className="text-4xl font-bold text-on-surface mb-4">
          Prueba la Demo de Trimly
        </h1>
        <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">
          Crea un enlace real, revisa sus estadísticas públicas y guarda el
          token privado si después quieres borrarlo.
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
              placeholder="https://ejemplo.com/tu-enlace-muy-largo"
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
                  trimly.local/t/
                </span>
              </div>
              <input
                type="text"
                value={alias}
                onChange={(event) => setAlias(event.target.value)}
                className="w-full px-4 py-4 bg-surface-container text-on-surface focus:outline-none font-mono text-sm"
                placeholder="mi-alias"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-container text-white font-semibold py-4 rounded-xl hover:bg-primary transition-colors flex items-center justify-center gap-2 mt-2 shadow-[inset_0_1px_rgba(255,255,255,0.2)] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Scissors className="w-5 h-5" />
            {loading ? "Creando enlace..." : "Recortar enlace"}
          </button>
        </form>
      </div>

      {error ? (
        <div className="w-full bg-error-container/20 border border-error/30 rounded-3xl p-5 mb-8 flex items-start gap-3 text-on-error-container">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-error" />
          <div className="flex flex-col gap-1">
            <strong className="text-sm font-semibold">No se pudo crear el enlace</strong>
            <p className="text-sm text-on-surface-variant">{error}</p>
          </div>
        </div>
      ) : null}

      {result ? (
        <div className="w-full bg-surface-container-low border border-primary-container/40 rounded-3xl p-6 md:p-8 shadow-xl shadow-black/20 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-6">
            <div className="flex flex-col gap-3 min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/30 px-3 py-1 text-sm font-medium w-fit">
                <ShieldCheck className="w-4 h-4" />
                Enlace creado
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                  Enlace corto
                </span>
                <span className="font-mono text-primary text-sm md:text-base break-all">
                  {result.shortUrl}
                </span>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
                  Página de estadísticas
                </span>
                <a
                  href={result.statsUrl}
                  className="font-mono text-on-surface text-sm md:text-base break-all hover:text-primary transition-colors"
                >
                  {result.statsUrl}
                </a>
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={() => copyValue(result.shortUrl, "shortUrl")}
                className="bg-primary-container/20 text-primary border border-primary-container/30 font-medium py-2 px-4 rounded-xl hover:bg-primary-container/30 transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Copy className="w-4 h-4" />
                {copiedKey === "shortUrl" ? "Copiado" : "Copiar enlace"}
              </button>
              <a
                href={result.statsUrl}
                className="bg-surface-container text-on-surface border border-outline-variant font-medium py-2 px-4 rounded-xl hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <ExternalLink className="w-4 h-4" />
                Ver estadísticas
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InfoCard label="Slug" value={result.slug} />
            <InfoCard label="Expira" value={formatDateTime(result.expiresAt)} />
            <InfoCard
              label="Token privado"
              value={result.managementToken}
              actionLabel={copiedKey === "token" ? "Copiado" : "Copiar token"}
              onAction={() => copyValue(result.managementToken, "token")}
            />
          </div>

          <div className="mt-5 rounded-2xl border border-outline-variant bg-surface-container-lowest px-4 py-3 text-sm text-on-surface-variant flex items-start gap-3">
            <Hourglass className="w-4 h-4 mt-0.5 shrink-0 text-primary-container" />
            <p>
              Guarda el token privado si quieres borrar este enlace más tarde.
              No se vuelve a mostrar completo después de cerrar esta pantalla.
            </p>
          </div>
        </div>
      ) : null}

      <div className="w-full max-w-4xl">
        <h3 className="text-lg font-bold text-on-surface mb-6">
          Política de uso de la demo
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <PolicyCard
            icon={<Hourglass className="w-6 h-6" />}
            title="Expiración"
            description="Los enlaces demo expiran automáticamente a los 7 días."
          />
          <PolicyCard
            icon={<ShieldAlert className="w-6 h-6" />}
            title="Privacidad"
            description="No guardamos IP en texto plano y la analítica es agregada."
          />
          <PolicyCard
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Token privado"
            description="El token de gestión permite borrar el enlace después."
          />
          <PolicyCard
            icon={<Sparkles className="w-6 h-6" />}
            title="Límite por IP"
            description="Solo se aceptan 3 URLs por IP cada 24 horas."
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  actionLabel,
  onAction,
}: {
  label: string;
  value: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-3xl p-4 flex flex-col gap-3 min-w-0">
      <span className="text-xs font-semibold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-mono text-on-surface break-all">
          {value}
        </span>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="shrink-0 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
          >
            {actionLabel}
          </button>
        ) : null}
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
