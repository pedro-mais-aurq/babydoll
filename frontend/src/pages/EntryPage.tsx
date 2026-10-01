import { useNavigate } from "react-router-dom";

import { Entry } from "@/app/interface/Entry/Entry";

export default function EntryPage() {
  const navigate = useNavigate();

  return <Entry onComplete={() => navigate("/moments")} />;
}
