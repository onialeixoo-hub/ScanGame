import { useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch
} from "firebase/firestore";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Smartphone,
  Trophy,
  X
} from "lucide-react";
import { getMessaging, getToken, isSupported, onMessage } from "firebase/messaging";
import { toast } from "sonner";

import { app, auth, db } from "@/firebase";
import { FIREBASE_WEB_PUSH_VAPID_KEY } from "@/push-config";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card } from "@/app/components/ui/card";
import { Switch } from "@/app/components/ui/switch";
import type {
  Achievement,
  ProductRarity,
  Role,
  ScanGameNotification,
  Task,
  TaskClaim,
  UserProgress
} from "@/app/types";

interface NotificationPrefs {
  scans: boolean;
  taskActivity: boolean;
  storeActivity: boolean;
  achievements: boolean;
}

interface ProductSummary {
  id: string;
  name: string;
  rarity: ProductRarity;
}

interface ScanSummary {
  id: string;
  name?: string;
  rarity?: ProductRarity;
  xpReward?: number;
  duplicateToday?: boolean;
  scannedAt?: string;
}

interface StoreRequestSummary {
  id: string;
  userId: string;
  rewardName?: string;
  status: string;
  requestType?: string;
}

interface AchievementStats {
  products: number;
  rare: number;
  epic: number;
  legendary: number;
  approvedTasks: number;
  scanStreak: number;
}

interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  emoji: string;
  bonusXp: number;
  check: (stats: AchievementStats) => boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  scans: true,
  taskActivity: true,
  storeActivity: true,
  achievements: true
};

const EMPTY_PROGRESS: UserProgress = {
  xp: 0,
  points: 0,
  streak: 0,
  bonusAwardedOn: "",
  scanStreak: 0,
  lastScanDate: "",
  lastSeenRejectionAt: ""
};

const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "products-10",
    title: "Explorador",
    description: "Escaneaste 10 productos únicos.",
    emoji: "🔎",
    bonusXp: 100,
    check: (stats) => stats.products >= 10
  },
  {
    id: "products-20",
    title: "Coleccionista",
    description: "Llegaste a 20 productos únicos.",
    emoji: "📦",
    bonusXp: 200,
    check: (stats) => stats.products >= 20
  },
  {
    id: "products-50",
    title: "Cazador de códigos",
    description: "Llegaste a 50 productos únicos.",
    emoji: "🎯",
    bonusXp: 500,
    check: (stats) => stats.products >= 50
  },
  {
    id: "products-100",
    title: "Maestro del escaneo",
    description: "Llegaste a 100 productos únicos.",
    emoji: "👑",
    bonusXp: 1000,
    check: (stats) => stats.products >= 100
  },
  {
    id: "first-rare",
    title: "Algo especial",
    description: "Encontraste tu primer producto raro.",
    emoji: "💎",
    bonusXp: 75,
    check: (stats) => stats.rare >= 1
  },
  {
    id: "first-epic",
    title: "Hallazgo épico",
    description: "Encontraste tu primer producto épico.",
    emoji: "🔮",
    bonusXp: 200,
    check: (stats) => stats.epic >= 1
  },
  {
    id: "first-legendary",
    title: "Leyenda encontrada",
    description: "Encontraste tu primer producto legendario.",
    emoji: "🏆",
    bonusXp: 500,
    check: (stats) => stats.legendary >= 1
  },
  {
    id: "tasks-10",
    title: "En marcha",
    description: "Completaste 10 tareas aprobadas.",
    emoji: "✅",
    bonusXp: 150,
    check: (stats) => stats.approvedTasks >= 10
  },
  {
    id: "tasks-25",
    title: "Imparable",
    description: "Completaste 25 tareas aprobadas.",
    emoji: "🚀",
    bonusXp: 300,
    check: (stats) => stats.approvedTasks >= 25
  },
  {
    id: "tasks-50",
    title: "Máquina de tareas",
    description: "Completaste 50 tareas aprobadas.",
    emoji: "⚡",
    bonusXp: 600,
    check: (stats) => stats.approvedTasks >= 50
  },
  {
    id: "streak-3",
    title: "Tres días seguidos",
    description: "Mantuviste una racha de escaneo de 3 días.",
    emoji: "🔥",
    bonusXp: 100,
    check: (stats) => stats.scanStreak >= 3
  },
  {
    id: "streak-7",
    title: "Semana de fuego",
    description: "Mantuviste una racha de escaneo de 7 días.",
    emoji: "🔥",
    bonusXp: 250,
    check: (stats) => stats.scanStreak >= 7
  },
  {
    id: "streak-14",
    title: "Dos semanas",
    description: "Mantuviste una racha de escaneo de 14 días.",
    emoji: "🌟",
    bonusXp: 500,
    check: (stats) => stats.scanStreak >= 14
  }
];

const dayKey = (value = new Date()) =>
  value.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires"
  });

const localDateKey = (value: string) =>
  new Date(value).toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires"
  });

const startOfWeekKey = () => {
  const now = new Date();
  const buenosAiresDate = new Date(
    now.toLocaleString("en-US", {
      timeZone: "America/Argentina/Buenos_Aires"
    })
  );
  const day = buenosAiresDate.getDay();
  const diff = day === 0 ? 6 : day - 1;
  buenosAiresDate.setDate(buenosAiresDate.getDate() - diff);
  return dayKey(buenosAiresDate);
};

export function GameSystems() {
  const [userId, setUserId] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [userName, setUserName] = useState("Usuario");
  const [adminId, setAdminId] = useState<string | null>(null);
  const [martiId, setMartiId] = useState<string | null>(null);
  const [adminPrefs, setAdminPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);

  const [notifications, setNotifications] = useState<ScanGameNotification[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [achievementPopup, setAchievementPopup] = useState<Achievement | null>(null);
  const [pushStatus, setPushStatus] = useState<
    "idle" | "enabled" | "denied" | "unsupported" | "missing-key" | "error"
  >("idle");

  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [claims, setClaims] = useState<TaskClaim[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [progress, setProgress] = useState<UserProgress>(EMPTY_PROGRESS);
  const [statsReady, setStatsReady] = useState(false);

  const notificationInitialRef = useRef(true);
  const sourceGenerationRef = useRef(0);

  const unreadCount = notifications.filter((item) => !item.read).length;

  const createNotificationOnce = async ({
    key,
    recipientId,
    senderId,
    title,
    body,
    type,
    sourceId
  }: {
    key: string;
    recipientId: string | null;
    senderId: string;
    title: string;
    body: string;
    type: ScanGameNotification["type"];
    sourceId?: string;
  }) => {
    if (!recipientId) return;

    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 900);
    const notificationReference = doc(db, "notifications", safeKey);
    const existing = await getDoc(notificationReference);

    if (existing.exists()) return;

    await setDoc(notificationReference, {
      recipientId,
      senderId,
      title,
      body,
      type,
      createdAt: new Date().toISOString(),
      read: false,
      ...(sourceId ? { sourceId } : {})
    });
  };

  const showBrowserNotification = async (title: string, body: string) => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      Notification.permission !== "granted"
    ) {
      return;
    }

    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
          body,
          icon: `${import.meta.env.BASE_URL}icon-192.png`,
          badge: `${import.meta.env.BASE_URL}icon-192.png`,
          tag: `scangame-${Date.now()}`,
          data: { url: import.meta.env.BASE_URL }
        });
      }
    } catch {
      // La notificación interna sigue funcionando aunque el navegador no la muestre.
    }
  };

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}firebase-messaging-sw.js`)
        .catch((error) =>
          console.error("No se pudo registrar el service worker:", error)
        );
    }
  }, []);

  useEffect(() => {
    let unsubscribeProfile = () => {};
    let unsubscribeUsers = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      unsubscribeProfile();
      unsubscribeUsers();
      sourceGenerationRef.current += 1;

      if (!firebaseUser) {
        setUserId(null);
        setRole(null);
        setNotifications([]);
        setAchievements([]);
        setPanelOpen(false);
        return;
      }

      setUserId(firebaseUser.uid);

      unsubscribeProfile = onSnapshot(
        doc(db, "users", firebaseUser.uid),
        (snapshot) => {
          if (!snapshot.exists()) return;

          const data = snapshot.data() as {
            name?: string;
            role?: Role;
          };

          setUserName(data.name ?? "Usuario");
          setRole(data.role === "admin" ? "admin" : "user");
        }
      );

      unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
        let nextAdminId: string | null = null;
        let nextMartiId: string | null = null;
        let nextAdminPrefs = DEFAULT_PREFS;

        snapshot.docs.forEach((userDocument) => {
          const data = userDocument.data() as {
            role?: Role;
            notificationPrefs?: Partial<NotificationPrefs>;
          };

          if (data.role === "admin") {
            nextAdminId = userDocument.id;
            nextAdminPrefs = {
              ...DEFAULT_PREFS,
              ...(data.notificationPrefs ?? {})
            };
          }

          if (data.role === "user") {
            nextMartiId = userDocument.id;
          }
        });

        setAdminId(nextAdminId);
        setMartiId(nextMartiId);
        setAdminPrefs(nextAdminPrefs);
      });
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    if (!userId) return;

    notificationInitialRef.current = true;

    return onSnapshot(
      query(
        collection(db, "notifications"),
        where("recipientId", "==", userId)
      ),
      (snapshot) => {
        const next = snapshot.docs
          .map((notificationDocument) => ({
            id: notificationDocument.id,
            ...(notificationDocument.data() as Omit<ScanGameNotification, "id">)
          }))
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() -
              new Date(a.createdAt).getTime()
          );

        setNotifications(next);

        if (notificationInitialRef.current) {
          notificationInitialRef.current = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;
          const data = change.doc.data() as Omit<ScanGameNotification, "id">;
          toast(data.title, { description: data.body });
          void showBrowserNotification(data.title, data.body);
        });
      },
      (error) => console.error("Error en notificaciones:", error)
    );
  }, [userId]);

  useEffect(() => {
    if (!userId) return;

    return onSnapshot(
      collection(db, "users", userId, "achievements"),
      (snapshot) => {
        setAchievements(
          snapshot.docs
            .map((achievementDocument) => ({
              id: achievementDocument.id,
              ...(achievementDocument.data() as Omit<Achievement, "id">)
            }))
            .sort(
              (a, b) =>
                new Date(b.unlockedAt).getTime() -
                new Date(a.unlockedAt).getTime()
            )
        );
      }
    );
  }, [userId]);

  useEffect(() => {
    if (!userId || role !== "user") {
      setProducts([]);
      setClaims([]);
      setProgress(EMPTY_PROGRESS);
      setStatsReady(false);
      return;
    }

    let productsReady = false;
    let claimsReady = false;
    let progressReady = false;

    const updateReady = () => {
      if (productsReady && claimsReady && progressReady) {
        setStatsReady(true);
      }
    };

    const unsubscribeProducts = onSnapshot(
      collection(db, "users", userId, "products"),
      (snapshot) => {
        setProducts(
          snapshot.docs.map((productDocument) => ({
            id: productDocument.id,
            ...(productDocument.data() as Omit<ProductSummary, "id">)
          }))
        );
        productsReady = true;
        updateReady();
      }
    );

    const unsubscribeClaims = onSnapshot(
      query(collection(db, "taskClaims"), where("userId", "==", userId)),
      (snapshot) => {
        setClaims(
          snapshot.docs.map((claimDocument) => ({
            id: claimDocument.id,
            ...(claimDocument.data() as Omit<TaskClaim, "id">)
          }))
        );
        claimsReady = true;
        updateReady();
      }
    );

    const unsubscribeProgress = onSnapshot(
      doc(db, "userProgress", userId),
      (snapshot) => {
        setProgress(
          snapshot.exists()
            ? {
                ...EMPTY_PROGRESS,
                ...(snapshot.data() as UserProgress)
              }
            : EMPTY_PROGRESS
        );
        progressReady = true;
        updateReady();
      }
    );

    return () => {
      unsubscribeProducts();
      unsubscribeClaims();
      unsubscribeProgress();
    };
  }, [userId, role]);

  useEffect(() => {
    if (!userId) return;

    return onSnapshot(collection(db, "tasks"), (snapshot) => {
      setTasks(
        snapshot.docs.map((taskDocument) => ({
          id: taskDocument.id,
          ...(taskDocument.data() as Omit<Task, "id">)
        }))
      );
    });
  }, [userId]);

  useEffect(() => {
    const targetUserId = role === "admin" ? martiId : role === "user" ? userId : null;
    if (!targetUserId) return;

    void runTransaction(db, async (transaction) => {
      const progressReference = doc(db, "userProgress", targetUserId);
      const snapshot = await transaction.get(progressReference);
      const current = snapshot.exists()
        ? ({ ...EMPTY_PROGRESS, ...(snapshot.data() as UserProgress) } as UserProgress)
        : EMPTY_PROGRESS;

      if (current.xpSystemMigrated) return;

      transaction.set(
        progressReference,
        {
          points: Number(current.xp ?? 0),
          xpSystemMigrated: true
        },
        { merge: true }
      );
    }).catch((error) =>
      console.error("No se pudo migrar la XP disponible:", error)
    );
  }, [role, userId, martiId]);

  useEffect(() => {
    if (role !== "admin") return;

    const unsubscribe = onSnapshot(collection(db, "tasks"), (snapshot) => {
      const mismatched = snapshot.docs.filter((taskDocument) => {
        const data = taskDocument.data() as Omit<Task, "id">;
        return Number(data.xp ?? 0) !== Number(data.points ?? 0);
      });

      if (mismatched.length === 0) return;

      const batch = writeBatch(db);
      mismatched.forEach((taskDocument) => {
        const data = taskDocument.data() as Omit<Task, "id">;
        batch.update(taskDocument.ref, {
          xp: Number(data.points ?? data.xp ?? 0)
        });
      });

      void batch.commit().catch((error) =>
        console.error("No se pudieron unificar las recompensas de tareas:", error)
      );
    });

    return unsubscribe;
  }, [role]);

  const achievementStats = useMemo<AchievementStats>(
    () => ({
      products: products.length,
      rare: products.filter((product) => product.rarity === "raro").length,
      epic: products.filter((product) => product.rarity === "épico").length,
      legendary: products.filter((product) => product.rarity === "legendario").length,
      approvedTasks: claims.filter((claim) => claim.status === "approved").length,
      scanStreak: progress.scanStreak ?? 0
    }),
    [products, claims, progress.scanStreak]
  );

  useEffect(() => {
    if (!statsReady || role !== "user" || !userId) return;

    let cancelled = false;

    const unlockPendingAchievements = async () => {
      for (const achievement of ACHIEVEMENTS) {
        if (cancelled || !achievement.check(achievementStats)) continue;

        const achievementReference = doc(
          db,
          "users",
          userId,
          "achievements",
          achievement.id
        );
        const progressReference = doc(db, "userProgress", userId);

        let unlockedNow = false;
        const unlockedAt = new Date().toISOString();

        try {
          await runTransaction(db, async (transaction) => {
            const [achievementSnapshot, progressSnapshot] = await Promise.all([
              transaction.get(achievementReference),
              transaction.get(progressReference)
            ]);

            if (achievementSnapshot.exists()) return;

            const currentProgress = progressSnapshot.exists()
              ? {
                  ...EMPTY_PROGRESS,
                  ...(progressSnapshot.data() as UserProgress)
                }
              : EMPTY_PROGRESS;

            transaction.set(achievementReference, {
              title: achievement.title,
              description: achievement.description,
              emoji: achievement.emoji,
              bonusXp: achievement.bonusXp,
              unlockedAt
            });

            transaction.set(
              progressReference,
              {
                xp: Number(currentProgress.xp ?? 0) + achievement.bonusXp,
                points:
                  Number(currentProgress.points ?? 0) + achievement.bonusXp
              },
              { merge: true }
            );

            unlockedNow = true;
          });

          if (!unlockedNow || cancelled) continue;

          const unlockedAchievement: Achievement = {
            id: achievement.id,
            title: achievement.title,
            description: achievement.description,
            emoji: achievement.emoji,
            bonusXp: achievement.bonusXp,
            unlockedAt
          };

          setAchievementPopup(unlockedAchievement);

          await createNotificationOnce({
            key: `achievement_${achievement.id}_${userId}`,
            recipientId: userId,
            senderId: userId,
            title: `🏆 Logro: ${achievement.title}`,
            body: `${achievement.description} +${achievement.bonusXp} XP`,
            type: "achievement",
            sourceId: achievement.id
          });

          if (adminPrefs.achievements) {
            await createNotificationOnce({
              key: `achievement_admin_${achievement.id}_${userId}`,
              recipientId: adminId,
              senderId: userId,
              title: `🏆 Marti desbloqueó ${achievement.title}`,
              body: achievement.description,
              type: "achievement",
              sourceId: achievement.id
            });
          }
        } catch (error) {
          console.error("Error desbloqueando logro:", achievement.id, error);
        }
      }
    };

    void unlockPendingAchievements();

    return () => {
      cancelled = true;
    };
  }, [
    statsReady,
    role,
    userId,
    achievementStats,
    adminId,
    adminPrefs.achievements
  ]);

  useEffect(() => {
    if (!userId || role !== "user") return;

    let initial = true;

    return onSnapshot(
      collection(db, "users", userId, "scans"),
      (snapshot) => {
        if (initial) {
          initial = false;
          return;
        }

        snapshot.docChanges().forEach((change) => {
          if (change.type !== "added") return;

          const scan = {
            id: change.doc.id,
            ...(change.doc.data() as Omit<ScanSummary, "id">)
          };

          const xpReward = Number(scan.xpReward ?? 0);

          if (xpReward > 0) {
            const ledgerReference = doc(
              db,
              "users",
              userId,
              "xpLedger",
              `scan_${scan.id}`
            );
            const progressReference = doc(db, "userProgress", userId);

            void runTransaction(db, async (transaction) => {
              const [ledgerSnapshot, progressSnapshot] = await Promise.all([
                transaction.get(ledgerReference),
                transaction.get(progressReference)
              ]);

              if (ledgerSnapshot.exists()) return;

              const currentProgress = progressSnapshot.exists()
                ? {
                    ...EMPTY_PROGRESS,
                    ...(progressSnapshot.data() as UserProgress)
                  }
                : EMPTY_PROGRESS;

              transaction.set(ledgerReference, {
                kind: "scan",
                sourceId: scan.id,
                xp: xpReward,
                createdAt: new Date().toISOString()
              });

              transaction.set(
                progressReference,
                {
                  points: Number(currentProgress.points ?? 0) + xpReward
                },
                { merge: true }
              );
            }).catch((error) =>
              console.error("No se pudo sumar XP disponible del escaneo:", error)
            );
          }

          if (adminPrefs.scans) {
            void createNotificationOnce({
              key: `scan_${scan.id}_${adminId}`,
              recipientId: adminId,
              senderId: userId,
              title: "📦 Marti escaneó un producto",
              body: `${scan.name ?? "Producto"}${
                scan.rarity ? ` · ${scan.rarity}` : ""
              }`,
              type: "scan",
              sourceId: scan.id
            });
          }
        });
      }
    );
  }, [userId, role, adminId, adminPrefs.scans]);

  useEffect(() => {
    if (!userId || !role) return;

    let initial = true;

    return onSnapshot(collection(db, "tasks"), (snapshot) => {
      if (initial) {
        initial = false;
        return;
      }

      if (role !== "admin" || !martiId) return;

      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        const task = change.doc.data() as Omit<Task, "id">;

        void createNotificationOnce({
          key: `task_new_${change.doc.id}_${martiId}`,
          recipientId: martiId,
          senderId: userId,
          title: "📝 Nueva tarea",
          body: `${task.title} · +${task.xp} XP`,
          type: "task_new",
          sourceId: change.doc.id
        });
      });
    });
  }, [userId, role, martiId]);

  useEffect(() => {
    if (!userId || !role) return;

    let initial = true;
    const reference =
      role === "admin"
        ? collection(db, "taskClaims")
        : query(
            collection(db, "taskClaims"),
            where("userId", "==", userId)
          );

    return onSnapshot(reference, (snapshot) => {
      if (initial) {
        initial = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        const claim: TaskClaim = {
          id: change.doc.id,
          ...(change.doc.data() as Omit<TaskClaim, "id">)
        };

        const task = tasks.find((item) => item.id === claim.taskId);
        const taskTitle = task?.title ?? "una tarea";

        if (
          role === "user" &&
          change.type === "added" &&
          adminPrefs.taskActivity
        ) {
          void createNotificationOnce({
            key: `claim_sent_${claim.id}_${adminId}`,
            recipientId: adminId,
            senderId: userId,
            title: "✅ Marti envió una tarea",
            body: `Esperando aprobación: ${taskTitle}`,
            type: "task_sent",
            sourceId: claim.id
          });
        }

        if (role === "admin" && change.type === "modified") {
          if (claim.status === "approved") {
            void createNotificationOnce({
              key: `claim_approved_${claim.id}_${claim.userId}`,
              recipientId: claim.userId,
              senderId: userId,
              title: "✅ Tarea aprobada",
              body: `${taskTitle} fue aprobada.`,
              type: "task_approved",
              sourceId: claim.id
            });
          }

          if (claim.status === "rejected") {
            void createNotificationOnce({
              key: `claim_rejected_${claim.id}_${claim.userId}`,
              recipientId: claim.userId,
              senderId: userId,
              title: "⚠️ Tarea para revisar",
              body: claim.rejectionNote
                ? `${taskTitle}: ${claim.rejectionNote}`
                : `${taskTitle} fue rechazada. Revisala.`,
              type: "task_rejected",
              sourceId: claim.id
            });
          }
        }
      });
    });
  }, [userId, role, adminId, adminPrefs.taskActivity, tasks]);

  useEffect(() => {
    if (!userId || !role) return;

    const subscriptions: Array<() => void> = [];

    const subscribe = (collectionName: "rewardRequests" | "taskRequests") => {
      let initial = true;
      const reference =
        role === "admin"
          ? collection(db, collectionName)
          : query(
              collection(db, collectionName),
              where("userId", "==", userId)
            );

      subscriptions.push(
        onSnapshot(reference, (snapshot) => {
          if (initial) {
            initial = false;
            return;
          }

          snapshot.docChanges().forEach((change) => {
            const request: StoreRequestSummary = {
              id: change.doc.id,
              ...(change.doc.data() as Omit<StoreRequestSummary, "id">)
            };

            if (
              role === "user" &&
              change.type === "added" &&
              adminPrefs.storeActivity
            ) {
              void createNotificationOnce({
                key: `${collectionName}_new_${request.id}_${adminId}`,
                recipientId: adminId,
                senderId: userId,
                title:
                  collectionName === "rewardRequests"
                    ? "🎁 Marti pidió un premio"
                    : "✨ Marti hizo un pedido",
                body: request.rewardName ?? "Nuevo pedido en ScanGame",
                type: "store_request",
                sourceId: request.id
              });
            }

            if (
              role === "admin" &&
              change.type === "modified" &&
              request.status !== "pending"
            ) {
              const accepted =
                request.status === "approved" || request.status === "accepted";

              void createNotificationOnce({
                key: `${collectionName}_${request.status}_${request.id}_${request.userId}`,
                recipientId: request.userId,
                senderId: userId,
                title: accepted ? "🎉 Pedido aprobado" : "Pedido rechazado",
                body: `${request.rewardName ?? "Tu pedido"}: ${
                  accepted ? "aprobado" : "rechazado"
                }`,
                type: "store_resolved",
                sourceId: request.id
              });
            }
          });
        })
      );
    };

    subscribe("rewardRequests");
    subscribe("taskRequests");

    return () => subscriptions.forEach((unsubscribe) => unsubscribe());
  }, [userId, role, adminId, adminPrefs.storeActivity]);

  const pendingTasks = useMemo(() => {
    if (role !== "user") return [];

    const today = dayKey();
    const weekStart = startOfWeekKey();

    return tasks.filter((task) => {
      if (!task.active) return false;

      const taskClaims = claims.filter((claim) => claim.taskId === task.id);

      if (task.frequency === "daily") {
        const todayClaims = taskClaims.filter(
          (claim) => localDateKey(claim.timestamp) === today
        );
        return !todayClaims.some(
          (claim) => claim.status === "approved" || claim.status === "pending"
        );
      }

      if (task.frequency === "weekly") {
        const weekClaims = taskClaims.filter(
          (claim) => localDateKey(claim.timestamp) >= weekStart
        );
        return !weekClaims.some(
          (claim) => claim.status === "approved" || claim.status === "pending"
        );
      }

      return !taskClaims.some(
        (claim) => claim.status === "approved" || claim.status === "pending"
      );
    });
  }, [role, tasks, claims]);

  useEffect(() => {
    if (role !== "user" || !userId || pendingTasks.length === 0) return;

    const checkReminder = () => {
      const now = new Date();
      const localParts = new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      }).formatToParts(now);

      const hour = Number(
        localParts.find((part) => part.type === "hour")?.value ?? 0
      );
      const minute = Number(
        localParts.find((part) => part.type === "minute")?.value ?? 0
      );
      const minutes = hour * 60 + minute;

      const slot =
        minutes >= 18 * 60 + 30
          ? "evening"
          : minutes >= 10 * 60
            ? "morning"
            : null;

      if (!slot) return;

      const names = pendingTasks.slice(0, 3).map((task) => task.title);
      const remaining = pendingTasks.length - names.length;
      const detail = `${names.join(", ")}${
        remaining > 0 ? ` y ${remaining} más` : ""
      }`;

      void createNotificationOnce({
        key: `reminder_${dayKey()}_${slot}_${userId}`,
        recipientId: userId,
        senderId: userId,
        title: `⏰ Tenés ${pendingTasks.length} tarea${
          pendingTasks.length === 1 ? "" : "s"
        } pendiente${pendingTasks.length === 1 ? "" : "s"}`,
        body: detail,
        type: "reminder",
        sourceId: `${dayKey()}_${slot}`
      });
    };

    checkReminder();
    const interval = window.setInterval(checkReminder, 60_000);
    return () => window.clearInterval(interval);
  }, [role, userId, pendingTasks]);

  useEffect(() => {
    if (!userId || !FIREBASE_WEB_PUSH_VAPID_KEY) return;

    let unsubscribeMessage = () => {};

    void isSupported().then((supported) => {
      if (!supported) return;
      const messaging = getMessaging(app);
      unsubscribeMessage = onMessage(messaging, (payload) => {
        const title = payload.notification?.title ?? "ScanGame";
        const body = payload.notification?.body ?? "Tenés una novedad";
        toast(title, { description: body });
      });
    });

    return () => unsubscribeMessage();
  }, [userId]);

  const enablePush = async () => {
    if (!userId || !role) return;

    if (!FIREBASE_WEB_PUSH_VAPID_KEY) {
      setPushStatus("missing-key");
      return;
    }

    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setPushStatus("unsupported");
      return;
    }

    try {
      const supported = await isSupported();
      if (!supported) {
        setPushStatus("unsupported");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("denied");
        return;
      }

      const registration = await navigator.serviceWorker.register(
        `${import.meta.env.BASE_URL}firebase-messaging-sw.js`
      );
      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: FIREBASE_WEB_PUSH_VAPID_KEY,
        serviceWorkerRegistration: registration
      });

      if (!token) throw new Error("Firebase no devolvió un token push");

      await setDoc(
        doc(db, "pushTokens", encodeURIComponent(token)),
        {
          token,
          userId,
          role,
          enabled: true,
          updatedAt: new Date().toISOString(),
          userAgent: navigator.userAgent
        },
        { merge: true }
      );

      setPushStatus("enabled");
      toast.success("Notificaciones del teléfono activadas");
    } catch (error) {
      console.error("Error activando push:", error);
      setPushStatus("error");
    }
  };

  const markRead = async (notification: ScanGameNotification) => {
    if (notification.read) return;
    await updateDoc(doc(db, "notifications", notification.id), { read: true });
  };

  const markAllRead = async () => {
    const unread = notifications.filter((item) => !item.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((item) => {
      batch.update(doc(db, "notifications", item.id), { read: true });
    });
    await batch.commit();
  };

  const updateAdminPreference = async (
    key: keyof NotificationPrefs,
    value: boolean
  ) => {
    if (role !== "admin" || !userId) return;

    await updateDoc(doc(db, "users", userId), {
      [`notificationPrefs.${key}`]: value
    });
  };

  if (!userId || !role) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setPanelOpen(true)}
        className="fixed right-4 top-20 z-[80] flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#386FA4] shadow-xl ring-1 ring-[#386FA4]/10"
        aria-label="Notificaciones"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-5 w-5" />
        ) : (
          <Bell className="h-5 w-5" />
        )}

        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {panelOpen && (
        <div className="fixed inset-0 z-[180] flex bg-black/45">
          <div className="flex-1" onClick={() => setPanelOpen(false)} />

          <div className="flex h-full w-[90%] max-w-sm flex-col bg-[#F7F8FC] shadow-2xl">
            <div className="bg-gradient-to-r from-[#386FA4] to-[#2d5a85] p-5 text-white">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white/70">
                    {userName}
                  </p>
                  <h2 className="text-xl font-bold">Notificaciones</h2>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  className="text-white hover:bg-white/20"
                  onClick={() => setPanelOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  className="bg-white/15 text-white hover:bg-white/25"
                  onClick={() => void markAllRead()}
                >
                  <CheckCheck className="mr-2 h-4 w-4" />
                  Marcar leídas
                </Button>

                <Button
                  size="sm"
                  className="bg-emerald-500 text-white hover:bg-emerald-600"
                  onClick={() => void enablePush()}
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Activar push
                </Button>
              </div>

              {pushStatus === "enabled" && (
                <p className="mt-2 text-xs text-emerald-100">
                  ✓ Push activado en este dispositivo
                </p>
              )}
              {pushStatus === "missing-key" && (
                <p className="mt-2 text-xs text-amber-100">
                  Falta cargar la clave Web Push de Firebase. El centro interno ya funciona.
                </p>
              )}
              {pushStatus === "denied" && (
                <p className="mt-2 text-xs text-amber-100">
                  El navegador no dio permiso para notificaciones.
                </p>
              )}
              {(pushStatus === "unsupported" || pushStatus === "error") && (
                <p className="mt-2 text-xs text-amber-100">
                  No se pudo activar push en este dispositivo.
                </p>
              )}
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {role === "admin" && (
                <Card className="border-2 border-[#386FA4]/10 bg-white p-4">
                  <p className="font-bold text-[#12130F]">Qué querés recibir</p>
                  <p className="mb-3 text-xs text-[#386FA4]">
                    Podés apagar avisos que te resulten demasiado frecuentes.
                  </p>

                  <PreferenceRow
                    label="Productos que escanea Marti"
                    checked={adminPrefs.scans}
                    onChange={(value) =>
                      void updateAdminPreference("scans", value)
                    }
                  />
                  <PreferenceRow
                    label="Tareas enviadas"
                    checked={adminPrefs.taskActivity}
                    onChange={(value) =>
                      void updateAdminPreference("taskActivity", value)
                    }
                  />
                  <PreferenceRow
                    label="Pedidos de tienda"
                    checked={adminPrefs.storeActivity}
                    onChange={(value) =>
                      void updateAdminPreference("storeActivity", value)
                    }
                  />
                  <PreferenceRow
                    label="Logros desbloqueados"
                    checked={adminPrefs.achievements}
                    onChange={(value) =>
                      void updateAdminPreference("achievements", value)
                    }
                  />
                </Card>
              )}

              {role === "user" && (
                <Card className="border-2 border-violet-100 bg-violet-50 p-4">
                  <p className="font-bold text-violet-900">
                    Recordatorios de tareas
                  </p>
                  <p className="mt-1 text-sm text-violet-700">
                    ScanGame te recuerda los pendientes por la mañana y al final de la tarde. Si ya terminaste todo, no te molesta.
                  </p>
                </Card>
              )}

              <section>
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-[#12130F]">Novedades</h3>
                  <Badge className="bg-[#386FA4]/10 text-[#386FA4]">
                    {notifications.length}
                  </Badge>
                </div>

                <div className="space-y-2">
                  {notifications.length === 0 && (
                    <Card className="border-dashed bg-white p-5 text-center text-sm text-[#386FA4]">
                      Todavía no hay notificaciones.
                    </Card>
                  )}

                  {notifications.slice(0, 40).map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => void markRead(notification)}
                      className="w-full text-left"
                    >
                      <Card
                        className={`p-3 ${
                          notification.read
                            ? "border-slate-100 bg-white"
                            : "border-[#386FA4]/30 bg-blue-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                              notification.read ? "bg-slate-300" : "bg-[#386FA4]"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-[#12130F]">
                              {notification.title}
                            </p>
                            <p className="mt-0.5 text-sm text-[#386FA4]">
                              {notification.body}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {new Date(notification.createdAt).toLocaleString("es-AR", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                          </div>
                        </div>
                      </Card>
                    </button>
                  ))}
                </div>
              </section>

              {role === "user" && (
                <section>
                  <div className="mb-2 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <h3 className="font-bold text-[#12130F]">Tus logros</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {ACHIEVEMENTS.map((definition) => {
                      const unlocked = achievements.find(
                        (item) => item.id === definition.id
                      );

                      return (
                        <Card
                          key={definition.id}
                          className={`p-3 ${
                            unlocked
                              ? "border-amber-200 bg-amber-50"
                              : "border-slate-200 bg-slate-100 opacity-60"
                          }`}
                        >
                          <p className="text-xl">{definition.emoji}</p>
                          <p className="mt-1 text-xs font-bold text-[#12130F]">
                            {definition.title}
                          </p>
                          <p className="mt-1 text-[10px] text-[#386FA4]">
                            {definition.description}
                          </p>
                          <p className="mt-2 text-[10px] font-bold text-violet-600">
                            +{definition.bonusXp} XP
                          </p>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {achievementPopup && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 px-5">
          <Card className="w-full max-w-sm overflow-hidden border-0 bg-white text-center shadow-2xl">
            <div className="bg-gradient-to-br from-amber-400 via-orange-400 to-violet-600 px-6 py-8 text-white">
              <div className="text-6xl">{achievementPopup.emoji}</div>
              <p className="mt-3 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                Nuevo logro
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {achievementPopup.title}
              </h2>
            </div>

            <div className="p-6">
              <p className="text-sm text-[#386FA4]">
                {achievementPopup.description}
              </p>
              <div className="mx-auto mt-4 inline-flex items-center rounded-full bg-violet-100 px-4 py-2 text-sm font-black text-violet-700">
                +{achievementPopup.bonusXp} XP
              </div>

              <Button
                className="mt-5 w-full bg-[#386FA4] text-white"
                onClick={() => setAchievementPopup(null)}
              >
                <Check className="mr-2 h-4 w-4" />
                ¡Genial!
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}

function PreferenceRow({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-slate-100 py-3 first:border-t-0">
      <span className="text-sm font-semibold text-[#12130F]">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
