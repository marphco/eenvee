import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AuthForm from "../../components/ui/AuthForm";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div style={{ position: "relative", width: "min(420px, 100%)" }}>
        {/* Link Torna alla Home Sopra la Card per la Route /login */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "0.75rem" }}>
          <span 
            onClick={() => navigate("/")} 
            style={{ 
              color: "var(--text-muted)", 
              fontSize: "0.85rem", 
              cursor: "pointer", 
              opacity: 0.6,
              transition: "opacity 0.2s",
              display: "flex",
              alignItems: "center",
              gap: "0.35rem"
            }}
            onMouseOver={(e: React.MouseEvent<HTMLSpanElement>) => (e.currentTarget.style.opacity = "1")}
            onMouseOut={(e: React.MouseEvent<HTMLSpanElement>) => (e.currentTarget.style.opacity = "0.6")}
            title="Torna alla Home"
          >
            <ArrowLeft size={14} /> Torna alla Home
          </span>
        </div>

        {/* L'intero Form Modulare Incastonato */}
        <AuthForm initialMode="login" onAuthSuccess={() => { window.location.href = "/dashboard"; }} />
      </div>
    </div>
  );
}
