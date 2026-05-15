import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ClipboardPaste,
  Code,
  Copy,
  Route,
  Scissors,
} from "lucide-react";

const installCommand =
  "docker compose up --build";

export default function Landing() {
  const [copied, setCopied] = useState(false);

  const handleCopyFull = async () => {
    await navigator.clipboard.writeText(installCommand);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full">
      <section className="relative pt-24 pb-16 px-4 md:px-10 max-w-5xl mx-auto w-full text-center overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -z-10 pointer-events-none" />

        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-on-surface max-w-4xl mx-auto mb-6">
          Recorta enlaces. Compártelos fácil.
          <br />
          <span className="text-primary-container">Mantén el control.</span>
        </h1>
        <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
          Trimly es un acortador de enlaces open source, ligero y self-hosted
          para proyectos personales, demos y despliegues propios con Astro,
          React y Postgres.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
          <a
            href="/demo"
            className="bg-primary-container text-white font-medium py-3 px-8 rounded-lg hover:bg-primary transition-colors w-full sm:w-auto shadow-lg shadow-primary/30"
          >
            Probar demo
          </a>
          <a
            href="https://github.com/keevh/trimly"
            target="_blank"
            rel="noreferrer"
            className="bg-transparent border border-outline-variant text-on-surface font-medium py-3 px-8 rounded-lg hover:bg-surface-container transition-colors w-full sm:w-auto flex items-center justify-center gap-2"
          >
            <Code className="w-5 h-5 text-primary-container" />
            Ver en GitHub
          </a>
        </div>

        <div className="max-w-3xl mx-auto bg-surface-container border border-outline-variant rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex-1 bg-surface-container-lowest rounded-2xl p-4 w-full text-left overflow-hidden border border-outline-variant/60">
            <p className="font-mono text-sm text-on-surface-variant truncate">
              https://verylonglink.com/with/lots/of/parameters/that/are/annoying
            </p>
          </div>
          <div className="hidden md:flex items-center text-on-surface shrink-0">
            <ArrowRight className="w-6 h-6" />
          </div>
          <div className="flex-1 bg-surface-container-lowest border border-primary-container/50 rounded-2xl p-4 w-full text-left overflow-hidden relative shadow-[0_0_15px_rgba(99,102,241,0.1)]">
            <p className="font-mono text-sm text-primary font-bold">
              trimly.keevh.dev/t/a9K2p
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 px-4 md:px-10 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-semibold text-center mb-16 text-on-surface">
          Cómo funciona
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<ClipboardPaste className="w-8 h-8" />}
            title="1. Pega"
            description="Introduce tu URL larga y desordenada en el campo principal."
          />
          <FeatureCard
            icon={<Scissors className="w-8 h-8" />}
            title="2. Recorta"
            description="Trimly genera un alias único, o puedes personalizar el tuyo propio."
          />
          <FeatureCard
            icon={<Route className="w-8 h-8" />}
            title="3. Redirige"
            description="Comparte el enlace corto y rastrea los clicks al instante."
          />
        </div>
      </section>

      <section className="py-24 bg-surface-container-lowest px-4 md:px-10 border-t border-outline-variant w-full">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-semibold mb-6 text-on-surface">
              Hospédalo a tu manera
            </h2>
            <p className="text-lg text-on-surface-variant mb-8 leading-relaxed">
              Toma el control total de tus datos. Despliega Trimly en tu propia
              infraestructura en minutos utilizando Docker. Privado, extensible
              y listo para producción.
            </p>
            <ul className="flex flex-col gap-4 mb-8">
              <li className="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                <span className="text-on-surface font-medium">
                  Despliegue rápido con Docker Compose
                </span>
              </li>
              <li className="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                <span className="text-on-surface font-medium">
                  Frontend y API en el mismo dominio
                </span>
              </li>
              <li className="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant">
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                <span className="text-on-surface font-medium">
                  Persistencia en Postgres con analytics reales
                </span>
              </li>
            </ul>
          </div>

          <div className="bg-surface-container rounded-3xl border border-outline-variant overflow-hidden shadow-2xl p-2">
            <div className="bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant flex flex-col h-full">
              <div className="bg-surface-container px-4 py-3 flex items-center justify-between border-b border-outline-variant">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error"></div>
                  <div className="w-3 h-3 rounded-full bg-[#eab308]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#22c55e]"></div>
                  <span className="ml-4 font-mono text-xs text-on-surface-variant font-medium">
                    bash
                  </span>
                </div>
                <button
                  onClick={handleCopyFull}
                  className="text-on-surface-variant hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center p-1.5 rounded-lg hover:bg-white/10"
                  title="Copiar comando completo"
                  type="button"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#34d399]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="p-8 overflow-x-auto flex-1 flex flex-col justify-center">
                <div className="flex flex-col gap-4">
                  <CommandLine>
                    <span className="text-primary font-semibold">mkdir</span>{" "}
                    trimly <span className="text-primary font-semibold">&amp;&amp; cd</span>{" "}
                    trimly
                  </CommandLine>
                  <CommandLine>
                    <span className="text-primary font-semibold">docker compose</span>{" "}
                    up --build
                  </CommandLine>
                  <div className="flex items-center gap-4 mt-2">
                    <code className="font-mono text-sm text-on-surface flex items-center h-5">
                      <span className="text-outline mr-3 select-none">~</span>
                      <span className="w-2 h-4 bg-on-surface-variant/70 inline-block animate-pulse"></span>
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-surface-container-low hover:bg-primary-container border border-outline-variant hover:border-primary-container p-8 rounded-3xl flex flex-col items-center text-center transition-all duration-300 hover:shadow-lg hover:shadow-primary-container/20 relative overflow-hidden hover:-translate-y-1">
      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative z-10 w-16 h-16 rounded-2xl bg-surface-container group-hover:bg-white/10 border border-outline-variant group-hover:border-white/20 flex items-center justify-center text-on-surface group-hover:text-white mb-6 transition-all duration-300">
        {icon}
      </div>
      <h3 className="relative z-10 text-xl font-semibold mb-3 text-on-surface group-hover:text-white transition-colors duration-300">
        {title}
      </h3>
      <p className="relative z-10 text-on-surface-variant group-hover:text-on-primary-container transition-colors duration-300">
        {description}
      </p>
    </div>
  );
}

function CommandLine({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <code className="font-mono text-sm text-on-surface whitespace-pre-wrap break-all sm:break-words">
        <span className="text-outline mr-3 select-none">~</span>
        {children}
      </code>
    </div>
  );
}
