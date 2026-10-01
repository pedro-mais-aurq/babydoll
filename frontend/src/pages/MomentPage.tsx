import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import { CinematicStage } from "@/app/interface/CinematicStage/CinematicStage";
import { findMoment } from "@/moments/moments";

export default function MomentPage() {
  const { momentId = "" } = useParams();
  const navigate = useNavigate();
  const moment = findMoment(momentId);

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

  // Ao terminar, a cinemática devolve o usuário ao coração sozinha: nada a clicar.
  return (
    <CinematicStage>
      <Cinematic onComplete={() => navigate("/moments")} />
    </CinematicStage>
  );
}
