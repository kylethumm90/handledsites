export function generateVCard({
  businessName,
  phone,
  city,
  state,
  url,
}: {
  businessName: string;
  phone: string;
  city: string;
  state: string;
  url: string;
}): string {
  const formattedPhone = `+1${phone}`;
  return [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${businessName}`,
    `ORG:${businessName}`,
    `TEL;TYPE=WORK,VOICE:${formattedPhone}`,
    `ADR;TYPE=WORK:;;${city};${state};;;US`,
    `URL:${url}`,
    "END:VCARD",
  ].join("\r\n");
}

export function downloadVCard(vcard: string, filename: string) {
  const blob = new Blob([vcard], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.vcf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
