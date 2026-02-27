import { getContactCMS } from "@/app/actions/contact-cms";
import { ContactPageClient } from "./client";

export default async function ContactPage() {
  const cms = await getContactCMS();
  return <ContactPageClient cms={cms} />;
}
