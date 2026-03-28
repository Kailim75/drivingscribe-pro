import { Navigate } from "react-router-dom";

// Redirect to merged Invoicing page with grouped billing tab
export default function GroupedBilling() {
  return <Navigate to="/facturation?tab=groupee" replace />;
}
