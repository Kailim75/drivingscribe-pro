import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function AuthPage() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (user) return <Navigate to="/tableau-de-bord" replace />;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-lg">DS</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">DriveSync</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion & rentabilité pour professionnels de la conduite
          </p>
        </div>

        <div className="glass-card rounded-xl p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-secondary rounded-lg p-0.5 mb-6">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Connexion
            </button>
            <button
              onClick={() => setMode("signup")}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${mode === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Inscription
            </button>
          </div>

          {mode === "login" ? <LoginForm /> : <SignupForm onSuccess={() => setMode("login")} />}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © {new Date().getFullYear()} DriveSync. Tous droits réservés.
        </p>
      </motion.div>
    </div>
  );
}

function LoginForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) setError(error.message === "Invalid login credentials" ? "Email ou mot de passe incorrect" : error.message);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full bg-secondary text-secondary-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
          placeholder="vous@exemple.fr" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Mot de passe</label>
        <div className="relative">
          <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full bg-secondary text-secondary-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary pr-10"
            placeholder="••••••••" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Se connecter
      </button>
    </form>
  );
}

function SignupForm({ onSuccess }: { onSuccess: () => void }) {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Le mot de passe doit contenir au moins 6 caractères"); return; }
    setLoading(true);
    const { error } = await signUp(email, password, firstName, lastName);
    if (error) { setError(error.message); } else { setSuccess(true); }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-success text-xl">✓</span>
        </div>
        <h3 className="font-semibold text-foreground mb-1">Compte créé !</h3>
        <p className="text-sm text-muted-foreground mb-4">Vérifiez votre email pour confirmer votre compte.</p>
        <button onClick={onSuccess} className="text-sm text-primary hover:underline">Retour à la connexion</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Prénom</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required
            className="w-full bg-secondary text-secondary-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Nom</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required
            className="w-full bg-secondary text-secondary-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full bg-secondary text-secondary-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="vous@exemple.fr" />
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Mot de passe</label>
        <div className="relative">
          <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required
            className="w-full bg-secondary text-secondary-foreground text-sm px-3 py-2.5 rounded-lg border border-border focus:outline-none focus:ring-1 focus:ring-primary pr-10"
            placeholder="Min. 6 caractères" />
          <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Créer mon compte
      </button>
    </form>
  );
}
