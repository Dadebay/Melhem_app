import {
  Pill,
  Leaf,
  ShieldPlus,
  Bug,
  Microscope,
  Tablets,
  Thermometer,
  Droplets,
  Flower2,
  Soup,
  Heart,
  Wind,
  Activity,
  Syringe,
  Hand,
  Sparkles,
  Baby,
  Stethoscope,
  Eye,
  Droplet,
  Venus,
} from 'lucide-react-native';
import {ComponentType} from 'react';

export type CategoryIcon = ComponentType<{
  size: number;
  color: string;
  strokeWidth?: number;
}>;

/**
 * Maps the `icon` field returned by the backend (a lucide-react-native icon
 * name) to its component. Keep keys in sync with the backend category seed /
 * admin values. Unknown or missing names fall back to {@link FALLBACK_CATEGORY_ICON}.
 */
export const CATEGORY_ICON_MAP: Record<string, CategoryIcon> = {
  Pill,
  Leaf,
  ShieldPlus,
  Bug,
  Microscope,
  Tablets,
  Thermometer,
  Droplets,
  Flower2,
  Soup,
  Heart,
  Wind,
  Activity,
  Syringe,
  Hand,
  Sparkles,
  Baby,
  Stethoscope,
  Eye,
  Droplet,
  Venus,
};

export const FALLBACK_CATEGORY_ICON: CategoryIcon = Pill;

export const getCategoryIcon = (icon?: string | null): CategoryIcon =>
  (icon && CATEGORY_ICON_MAP[icon]) || FALLBACK_CATEGORY_ICON;
