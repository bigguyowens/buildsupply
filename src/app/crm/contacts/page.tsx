import { getCRMContactQueue } from "@/app/actions/crm";
import { ContactQueueClient } from "./contact-queue-client";

export default async function CRMContactsPage() {
  const contacts = await getCRMContactQueue();
  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0, color: "#0d0d0d", letterSpacing: "-0.03em" }}>
          Contact Queue
        </h1>
        <p style={{ color: "#6b7280", fontSize: 14, margin: "4px 0 0" }}>
          All incoming contact form submissions
        </p>
      </div>
      <ContactQueueClient contacts={contacts} />
    </div>
  );
}
