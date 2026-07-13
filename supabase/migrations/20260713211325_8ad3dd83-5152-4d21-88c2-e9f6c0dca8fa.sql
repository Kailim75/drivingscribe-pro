-- Nettoyage: supprimer la facture F-2026-040 vide (0 lignes) créée avant le déploiement du rollback frontend
DELETE FROM public.invoices
WHERE id = '09fae6e7-c493-47a4-92da-02f019001329'
  AND NOT EXISTS (SELECT 1 FROM public.invoice_lines WHERE invoice_id = invoices.id);