import { getContactSubmissions } from "@/app/actions/contact";
import { ContactAdminClient } from "./client";

export default async function ContactSubmissionsPage() {
  const submissions = await getContactSubmissions();
  return <ContactAdminClient submissions={submissions} />;
}
