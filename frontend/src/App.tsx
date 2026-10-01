import { Routes, Route, Link } from "react-router-dom";

import EntryPage from "@/pages/EntryPage";
import MomentsHubPage from "@/pages/MomentsHubPage";
import MomentPage from "@/pages/MomentPage";

function NotFound() {
  return (
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
    >
      <div>
        <h1 style={{ fontSize: "1.25rem", margin: 0 }}>Página não encontrada</h1>
        <p style={{ opacity: 0.75 }}>A página que você procura não existe ou mudou de lugar.</p>
        <Link to="/" style={{ color: "#ffb7ec" }} data-testid="not-found-home-link">
          voltar ao início
        </Link>
      </div>
    </div>
  );
}

// Uma <Route> por destino: link direto e refresh continuam funcionando.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<EntryPage />} />
      <Route path="/moments" element={<MomentsHubPage />} />
      <Route path="/moments/:momentId" element={<MomentPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
