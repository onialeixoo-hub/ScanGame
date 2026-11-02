import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  BarChart3,
  Check,
  Flame,
  Grid3x3,
  ListTodo,
  Menu,
  Package,
  ScanLine,
  Settings,
  Sparkles,
  Star,
  UserRoundCog,
  XCircle
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Progress } from "@/app/components/ui/progress";
import {
  AVATAR_OPTIONS,
  getAvatarSrc,
  normalizeAvatarId
} from "@/app/lib/avatar-options";

interface Task {
  id: string;
  title: string;
  xpReward: number;
  pointsReward: number;
  completed: boolean;
}

interface HomeProps {
  userLevel: number;
  currentXP: number;
  xpToNextLevel: number;
  totalPoints: number;
  dailyStreak: number;
  username: string;
  avatar: string;
  activeTasks: number;
  totalProducts: number;
  categoriesCount: number;
  completedTasksToday: number;
  tasks: Task[];
  onScanClick: () => void;
  onCollectionClick: () => void;
  onTasksClick: () => void;
  onCompleteTask: (taskId: string) => void;
  onLogout: () => void;
  onUpdateProfileName: (name: string) => void;
  onUpdateAvatar: (avatar: string) => void;
}

export function Home({
  userLevel,
  currentXP,
  xpToNextLevel,
  totalPoints,
  dailyStreak,
  username,
  avatar,
  activeTasks,
  totalProducts,
  categoriesCount,
  completedTasksToday,
  tasks,
  onScanClick,
  onCollectionClick,
  onTasksClick,
  onCompleteTask,
  onLogout,
  onUpdateProfileName,
  onUpdateAvatar
}: HomeProps) {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [pendingName, setPendingName] = useState(username);

  const selectedAvatarId = normalizeAvatarId(avatar, "user");
  const avatarSrc = getAvatarSrc(selectedAvatarId, "user");

  let levelStartXp = 0;
  let levelRequirement = 1000;

  for (let level = 1; level < userLevel; level += 1) {
    levelStartXp += levelRequirement;
    levelRequirement += 200;
  }
