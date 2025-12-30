// Shared constants for the application

import { 
  Briefcase, 
  User, 
  Dumbbell, 
  Moon, 
  Coffee, 
  Zap, 
  Book, 
  Bed, 
  Heart, 
  Gamepad2, 
  Music, 
  ShoppingBag, 
  Car, 
  Plane, 
  Utensils, 
  GraduationCap, 
  Target, 
  Activity, 
  Clock, 
  Camera, 
  Circle, 
  Monitor, 
  Calendar, 
  List, 
  Compass,
  Code,
  Sparkles,
  Brush,
  Film,
  BookOpen
} from "lucide-react";
import type { ComponentType } from "react";
import type { Category } from "./types";

// Icons Mapping
export const ICON_MAP: Record<string, ComponentType<any>> = {
  Briefcase, 
  User, 
  Dumbbell, 
  Moon, 
  Coffee, 
  Zap, 
  Book, 
  Bed, 
  Heart, 
  Gamepad2, 
  Music, 
  ShoppingBag, 
  Car, 
  Plane, 
  Utensils, 
  GraduationCap, 
  Target, 
  Activity, 
  Clock, 
  Camera, 
  Circle, 
  Monitor, 
  Calendar, 
  List, 
  Compass, 
  Code,
  Sparkles,
  Brush,
  Film,
  BookOpen
};

// Available icon names for category editor
export const AVAILABLE_ICONS = [
  "Briefcase", "User", "Dumbbell", "Moon", "Coffee", "Zap", "Book", "Bed",
  "Heart", "Gamepad2", "Music", "ShoppingBag", "Car", "Plane", "Utensils", 
  "GraduationCap", "Target", "Activity", "Clock", "Camera", "Monitor",
  "Calendar", "List", "Compass", "Code", "Sparkles", "Brush", "Film", "BookOpen"
];

// Neon colors palette
export const NEON_COLORS = [
  "#f97316", // Neon Orange
  "#00d4ff", // Cyan
  "#8b5cf6", // Purple
  "#84cc16", // Lime
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#a855f7", // Violet
  "#14b8a6", // Teal
  "#ffffff", // White
  "#f43f5e", // Rose
  "#fbbf24", // Yellow
  "#22c55e", // Green
  "#0ea5e9"  // Sky
];

// Initial categories
export const INITIAL_CATEGORIES: Category[] = [
  { id: "0", name: "ללא קטגורייה", color: "#3f3f46", iconName: "Circle", keywords: [] },
  { id: "1", name: "שינה", color: "#8b5cf6", iconName: "Moon", keywords: ["שינה", "שנ״צ", "שנצ"] },
  { id: "2", name: "זמן משפחה", color: "#ec4899", iconName: "Heart", keywords: ["דניאל", "יונתן", "איתמר", "ילדים", "שרה", "ז״מ", "זמן משפחה"] },
  { id: "3", name: "כושר", color: "#84cc16", iconName: "Dumbbell", keywords: ["אימון", "משקולות", "ריצה", "הליכון"] },
  { id: "4", name: "אירגון", color: "#a855f7", iconName: "List", keywords: ["השכמה", "אירגון"] },
  { id: "5", name: "ארוחה", color: "#f43f5e", iconName: "Utensils", keywords: ["ארוחה", "אוכל", "יוגורט"] },
  { id: "6", name: "קריאה", color: "#3b82f6", iconName: "Book", keywords: ["קריאה"] },
  { id: "7", name: "תכנון", color: "#10b981", iconName: "Compass", keywords: ["מיקוד", "תכנון"] },
  { id: "8", name: "סידורים", color: "#f59e0b", iconName: "ShoppingBag", keywords: ["סידורים"] },
  { id: "9", name: "במחשב", color: "#06b6d4", iconName: "Monitor", keywords: ["במחשב"] },
  { id: "10", name: "ניקיון", color: "#fafafa", iconName: "Brush", keywords: ["לרוטשילד", "לאור יהודה", "ניקיון", "מצעים"] },
  { id: "11", name: "דת", color: "#f97316", iconName: "BookOpen", keywords: ["תפילין", "שחרית", "מנחה", "מעריב", "ערבית", "לימוד"] },
  { id: "12", name: "צפייה", color: "#0ea5e9", iconName: "Film", keywords: ["צפייה", "סרט", "נטפליקס", "סדרה", "יוטיוב"] },
];

