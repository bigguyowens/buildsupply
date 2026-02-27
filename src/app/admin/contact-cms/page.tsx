import { getContactCMS } from "@/app/actions/contact-cms";
import { ContactCmsAdminClient } from "./client";

export default async function AdminContactCmsPage() {
  const cms = await getContactCMS();
  return <ContactCmsAdminClient cms={cms} />;
}
