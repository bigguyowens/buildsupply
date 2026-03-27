import { getCRMCustomers } from "@/app/actions/crm";
import { CustomersClient } from "./customers-client";

export default async function CRMCustomersPage() {
  const customers = await getCRMCustomers();
  return <CustomersClient customers={customers} />;
}
