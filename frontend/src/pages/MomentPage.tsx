import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { CinematicStage } from "@/app/interface/CinematicStage/CinematicStage";
import { findMoment } from "@/moments/moments";

export default function MomentPage() {
  const { momentId = "" } = useParams();
  const navigate = useNavigate();
  const [finished, setFinished] = useState(false);
  const moment = findMoment(momentId);

  useEffect(() => {
    setFinished(false);
  }, [momentId]);

  useEffect(() => {
    document.title = moment ? `${moment.title} — Babydoll` : "Momento não encontrado — Babydoll";
  }, [moment]);

  if (!moment) {
    return (
      <CinematicStage>
        <div
          style={{
            display: "grid",
            minHeight: "100dvh",
            placeItems: "center",
            gap: "1rem",
            padding: "1.5rem",
            textAlign: "center",
            background: "#0d0119",
            color: "#f7e6f6",
            fontFamily: "'Fredoka', system-ui, sans-serif",
          }}
        >
          <div>
            <p>Esse momento ainda não existe.</p>
            <Link to="/moments" style={{ color: "#ffb7ec" }} data-testid="moment-missing-back-link">
              voltar para o coração
            </Link>
          </div>
        </div>
      </CinematicStage>
    );
  }

  const Cinematic = moment.cinematic;

  // Lembrança reservada: rota válida, sem tela quebrada.
  if (!Cinematic) {
    return (
      <CinematicStage>
        <div
          style={{
            display: "grid",
            minHeight: "100dvh",
            placeItems: "center",
            padding: "1.5rem",
            textAlign: "center",
            background: "#0d0119",
            color: "#f7e6f6",
            fontFamily: "'Fredoka', system-ui, sans-serif",
          }}
          data-testid="moment-reserved"
        >
          <div>
            <p style={{ fontSize: "1.3rem", margin: "0 0 0.25rem" }}>{moment.title}</p>
            <p style={{ opacity: 0.7, margin: "0 0 1rem", letterSpacing: "0.08em" }}>em breve</p>
            <Link to="/moments" style={{ color: "#ffb7ec" }} data-testid="moment-reserved-back-link">
              voltar para o coração
            </Link>
          </div>
        </div>
      </CinematicStage>
    );
  }

  return (
    <CinematicStage>
      {finished ? (
        <div
          style={{
            display: "grid",
            minHeight: "100dvh",
            placeItems: "center",
            background: "#050008",
            fontFamily: "'Fredoka', system-ui, sans-serif",
          }}
        >
          <button
            type="button"
            data-testid="moment-back-to-hub-button"
            onClick={() => navigate("/moments")}
            style={{
              padding: "0.6rem 1.2rem",
              border: "1px solid rgba(255,183,236,0.35)",
              borderRadius: "999px",
              color: "#ffe3f8",
              background: "rgba(36,7,58,0.72)",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            voltar para o coração
          </button>
        </div>
      ) : (
        <Cinematic onComplete={() => setFinished(true)} />
      )}
    </CinematicStage>
  );
}
