import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  BrainCircuit,
  BriefcaseBusiness,
  Bell,
  CalendarDays,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Calculator,
  ChartNoAxesColumnIncreasing,
  Clapperboard,
  Filter,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  LaptopMinimal,
  Menu,
  Minus,
  Pencil,
  Plane,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  ShieldCheck,
  Target,
  Trash2,
  Utensils,
  Wallet,
  WalletCards,
  UserRound,
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
  reports: ChartNoAxesColumnIncreasing,
  planner: BrainCircuit,
  compoundInterest: Calculator,
  business: BriefcaseBusiness,
  travel: Plane,
  laptop: LaptopMinimal,
  emergencyFund: ShieldCheck,
  financialProfile: Wallet,
  notifications: Bell,
  profile: UserRound,
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
