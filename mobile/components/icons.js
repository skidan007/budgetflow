import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Clapperboard,
  Filter,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Menu,
  Minus,
  Pencil,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Target,
  Trash2,
  Utensils,
  Wallet,
  WalletCards,
  X,
} from "lucide-react-native";
import { View } from "react-native";
import { COLORS } from "../src/theme";

export const ICONS = {
  home: House,
  budgets: WalletCards,
  add: Plus,
  goals: Target,
  more: Menu,
  income: ArrowDownLeft,
  expenses: ArrowUpRight,
  balance: Wallet,
  food: Utensils,
  transport: CarFront,
  bills: ReceiptText,
  savings: Landmark,
  entertainment: Clapperboard,
  shopping: ShoppingBag,
  health: HeartPulse,
  education: GraduationCap,
  reports: CircleDollarSign,
  planner: CircleDollarSign,
  compoundInterest: CircleDollarSign,
  financialProfile: Wallet,
  settings: Settings,
  history: CalendarDays,
  search: Search,
  filter: Filter,
  calendar: CalendarDays,
  back: ArrowLeft,
  close: X,
  edit: Pencil,
  delete: Trash2,
  plus: Plus,
  minus: Minus,
  chevronLeft: ChevronLeft,
  chevronRight: ChevronRight,
};

/** Decorative by default; place inside an AccessibleIconButton for actions. */
export function AppIcon({
  name,
  size = 20,
  color = COLORS.text,
  strokeWidth = 2,
  decorative = true,
}) {
  const Icon = ICONS[name];
  if (!Icon) return null;

  return (
    <View
      accessible={!decorative}
      accessibilityElementsHidden={decorative}
      importantForAccessibility={decorative ? "no-hide-descendants" : "auto"}
    >
      <Icon size={size} color={color} strokeWidth={strokeWidth} />
    </View>
  );
}
