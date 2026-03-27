import { getCRMCustomers, getCRMStaff } from "@/app/actions/crm";
import { CustomersClient } from "./customers-client";

export default async function CRMCustomersPage() {
  const [customers, staff] = await Promise.all([
    getCRMCustomers(),
    getCRMStaff(),
  ]);
  return <CustomersClient customers={customers} staff={staff} />;
}
