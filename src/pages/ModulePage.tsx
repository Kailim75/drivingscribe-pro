import { motion } from "framer-motion";
import { Construction } from "lucide-react";

interface ModulePageProps {
  title: string;
  description: string;
  icon?: React.ElementType;
}

export default function ModulePage({ title, description, icon: Icon = Construction }: ModulePageProps) {
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
        <p className="text-muted-foreground text-sm mt-0.5">{description}</p>
      </div>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-xl flex flex-col items-center justify-center py-20 text-center"
      >
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Module en préparation</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Ce module sera disponible prochainement. L'architecture est prête pour l'intégration.
        </p>
      </motion.div>
    </div>
  );
}
