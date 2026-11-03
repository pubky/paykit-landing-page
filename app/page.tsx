import Landing from "@/components/Landing";
import { isConferenceVisible } from "@/lib/conference.mjs";

// Evaluate the conference expiry on every request, including after deployment.
export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <Landing
      contactEmail="info@synonym.to"
      showConference={isConferenceVisible()}
    />
  );
}
