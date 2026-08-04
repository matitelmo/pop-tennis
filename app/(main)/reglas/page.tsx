import { RulesGuide } from "@/components/RulesGuide";

export default function ReglasPage() {
  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-black text-white">Reglas & Scoring</h1>
        <p className="text-sm text-zinc-400">
          Todo lo que necesitás saber para entender el ranking
        </p>
      </header>
      <RulesGuide />
    </div>
  );
}
