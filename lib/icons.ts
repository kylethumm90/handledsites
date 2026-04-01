import {
  Wind,
  Home,
  Wrench,
  Zap,
  Trees,
  Paintbrush,
  Hammer,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export const TRADE_ICONS: Record<string, LucideIcon> = {
  HVAC: Wind,
  Roofing: Home,
  Plumbing: Wrench,
  Electrical: Zap,
  Landscaping: Trees,
  Painting: Paintbrush,
  "General Contractor": Hammer,
  Other: Settings2,
};

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  Repairs: Wrench,
  Installations: Hammer,
  Maintenance: Settings2,
  Inspections: Home,
  Emergency: Zap,
  "Free estimates": Wind,
};
