import {
  BADGE_DEFINITIONS,
  DECAY_GRACE_DAYS,
  DECAY_POINTS_PER_WEEK,
  FORMAT_MULTIPLIERS,
  GHOST_INACTIVE_DAYS,
  SKILL_LEVELS,
} from "@/lib/constants";

function Section({
  title,
  children,
  emoji,
}: {
  title: string;
  children: React.ReactNode;
  emoji?: string;
}) {
  return (
    <section className="rounded-2xl border border-white/5 bg-white/5 p-5">
      <h2 className="flex items-center gap-2 text-lg font-bold text-white">
        {emoji && <span>{emoji}</span>}
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-zinc-300">
        {children}
      </div>
    </section>
  );
}

function MultiplierRow({
  label,
  detail,
  multiplier,
  highlight,
}: {
  label: string;
  detail: string;
  multiplier: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 ${
        highlight ? "bg-lime-400/10 border border-lime-400/20" : "bg-black/20"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-white">{label}</p>
        <p className="text-xs text-zinc-400">{detail}</p>
      </div>
      <span
        className={`shrink-0 text-lg font-black ${
          highlight ? "text-lime-400" : "text-zinc-200"
        }`}
      >
        {multiplier}
      </span>
    </div>
  );
}

export function RulesGuide() {
  return (
    <div className="space-y-4 pb-4">
      <Section title="La idea general" emoji="🎾">
        <p>
          Cada jugador tiene un puntaje (<strong className="text-lime-400">Elo</strong>).
          Cuando ganás, sumás puntos; cuando perdés, restás. Cuánto ganás o perdés
          depende de <strong className="text-white">contra quién jugaste</strong>,{" "}
          <strong className="text-white">el formato</strong> y{" "}
          <strong className="text-white">qué tan dominante fue el partido</strong>.
        </p>
        <p>
          Si le ganás a alguien que te saca muchos puntos, la victoria vale oro.
          Si le ganás a alguien muy abajo en el ranking, sumás poquito — y si perdés,
          te duela más.
        </p>
      </Section>

      <Section title="Puntos de arranque" emoji="🚀">
        <p>Elegís tu nivel al registrarte y arrancás con estos puntos:</p>
        <div className="grid grid-cols-2 gap-2">
          {SKILL_LEVELS.map((level) => (
            <div
              key={level.value}
              className="rounded-xl bg-black/20 px-3 py-2 text-center"
            >
              <p className="font-semibold text-white">{level.label}</p>
              <p className="text-lime-400 font-bold">{level.rating} pts</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-zinc-500">
          Ese puntaje base también es tu piso: por inactividad no podés caer por
          debajo de lo que arrancaste.
        </p>
      </Section>

      <Section title="Cómo se calcula cada partido" emoji="🧮">
        <div id="calculo" className="scroll-mt-24" />
        <p>
          No hace falta memorizar fórmulas. Al cargar un partido, la app te muestra{" "}
          <strong className="text-white">cuánto sumaría o restaría cada uno</strong>{" "}
          antes de guardar.
        </p>
        <p>En resumen, tres cosas mueven el puntaje:</p>
        <div className="space-y-2">
          <MultiplierRow
            label="Contra quién jugaste"
            detail="Ganarle a alguien mejor = mucho. Ganarle a alguien peor = poco."
            multiplier="★★★"
            highlight
          />
          <MultiplierRow
            label="Formato"
            detail="Singles y Bo5 valen un poco más que dobles o Bo3"
            multiplier="★★"
          />
          <MultiplierRow
            label="Sets corridos"
            detail="2-0 en Bo3 o 3-0 en Bo5 = bonus"
            multiplier="★"
          />
        </div>
      </Section>

      <Section title="Ejemplos rápidos" emoji="💡">
        <div className="space-y-3">
          <div className="rounded-xl bg-black/20 p-3">
            <p className="font-semibold text-lime-400">Victoria valiosa</p>
            <p className="text-xs text-zinc-400">
              Vos 1200 le ganás a alguien de 1500 → sumás bastante (~+25 o más).
            </p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="font-semibold text-white">Partido parejo</p>
            <p className="text-xs text-zinc-400">
              Dos jugadores similares (~±50 pts) → movimiento normal (~±16).
            </p>
          </div>
          <div className="rounded-xl bg-black/20 p-3">
            <p className="font-semibold text-red-400">Eras favorito</p>
            <p className="text-xs text-zinc-400">
              Vos 1500 le ganás a alguien de 1200 → sumás poco (~+5). Si perdés, restás
              mucho.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Multiplicador por formato" emoji="⚡">
        <p>Arriesgás más en singles largos; en dobles el peso baja un poco.</p>
        <div className="space-y-2">
          <MultiplierRow
            label="Singles · Mejor de 5"
            detail="1v1 al Bo5"
            multiplier={`×${FORMAT_MULTIPLIERS["1v1_bo5"]}`}
            highlight
          />
          <MultiplierRow
            label="Singles · Mejor de 3"
            detail="1v1 al Bo3"
            multiplier={`×${FORMAT_MULTIPLIERS["1v1_bo3"]}`}
          />
          <MultiplierRow
            label="Dobles · Mejor de 5"
            detail="2v2 al Bo5"
            multiplier={`×${FORMAT_MULTIPLIERS["2v2_bo5"]}`}
          />
          <MultiplierRow
            label="Dobles · Mejor de 3"
            detail="2v2 al Bo3"
            multiplier={`×${FORMAT_MULTIPLIERS["2v2_bo3"]}`}
          />
        </div>
      </Section>

      <Section title="Sets corridos" emoji="🏆">
        <p>¿Ganaste sin regalar sets? Bonus.</p>
        <div className="space-y-2">
          <MultiplierRow
            label="Paseo / Baile"
            detail="3-0 en Bo5, o 2-0 en Bo3"
            multiplier="×1.2"
            highlight
          />
          <MultiplierRow
            label="Partido trabajado"
            detail="3-1, 3-2 en Bo5 · 2-1 en Bo3"
            multiplier="×1.0"
          />
        </div>
      </Section>

      <Section title="Dobles (2v2)" emoji="👥">
        <p>
          El Elo del equipo es el <strong className="text-white">promedio</strong>{" "}
          de los dos jugadores. Los puntos ganados o perdidos se reparten{" "}
          <strong className="text-white">en partes iguales</strong> entre los
          compañeros del mismo equipo.
        </p>
        <div className="rounded-xl bg-black/20 p-3 text-xs text-zinc-400">
          Ejemplo: si el equipo gana +24 pts, cada uno suma +24. Si pierde −24,
          cada uno resta −24.
        </div>
      </Section>

      <Section title="Fantasmas 👻" emoji="😴">
        <p>
          Si pasan más de <strong className="text-white">{GHOST_INACTIVE_DAYS} días</strong>{" "}
          sin cargar ningún partido, aparece el sello de fantasma en el ranking.
        </p>
        <p>
          A partir del día {DECAY_GRACE_DAYS + 1}, se descuentan{" "}
          <strong className="text-red-400">{DECAY_POINTS_PER_WEEK} pts</strong>{" "}
          por cada semana extra sin jugar — sin bajar de tu puntaje base inicial.
        </p>
        <p className="text-xs text-zinc-500">
          Moraleja: no te quedes arriba del ranking sin jugar. La cancha te reclama.
        </p>
      </Section>

      <Section title="Medallas" emoji="🏅">
        <p>Se desbloquean solas cuando lográs estos hitos:</p>
        <div className="space-y-2">
          {Object.values(BADGE_DEFINITIONS).map((badge) => (
            <div
              key={badge.label}
              className="flex items-start gap-3 rounded-xl bg-black/20 px-3 py-2.5"
            >
              <span className="text-2xl">{badge.emoji}</span>
              <div>
                <p className="font-semibold text-white">{badge.label}</p>
                <p className="text-xs text-zinc-400">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Ranking" emoji="📊">
        <ul className="list-inside list-disc space-y-2 text-zinc-400">
          <li>
            <strong className="text-zinc-200">Histórico:</strong> orden por puntaje
            actual.
          </li>
          <li>
            <strong className="text-zinc-200">Jugador del Mes:</strong> quién más
            puntos netos sumó en el mes calendario.
          </li>
          <li>
            La racha muestra tus últimos 5 partidos:{" "}
            <span className="text-lime-400 font-bold">V</span> = victoria,{" "}
            <span className="text-red-400 font-bold">D</span> = derrota.
          </li>
        </ul>
      </Section>

      <Section title="Ejemplo completo" emoji="🎾">
        <p>
          Sos <strong className="text-white">Intermedio (1200 pts)</strong> y le ganás
          en singles Bo5 por 3-0 a alguien de{" "}
          <strong className="text-white">1500 pts</strong>:
        </p>
        <ol className="list-inside list-decimal space-y-1 text-zinc-400">
          <li>Victoria valiosa — rival mucho mejor</li>
          <li>Singles Bo5 — cuenta más</li>
          <li>Sets corridos — bonus</li>
        </ol>
        <p className="text-lime-400 font-semibold">
          La app te lo muestra en números antes de guardar. Papá.
        </p>
      </Section>
    </div>
  );
}
