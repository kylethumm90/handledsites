import {
  Wind,
  Home,
  Wrench,
  Zap,
  Trees,
  Paintbrush,
  Hammer,
  Settings2,
  Snowflake,
  Flame,
  Fan,
  Droplets,
  Droplet,
  ShowerHead,
  Plug,
  Lightbulb,
  Leaf,
  Scissors,
  Shovel,
  Layers,
  Building,
  DollarSign,
  Search,
  AlertTriangle,
  ThermometerSun,
  Gauge,
  Sun,
  Bug,
  Shield,
  Rat,
  BedDouble,
  type LucideIcon,
} from "lucide-react";

export const TRADE_ICONS: Record<string, LucideIcon> = {
  HVAC: Wind,
  Roofing: Home,
  Plumbing: Wrench,
  Electrical: Zap,
  Landscaping: Trees,
  Painting: Paintbrush,
  Solar: Sun,
  "General Contractor": Hammer,
  "Pest Control": Bug,
  Other: Settings2,
};

export const SERVICE_ICONS: Record<string, LucideIcon> = {
  // HVAC
  "AC Repair": Snowflake,
  "Furnace Install": Flame,
  "Duct Cleaning": Fan,
  "System Tune-Up": Gauge,
  "Emergency HVAC": AlertTriangle,

  // Roofing
  "Roof Repair": Home,
  "Roof Replacement": Building,
  Inspections: Search,
  "Gutter Install": Droplets,
  "Leak Repair": Droplet,

  // Plumbing
  "Drain Cleaning": Droplets,
  "Pipe Repair": Wrench,
  "Water Heater": ThermometerSun,
  "Fixture Install": ShowerHead,
  "Emergency Plumbing": AlertTriangle,

  // Electrical
  "Wiring & Rewiring": Zap,
  "Panel Upgrades": Layers,
  "Outlet Install": Plug,
  Lighting: Lightbulb,
  "Emergency Electrical": AlertTriangle,

  // Landscaping
  "Lawn Care": Leaf,
  "Tree Trimming": Scissors,
  Hardscaping: Shovel,
  Irrigation: Droplets,
  "Seasonal Cleanup": Wind,

  // Painting
  "Interior Painting": Paintbrush,
  "Exterior Painting": Home,
  "Cabinet Refinishing": Layers,
  "Drywall Repair": Hammer,
  Staining: Paintbrush,

  // Solar
  "Panel Installation": Sun,
  "System Design": Layers,
  "Roof Assessment": Home,
  "Battery Storage": Zap,
  "Maintenance & Repair": Wrench,

  // General Contractor
  Remodeling: Building,
  Additions: Home,
  Framing: Hammer,
  "Concrete Work": Layers,
  Demolition: Wrench,

  // Pest Control
  "General Pest Control": Bug,
  "Termite Treatment": Shield,
  "Rodent Control": Rat,
  "Bed Bug Treatment": BedDouble,
  "Mosquito & Tick Control": Bug,

  // Other / shared
  Repairs: Wrench,
  Installations: Hammer,
  Maintenance: Settings2,
  Emergency: AlertTriangle,

  // Common
  "Free Estimates": DollarSign,
};
