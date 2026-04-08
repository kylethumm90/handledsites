import { getResend } from "@/lib/email";

export async function addContactToResend(business: {
  email: string;
  name: string;
  owner_name: string;
  phone?: string;
  city?: string;
  state?: string;
  trade?: string;
}) {
  const resend = getResend();

  const [firstName, ...rest] = (business.owner_name || "").split(" ");
  const lastName = rest.join(" ");

  await resend.contacts.create({
    email: business.email,
    firstName: firstName || business.name,
    lastName: lastName || "",
    properties: {
      business_name: business.name || "",
      phone: business.phone || "",
      city: business.city || "",
      state: business.state || "",
      trade: business.trade || "",
    },
  });
}
