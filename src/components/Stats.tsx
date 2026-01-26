import { useMemo, useState, type ReactNode } from "react";
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
import {
  Bar,
  BarChart as RechartsBarChart,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
} from "recharts";

const mockData = [
  { name: "Lun", clicks: 8 },
  { name: "Mar", clicks: 12 },
  { name: "Mié", clicks: 5 },
  { name: "Jue", clicks: 22 },
  { name: "Vie", clicks: 9 },
  { name: "Sáb", clicks: 14 },
  { name: "Dom", clicks: 4 },
];

export default function Stats({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const shortUrl = `https://trimly.keevh.dev/t/${id}`;
  const destinationUrl =
    "https://example.com/articulos/guia-completa-de-astro-react";
  const totalClicks = useMemo(
    () => mockData.reduce((sum, item) => sum + item.clicks, 0),
    [],
  );
  const todayClicks = mockData.at(-1)?.clicks ?? 0;

  const copyShortUrl = async () => {
    await navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="w-full flex-grow pt-10 pb-20 px-4 md:px-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-3xl font-bold text-on-surface tracking-tight">
          Estadísticas del enlace
        </h1>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={copyShortUrl}
            className="bg-primary-container/20 text-primary border border-primary-container/30 font-medium py-2 px-4 rounded-xl hover:bg-primary-container/30 transition-colors flex items-center justify-center gap-2 text-sm"
            type="button"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado" : "Copiar enlace"}
          </button>
          <a
            href={destinationUrl}
            target="_blank"
            rel="noreferrer"
            className="bg-surface-container-low text-on-surface border border-outline-variant font-medium py-2 px-4 rounded-xl hover:bg-surface-container transition-colors flex items-center justify-center gap-2 text-sm shadow-[inset_0_1px_rgba(255,255,255,0.05)]"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir enlace
          </a>
          <button
            className="bg-error-container/20 text-error border border-error/30 font-medium py-2 px-4 rounded-xl hover:bg-error-container/40 transition-colors flex items-center justify-center gap-2 text-sm"
            type="button"
          >
            <Trash2 className="w-4 h-4" />
            Eliminar enlace
          </button>
        </div>
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 shadow-lg shadow-black/10 mb-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-3">
              <Link2 className="w-5 h-5 text-primary-container shrink-0" />
              <span className="font-bold text-primary text-lg truncate">
                {shortUrl.replace("https://", "")}
              </span>
            </div>
            <div className="flex items-center gap-3 pl-8 text-on-surface-variant">
              <span className="text-outline">↳</span>
              <span className="text-sm truncate">{destinationUrl.replace("https://", "")}</span>
            </div>
          </div>

          <div className="bg-[#10b981]/10 text-[#34d399] border border-[#10b981]/30 px-3 py-1 rounded-full flex items-center gap-2 shrink-0 self-start md:self-auto text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            Activo
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-6 mt-2 pt-4 border-t border-outline-variant text-sm text-on-surface-variant font-medium">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-outline" />
            <span>Creado: Hace 2 horas</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-outline" />
            <span>Expira: En 22 horas</span>
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
          value="Hace 8 min"
          icon={<History className="w-4 h-4" />}
        />
        <MetricCard
          label="Tiempo restante"
          value="22h"
          icon={<Hourglass className="w-4 h-4" />}
        />
      </div>

      <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 shadow-lg shadow-black/10 mb-6 h-96 flex flex-col">
        <div className="flex items-center gap-2 mb-6">
          <Share2 className="w-5 h-5 text-primary-container" />
          <h3 className="text-lg font-bold text-on-surface">Clics recientes</h3>
        </div>
        <div className="flex-grow w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={mockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#a1a1aa", fontSize: 12 }}
                dy={10}
              />
              <RechartsTooltip
                cursor={{ fill: "#27272a" }}
                contentStyle={{
                  backgroundColor: "#18181b",
                  borderRadius: "16px",
                  border: "1px solid #3f3f46",
                  boxShadow: "0 4px 15px rgba(0, 0, 0, 0.5)",
                  padding: "12px 16px",
                }}
                itemStyle={{ color: "#818cf8", fontWeight: "bold" }}
                labelStyle={{
                  color: "#f4f4f5",
                  marginBottom: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                }}
              />
              <Bar dataKey="clicks" radius={[6, 6, 0, 0]}>
                {mockData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.clicks > 15 ? "#818cf8" : "#3f3f46"}
                  />
                ))}
              </Bar>
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <BreakdownCard
          title="FUENTES DE TRÁFICO"
          icon={<Share2 className="w-4 h-4" />}
          items={[
            ["Directo", 55],
            ["Redes sociales", 25],
            ["Referidos", 15],
            ["Otros", 5],
          ]}
        />
        <BreakdownCard
          title="DISPOSITIVOS"
          icon={<MonitorSmartphone className="w-4 h-4" />}
          items={[
            ["Móvil", 62],
            ["Escritorio", 34],
            ["Tablet", 4],
          ]}
        />
        <BreakdownCard
          title="UBICACIONES PRINCIPALES"
          icon={<Globe className="w-4 h-4" />}
          items={[
            ["Colombia", 48],
            ["México", 18],
            ["Estados Unidos", 12],
            ["Otros", 22],
          ]}
        />
      </div>

      <div className="text-center">
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container-low/50 text-on-surface-variant rounded-full text-xs font-medium border border-outline-variant border-dashed">
          <ShieldAlert className="w-4 h-4" />
          Las estadísticas son aproximadas y respetan la privacidad. Trimly no
          almacena información personal sensible.
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
        <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
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
}: {
  title: string;
  icon: ReactNode;
  items: [string, number][];
}) {
  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-3xl p-8 shadow-lg shadow-black/10">
      <h4 className="text-xs font-semibold text-outline uppercase tracking-widest mb-6 flex items-center gap-2">
        {icon} {title}
      </h4>
      <div className="flex flex-col gap-5">
        {items.map(([label, value]) => (
          <ProgressBar key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function ProgressBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 text-sm font-medium">
      <span className="w-24 text-on-surface-variant truncate">{label}</span>
      <div className="flex-grow flex items-center gap-2">
        <div className="h-2 flex-grow bg-surface-container rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-container rounded-full"
            style={{ width: `${value}%` }}
          ></div>
        </div>
        <span className="w-10 text-right text-on-surface font-semibold">
          {value}%
        </span>
      </div>
    </div>
  );
}
