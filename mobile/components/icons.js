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
  LogOut,
  LaptopMinimal,
  Menu,
  Minus,
  Pencil,
  Plane,
  PiggyBank,
  Plus,
  ReceiptText,
  Search,
  Settings,
  ShoppingBag,
  Sparkles,
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
  savings: PiggyBank,
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
  sparkles: Sparkles,
  emergencyFund: ShieldCheck,
  financialProfile: Wallet,
  notifications: Bell,
  profile: UserRound,
  settings: Settings,
  logout: LogOut,
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

// Goal category art uses component references directly so it cannot render as
// an empty square when a string key is missing from the general icon registry.
export const GOAL_ICON_COMPONENTS = Object.freeze({
  "Emergency Fund": ShieldCheck,
  Savings: PiggyBank,
  Education: GraduationCap,
  Business: BriefcaseBusiness,
  Travel: Plane,
  Home: House,
  Car: CarFront,
  Technology: LaptopMinimal,
  Health: HeartPulse,
  Other: Sparkles,
});

export const CATEGORY_ICON_NAMES = {
  food: "food", transport: "transport", bills: "bills", entertainment: "entertainment",
  shopping: "shopping", business: "business", travel: "travel", laptop: "laptop",
  "emergency fund": "emergencyFund", health: "health", education: "education", rent: "home",
  housing: "home", savings: "savings", investment: "savings", salary: "income", income: "income",
  expense: "expenses", "personal care": "health", other: "balance", "debt repayment": "balance",
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
