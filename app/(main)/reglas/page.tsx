import { RulesGuide } from "@/components/RulesGuide";
import { AppHeader } from "@/components/AppHeader";

export default function ReglasPage() {
  return (
    <div>
      <AppHeader
        title="Reglas & Scoring"
        subtitle="Todo lo que necesitás saber para entender el ranking"
      />
      <RulesGuide />
    </div>
  );
}
