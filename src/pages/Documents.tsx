import { motion } from "framer-motion";
import { Search, FolderOpen, Download, FileText, Image, File } from "lucide-react";
import { useState } from "react";
import { documents, getStudentName, invoices, formatDate } from "@/data/mockData";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  Identité: FileText,
  CERFA: FileText,
  Facture: FileText,
  Assurance: File,
  default: File,
};

export default function Documents() {
  const [search, setSearch] = useState("");

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{documents.length} documents</p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <FolderOpen className="w-4 h-4" /> Ajouter un document
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un document..." className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {filtered.map((doc) => {
          const Icon = typeIcons[doc.type] || typeIcons.default;
          const linkedTo = doc.studentId ? getStudentName(doc.studentId) : doc.invoiceId ? invoices.find((i) => i.id === doc.invoiceId)?.number : "Organisation";
          return (
            <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/20 transition-colors cursor-pointer">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                  <span>{doc.type}</span>
                  <span>·</span>
                  <span>{linkedTo}</span>
                  <span>·</span>
                  <span>{doc.size}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(doc.uploadedAt)}</span>
              <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground transition-colors">
                <Download className="w-4 h-4" />
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass-card rounded-xl flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-foreground">Aucun document</p>
            <p className="text-xs text-muted-foreground mt-1">Ajoutez vos premiers documents</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
