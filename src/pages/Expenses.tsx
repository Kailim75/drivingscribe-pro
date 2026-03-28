import { Navigate } from "react-router-dom";

// Redirect to merged Profitability page with expenses tab
export default function Expenses() {
  return <Navigate to="/rentabilite?tab=depenses" replace />;
}
