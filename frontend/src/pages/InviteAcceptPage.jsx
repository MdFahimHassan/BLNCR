import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowClockwise, LinkBreak } from "@phosphor-icons/react";
import { invitationApi } from "../api/endpoints";
import { EmptyState, PageSpinner } from "../components/Feedback";
import Button from "../components/Button";

export default function InviteAcceptPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  const accept = useCallback(async () => {
    setError(null);
    try {
      const group = await invitationApi.accept(token);
      navigate(`/groups/${group.groupId}`, { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    }
  }, [navigate, token]);

  useEffect(() => {
    accept();
  }, [accept]);

  if (!error) return <PageSpinner label="Joining group" />;

  return (
    <div className="mx-auto w-full max-w-xl py-10">
      <EmptyState
        icon={LinkBreak}
        title="This invite link is unavailable"
        description={error}
        action={<Button size="sm" icon={ArrowClockwise} onClick={accept}>Try again</Button>}
      />
    </div>
  );
}