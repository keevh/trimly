import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  History,
  Hourglass,
  Link2,
  MonitorSmartphone,
  MousePointerClick,
  ShieldAlert,
  Share2,
  Trash2,
} from "lucide-react";

export type StatsPayload = {
  slug: string;
  shortUrl?: string | null;
  destinationUrl: string;
  createdAt: string;
  expiresAt: string;
  status: "active" | "expired";
  totalClicks: number;
  lastClickedAt: string | null;
  clicksByDay: Array<{ date: string; clicks: number }>;
  topReferrers: Array<{ source: string; clicks: number }>;
  topDevices: Array<{ device: string; clicks: number }>;
  topCountries: Array<{ countryCode: string; clicks: number }>;
};

function formatDate(value: string | null) {
  if (!value) {
    return "Sin clicks todavía";
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDistance(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diff / 60000));

  if (minutes < 1) {
    return "hace unos segundos";
  }

  if (minutes < 60) {
    return `hace ${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

function formatExpiration(value: string, status?: "active" | "expired") {
  if (status === "expired") {
    return "Expirado";
  }

  const diff = new Date(value).getTime() - Date.now();
  const hours = Math.max(0, Math.floor(diff / 3600000));

  if (hours < 1) {
    return "Expira pronto";
  }

  if (hours < 24) {
    return `En ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `En ${days} d`;
}

function toChartData(clicksByDay: Array<{ date: string; clicks: number }>) {
  return clicksByDay.map((entry) => ({
    label: new Intl.DateTimeFormat("es-CO", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    }).format(
      new Date(`${entry.date}T00:00:00`),
    ),
    date: entry.date,
    clicks: entry.clicks,
  }));
}

function getPercent(value: number, total: number) {
  if (!total) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

function formatReferrerLabel(value: string) {
  if (value === "Direct / sin referer") {
    return "Directo";
  }

  return value;
}

function formatCountryLabel(value: string) {
  if (!value || value === "Unknown") {
    return "Sin país";
  }

  if (value.length !== 2) {
    return value;
  }

  try {
    const displayNames = new Intl.DisplayNames(["es"], { type: "region" });
    return displayNames.of(value) ?? value;
  } catch {
    return value;
  }
}

function formatDeviceLabel(value: string) {
  if (value === "cli") {
    return "CLI";
  }

  if (value === "unknown") {
    return "Sin identificar";
  }

  return value;
}

export default function Stats({
  slug,
  initialStats,
  shortUrl,
}: {
  slug: string;
  initialStats: StatsPayload | null;
  shortUrl: string;
}) {
  const [stats, setStats] = useState<StatsPayload | null>(initialStats);
  const [copied, setCopied] = useState(false);
  const [managementToken, setManagementToken] = useState("");
  const [deleteState, setDeleteState] = useState<{
    loading: boolean;
    error: string | null;
    deleted: boolean;
  }>({
    loading: false,
    error: null,
    deleted: false,
  });

  const chartData: Array<{ label: string; date: string; clicks: number }> = useMemo(
    () => toChartData(stats?.clicksByDay ?? []),
    [stats],
  );
  const chartMaxClicks = chartData.reduce(
    (max, entry) => Math.max(max, entry.clicks),
    1,
  );
  const totalClicks = stats?.totalClicks ?? 0;
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayClicks =
    stats?.clicksByDay.find((entry) => entry.date === todayKey)?.clicks ?? 0;
  const hasData = Boolean(stats);

  const topReferrers: StatsPayload["topReferrers"] = stats?.topReferrers ?? [];
  const topDevices: StatsPayload["topDevices"] = stats?.topDevices ?? [];
  const topCountries: StatsPayload["topCountries"] = stats?.topCountries ?? [];
  const activeStats = stats as StatsPayload;

  useEffect(() => {
    if (stats || deleteState.deleted) {
      return;
    }

    let cancelled = false;

    const loadStats = async () => {
      try {
        const response = await fetch(`/api/links/${encodeURIComponent(slug)}/stats`);
        const payload = await response.json().catch(() => null);

        if (!response.ok || cancelled || !payload) {
          return;
        }

        setStats(payload as StatsPayload);
      } catch {
        // leave the empty state visible
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [deleteState.deleted, slug, stats]);

  const copyShortUrl = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const handleDelete = async () => {
    if (!managementToken.trim()) {
      setDeleteState({
        loading: false,
        error: "Debes ingresar el token privado.",
        deleted: false,
      });
      return;
    }

    setDeleteState({ loading: true, error: null, deleted: false });

    try {
      const response = await fetch(`/api/links/${encodeURIComponent(slug)}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ managementToken: managementToken.trim() }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setDeleteState({
          loading: false,
          error: payload?.message ?? "No se pudo eliminar el enlace.",
          deleted: false,
        });
        return;
      }

      setStats(null);
      setDeleteState({ loading: false, error: null, deleted: true });
    } catch {
      setDeleteState({
        loading: false,
        error: "No se pudo conectar con el servidor.",
        deleted: false,
      });
    }
  };

  return (
    <div
      className="w-full flex-grow pt-10 pb-20 px-4 md:px-8 max-w-6xl mx-auto"
      data-stats-page
      data-slug={slug}
      data-short-url={shortUrl}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-on-surface tracking-tight">
            Estadísticas del enlace
          </h1>
          <p className="text-sm text-on-surface-variant">
            Ruta pública: <span className="font-mono text-on-surface">{shortUrl.replace(/^https?:\/\//, "")}</span>
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={copyShortUrl}
            className="bg-primary-container/20 text-primary border border-primary-container/30 font-medium py-2 px-4 rounded-xl hover:bg-primary-container/30 transition-colors flex items-center justify-center gap-2 text-sm"
            type="button"
            data-copy-short-url
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span data-copy-short-url-label>{copied ? "Copiado" : "Copiar enlace"}</span>
          </button>
          <a
            href={activeStats?.destinationUrl ?? "#"}
            target={activeStats?.destinationUrl ? "_blank" : undefined}
            rel={activeStats?.destinationUrl ? "noreferrer" : undefined}
            aria-disabled={!activeStats?.destinationUrl}
            className={`bg-surface-container-low text-on-surface border border-outline-variant font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-[inset_0_1px_rgba(255,255,255,0.05)] ${
              activeStats?.destinationUrl ? "hover:bg-surface-container" : "opacity-50 pointer-events-none"
            }`}
          >
            <ExternalLink className="w-4 h-4" />
            Abrir enlace
          </a>
        </div>
      </div>

      {deleteState.deleted ? (
        <div className="mb-6 rounded-2xl border border-[#10b981]/30 bg-[#10b981]/10 px-4 py-3 text-sm text-[#86efac]">
          El enlace fue eliminado correctamente.
        </div>
      ) : null}

      {!hasData ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 shadow-lg shadow-black/10 mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-primary-container">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="text-lg font-bold text-on-surface">
              No encontramos datos para este slug
            </h3>
          </div>
          <p className="text-on-surface-variant max-w-2xl">
            El enlace aún no existe o ya fue limpiado por expiración. Si acabas
            de crear uno, revisa el token privado en la pantalla anterior y
            vuelve a intentarlo con el slug correcto.
          </p>
        </div>
      ) : (
        <>
          <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 shadow-lg shadow-black/10 mb-6 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-3">
                  <Link2 className="w-5 h-5 text-primary-container shrink-0" />
                  <span className="font-bold text-primary text-lg truncate">
                    {shortUrl.replace("https://", "").replace("http://", "")}
                  </span>
                </div>
                <div className="flex items-center gap-3 pl-8 text-on-surface-variant">
                  <span className="text-outline">↳</span>
                  <span className="text-sm truncate">
                    {activeStats.destinationUrl.replace(/^https?:\/\//, "")}
                  </span>
                </div>
              </div>

              <div
                className={`border px-3 py-1 rounded-full flex items-center gap-2 shrink-0 self-start md:self-auto text-sm font-medium ${
                  activeStats.status === "active"
                    ? "bg-[#10b981]/10 text-[#34d399] border-[#10b981]/30"
                    : "bg-error-container/20 text-error border-error/30"
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                {activeStats.status === "active" ? "Activo" : "Expirado"}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 mt-2 pt-4 border-t border-outline-variant text-sm text-on-surface-variant font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-outline" />
                <span>Creado: {formatDate(activeStats.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-outline" />
                <span>Expira: {formatExpiration(activeStats.expiresAt, activeStats.status)}</span>
              </div>
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-outline" />
                <span>Último clic: {formatDate(activeStats.lastClickedAt)}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricCard
              label="Total de clics"
              value={String(totalClicks)}
              icon={<Share2 className="w-4 h-4" />}
            />
            <MetricCard
              label="Clics hoy"
              value={String(todayClicks)}
              icon={<MousePointerClick className="w-4 h-4" />}
              emphasized
            />
            <MetricCard
              label="Último clic"
              value={activeStats.lastClickedAt ? formatDistance(activeStats.lastClickedAt) : "Sin actividad"}
              icon={<History className="w-4 h-4" />}
            />
              <MetricCard
                label="Tiempo restante"
              value={formatExpiration(activeStats.expiresAt, activeStats.status)}
                icon={<Hourglass className="w-4 h-4" />}
              />
          </div>

          <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 shadow-lg shadow-black/10 mb-6 flex flex-col">
            <div className="flex items-center gap-2 mb-6">
              <Share2 className="w-5 h-5 text-primary-container" />
              <h3 className="text-lg font-bold text-on-surface">Clics recientes</h3>
            </div>

            {totalClicks > 0 ? (
              <div className="w-full overflow-x-auto">
                <div
                  className="grid gap-3 items-end min-h-64"
                  style={{
                    gridTemplateColumns: `repeat(${chartData.length || 1}, minmax(5rem, 1fr))`,
                  }}
                >
                  {chartData.map((entry) => {
                    const percent = Math.max(8, Math.round((entry.clicks / chartMaxClicks) * 100));

                    return (
                      <div key={`${entry.date}-${entry.clicks}`} className="flex flex-col items-center gap-2">
                        <div className="w-full h-56 flex items-end">
                          <div
                            className="w-full rounded-t-xl bg-primary-container transition-all"
                            style={{ height: `${percent}%` }}
                            title={`${entry.label} (${entry.date}): ${entry.clicks} clics`}
                          />
                        </div>
                        <span className="text-xs text-on-surface-variant capitalize">
                          {entry.label}
                        </span>
                        <span className="text-sm font-semibold text-on-surface">
                          {entry.clicks}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="flex-grow grid place-items-center rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest text-center px-6">
                <div className="max-w-sm">
                  <p className="text-on-surface font-semibold mb-2">
                    Aún no hay clics para este enlace
                  </p>
                  <p className="text-sm text-on-surface-variant">
                    Comparte el enlace corto para empezar a ver actividad.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <BreakdownCard
              title="FUENTES DE TRÁFICO"
              icon={<Share2 className="w-4 h-4" />}
              items={topReferrers.map((item) => ({
                label: formatReferrerLabel(item.source),
                value: item.clicks,
              }))}
              total={totalClicks}
              emptyLabel="Sin fuentes registradas todavía"
            />
            <BreakdownCard
              title="DISPOSITIVOS"
              icon={<MonitorSmartphone className="w-4 h-4" />}
              items={topDevices.map((item) => ({
                label: formatDeviceLabel(item.device),
                value: item.clicks,
              }))}
              total={totalClicks}
              emptyLabel="Sin dispositivos registrados todavía"
            />
            <BreakdownCard
              title="UBICACIONES PRINCIPALES"
              icon={<Globe className="w-4 h-4" />}
              items={topCountries.map((item) => ({
                label: formatCountryLabel(item.countryCode),
                value: item.clicks,
              }))}
              total={totalClicks}
              emptyLabel="Sin países registrados todavía"
            />
          </div>
        </>
      )}

      {hasData ? (
        <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 shadow-lg shadow-black/10">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 items-start">
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-widest text-on-surface-variant mb-2">
                Eliminar enlace
              </h4>
              <p className="text-sm text-on-surface-variant">
                Ingresa el token privado para borrar este enlace y todos sus eventos.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={managementToken}
                onChange={(event) => setManagementToken(event.target.value)}
                placeholder="management token"
                className="min-w-0 sm:w-96 px-4 py-3 bg-surface-container border border-outline-variant rounded-xl text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-all font-mono text-sm"
                data-management-token-input
              />
              <button
                className="bg-error-container/20 text-error border border-error/30 font-medium py-3 px-4 rounded-xl hover:bg-error-container/40 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-70 disabled:cursor-not-allowed"
                type="button"
                onClick={handleDelete}
                disabled={deleteState.loading}
                data-delete-link-button
              >
                <Trash2 className="w-4 h-4" />
                <span data-delete-link-label>
                  {deleteState.loading ? "Eliminando..." : "Eliminar enlace"}
                </span>
              </button>
            </div>
          </div>
          <p
            className={`mt-3 text-sm ${deleteState.error ? "text-error" : "text-transparent"}`}
            aria-live="polite"
            data-delete-status
          >
            {deleteState.error ?? ""}
          </p>
        </div>
      ) : null}

      <div className="text-center mt-6">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low/50 text-on-surface-variant rounded-full text-xs font-medium border border-outline-variant border-dashed">
          <ShieldAlert className="w-4 h-4" />
          Las estadísticas son públicas por slug y la eliminación requiere token privado.
        </span>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon,
  emphasized = false,
}: {
  label: string;
  value: string;
  icon: ReactNode;
  emphasized?: boolean;
}) {
  if (emphasized) {
    return (
      <div className="bg-primary-container border border-primary-container/30 rounded-3xl p-6 flex flex-col gap-2 relative overflow-hidden shadow-lg shadow-primary-container/20">
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
        <div className="flex items-center gap-2 text-on-primary-container mb-1 relative z-10">
          {icon}
          <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
        </div>
        <span className="text-3xl font-bold text-white relative z-10">{value}</span>
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-6 flex flex-col gap-2 relative overflow-hidden">
      <div className="flex items-center gap-2 text-on-surface-variant mb-1">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <span className="text-3xl font-bold text-on-surface">{value}</span>
    </div>
  );
}

function BreakdownCard({
  title,
  icon,
  items,
  total,
  emptyLabel,
}: {
  title: string;
  icon: ReactNode;
  items: Array<{ label: string; value: number }>;
  total: number;
  emptyLabel: string;
}) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 shadow-lg shadow-black/10">
      <h4 className="text-xs font-semibold text-outline uppercase tracking-widest mb-6 flex items-center gap-2">
        {icon} {title}
      </h4>
      {items.length === 0 ? (
        <p className="text-sm text-on-surface-variant">{emptyLabel}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {items.map((item) => (
            <ProgressBar
              key={`${item.label}-${item.value}`}
              label={item.label}
              value={item.value}
              percent={getPercent(item.value, total)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProgressBar({
  label,
  value,
  percent,
}: {
  label: string;
  value: number;
  percent: number;
}) {
  return (
    <div className="flex items-center gap-4 text-sm font-medium">
      <span className="w-32 min-w-0 text-on-surface-variant truncate">{label}</span>
      <div className="flex-grow flex items-center gap-2">
        <div className="h-2 flex-grow bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-container rounded-full"
            style={{ width: `${Math.max(4, percent)}%` }}
          />
        </div>
        <span className="w-14 text-right text-on-surface font-semibold">
          {value}
        </span>
      </div>
    </div>
  );
}
