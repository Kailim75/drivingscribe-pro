import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Loader2, CreditCard, Building2 } from "lucide-react";
import { useNoIndex } from "@/hooks/useNoIndex";

const formatEur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n);
const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const statusLabels: Record<string, { label: string; color: string }> = {
  brouillon: { label: "Brouillon", color: "bg-gray-100 text-gray-600" },
  envoyé: { label: "En attente de paiement", color: "bg-blue-50 text-blue-600" },
  partiellement_payé: { label: "Partiellement payé", color: "bg-amber-50 text-amber-600" },
  payé: { label: "Payé", color: "bg-emerald-50 text-emerald-600" },
  en_retard: { label: "En retard", color: "bg-red-50 text-red-600" },
  annulé: { label: "Annulé", color: "bg-gray-100 text-gray-500" },
  archivé: { label: "Archivé", color: "bg-gray-100 text-gray-500" },
};

export default function PublicInvoice() {
  useNoIndex();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("t");
  const legacyId = searchParams.get("id");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError(legacyId
        ? "Ce lien n'est plus valide — demandez un nouveau lien de paiement."
        : "Lien invalide");
      setLoading(false);
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-invoice?t=${token}`;
    fetch(url, { headers: { "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } })
      .then((r) => r.json())
      .then((d) => { if (d.error) throw new Error(d.error); setData(d); })
      .catch(() => setError("Document introuvable — demandez un nouveau lien de paiement."))
      .finally(() => setLoading(false));
  }, [token, legacyId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  if (error || !data) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center"><FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{error || "Document introuvable"}</p></div>
    </div>
  );

  const { invoice, organization } = data;
  const isDevis = invoice.type === "devis";
  const cfg = statusLabels[invoice.status] || statusLabels.brouillon;
  const studentName = invoice.students ? `${invoice.students.first_name} ${invoice.students.last_name}` : "";

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-900 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 opacity-60" />
                <span className="font-semibold">{organization?.name}</span>
              </div>
              <span className={`text-xs font-medium px-3 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div className="mt-4">
              <p className="text-sm opacity-60">{isDevis ? "Devis" : "Facture"}</p>
              <p className="text-2xl font-bold mt-1">{invoice.number}</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Client & dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Destinataire</p>
                <p className="font-medium mt-1">{studentName}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Échéance</p>
                <p className="font-medium mt-1">{formatDate(invoice.due_date)}</p>
              </div>
            </div>

            {/* Lines */}
            <div className="border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-2.5 font-medium text-gray-500">Description</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-center">Qté</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-right">P.U. HT</th>
                    <th className="px-4 py-2.5 font-medium text-gray-500 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.invoice_lines || []).map((l: any, i: number) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-4 py-2.5">{l.description}</td>
                      <td className="px-4 py-2.5 text-center">{l.quantity}</td>
                      <td className="px-4 py-2.5 text-right">{formatEur(l.unit_price)}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{formatEur(l.total_ht)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Total HT</span><span>{formatEur(invoice.total_ht)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">TVA</span><span>{formatEur(invoice.tva_amount)}</span></div>
              <div className="flex justify-between border-t pt-2 mt-2 text-base font-bold"><span>Total TTC</span><span>{formatEur(invoice.total_ttc)}</span></div>
              {!isDevis && invoice.paid_amount > 0 && (
                <>
                  <div className="flex justify-between text-emerald-600"><span>Déjà payé</span><span>{formatEur(invoice.paid_amount)}</span></div>
                  <div className="flex justify-between font-bold text-lg"><span>Reste à payer</span><span className="text-red-600">{formatEur(invoice.remaining_amount)}</span></div>
                </>
              )}
            </div>

            {/* Payment instructions */}
            {!isDevis && invoice.remaining_amount > 0 && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-800 text-sm">Informations de paiement</span>
                </div>
                <p className="text-sm text-blue-700">
                  Pour régler cette facture, veuillez effectuer un virement au nom de <strong>{organization?.name}</strong>.
                </p>
                {organization?.email && (
                  <p className="text-sm text-blue-600 mt-2">
                    Contact : {organization.email}
                    {organization.phone && ` · ${organization.phone}`}
                  </p>
                )}
              </div>
            )}

            {/* Paid badge */}
            {invoice.status === "payé" && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <p className="text-emerald-700 font-semibold">✓ Cette facture est intégralement réglée</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-3 text-center">
            <p className="text-xs text-gray-400">
              {organization?.name} {organization?.siret && `· SIRET ${organization.siret}`} {organization?.tva_number && `· TVA ${organization.tva_number}`}
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-300 mt-6">Document généré automatiquement</p>
      </div>
    </div>
  );
}
