import { SERVICE_ICONS } from "@/lib/icons";
import { Settings2 } from "lucide-react";

type Props = {
  services: string[];
};

export default function ServicesGrid({ services }: Props) {
  // Show up to 4 services in a 2x2 grid
  const displayServices = services.slice(0, 4);

  return (
    <div className="grid grid-cols-2 gap-3">
      {displayServices.map((service) => {
        const Icon = SERVICE_ICONS[service] || Settings2;
        return (
          <div
            key={service}
            className="flex items-center gap-2 rounded-xl bg-card-surface px-3 py-3"
          >
            <Icon className="h-4 w-4 text-card-muted" />
            <span className="text-xs font-medium text-white">{service}</span>
          </div>
        );
      })}
    </div>
  );
}
