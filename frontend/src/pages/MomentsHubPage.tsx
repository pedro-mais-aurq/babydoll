import { useNavigate } from "react-router-dom";

import { MomentsHub } from "@/app/interface/MomentsHub/MomentsHub";

export default function MomentsHubPage() {
  const navigate = useNavigate();

  return <MomentsHub onOpenMoment={(momentId) => navigate(`/moments/${momentId}`)} />;
}
