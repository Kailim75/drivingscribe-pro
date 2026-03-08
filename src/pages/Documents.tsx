import { motion } from "framer-motion";
import { Search, FolderOpen, Download, FileText, File, Upload, Plus, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { useDocuments } from "@/hooks/useDocuments";
import { useStudents } from "@/hooks/useStudents";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const typeIcons: Record<string, React.ElementType> = {
  Identité: FileText,
  CERFA: FileText,
  Facture: FileText,
  Assurance: File,
  Autre: File,
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

export default function Documents() {
  const { documents, isLoading, upload, remove, getDownloadUrl } = useDocuments();
  const { students } = useStudents();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Autre", student_id: "", notes: "" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) || d.type.toLowerCase().includes(search.toLowerCase())
  );

  const handleUpload = () => {
    if (!selectedFile || !form.name) return;
    upload.mutate({
      file: selectedFile,
      name: form.name,
      type: form.type,
      student_id: form.student_id || undefined,
      notes: form.notes,
    }, { onSuccess: () => { setDialogOpen(false); setSelectedFile(null); } });
  };

  const handleDownload = async (filePath: string, name: string) => {
    const url = await getDownloadUrl(filePath);
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{documents.length} documents</p>
        </div>
        <button onClick={() => { setForm({ name: "", type: "Autre", student_id: "", notes: "" }); setSelectedFile(null); setDialogOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" /> Ajouter un document
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un document..." className="w-full bg-secondary text-secondary-foreground text-sm pl-9 pr-4 py-2 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground" />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
        {filtered.map((doc) => {
          const Icon = typeIcons[doc.type] || typeIcons.Autre;
          const linkedTo = doc.students ? `${doc.students.first_name} ${doc.students.last_name}` : doc.invoices?.number || "Organisation";
          return (
            <div key={doc.id} className="glass-card rounded-xl p-4 flex items-center gap-4 hover:border-primary/20 transition-colors">
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
                  <span>{doc.file_size}</span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:block">{formatDate(doc.created_at)}</span>
              {doc.file_path && (
                <button onClick={() => handleDownload(doc.file_path, doc.name)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-secondary text-muted-foreground transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              )}
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Ajouter un document</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/40 transition-colors" onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) { setSelectedFile(f); if (!form.name) setForm((prev) => ({ ...prev, name: f.name })); }
              }} />
              <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
              {selectedFile ? (
                <p className="text-sm text-foreground">{selectedFile.name}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Cliquer ou glisser-déposer</p>
              )}
            </div>
            <div>
              <Label>Nom du document</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="w-full mt-1 bg-secondary text-sm px-3 py-2 rounded-lg border border-border">
                  <option value="Identité">Identité</option>
                  <option value="CERFA">CERFA</option>
                  <option value="Facture">Facture</option>
                  <option value="Assurance">Assurance</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <Label>Élève (optionnel)</Label>
                <select value={form.student_id} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))} className="w-full mt-1 bg-secondary text-sm px-3 py-2 rounded-lg border border-border">
                  <option value="">Aucun</option>
                  {students.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="mt-1" />
            </div>
            <button onClick={handleUpload} disabled={upload.isPending || !selectedFile} className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {upload.isPending ? "Upload..." : "Ajouter"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
