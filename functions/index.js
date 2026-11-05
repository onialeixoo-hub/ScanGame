const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();

const db = getFirestore();
const APP_URL = "https://onialeixoo-hub.github.io/ScanGame/";
const TIME_ZONE = "America/Argentina/Buenos_Aires";

function safeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 900);
}

async function getRoleUsers() {
  const snapshot = await db.collection("users").get();
  let admin = null;
  let user = null;

  snapshot.forEach((document) => {
    const data = document.data();
    if (data.role === "admin") admin = { id: document.id, ...data };
    if (data.role === "user") user = { id: document.id, ...data };
  });

  return { admin, user };
}

async function createNotificationOnce({
  id,
  recipientId,
  senderId,
  title,
  body,
  type,
  sourceId
}) {
  if (!recipientId) return;

  const reference = db.collection("notifications").doc(safeId(id));

  try {
    await reference.create({
      recipientId,
      senderId,
      title,
      body,
      type,
      sourceId: sourceId || null,
      createdAt: new Date().toISOString(),
      read: false
    });
  } catch (error) {
    if (error?.code === 6 || String(error?.message || "").includes("ALREADY_EXISTS")) {
      return;
    }
    throw error;
  }
}

function adminPref(admin, key) {
  return admin?.notificationPrefs?.[key] !== false;
}

async function taskTitle(taskId) {
  if (!taskId) return "Tarea";
  const snapshot = await db.collection("tasks").doc(taskId).get();
  return snapshot.exists ? snapshot.data()?.title || "Tarea" : "Tarea";
}

async function awardAvailableXpForScan(userId, scanId, xpReward) {
  if (!userId || !scanId || !xpReward || xpReward <= 0) return;

  const ledgerReference = db
    .collection("users")
    .doc(userId)
    .collection("xpLedger")
    .doc(`scan_${scanId}`);
  const progressReference = db.collection("userProgress").doc(userId);

  await db.runTransaction(async (transaction) => {
    const [ledgerSnapshot, progressSnapshot] = await Promise.all([
      transaction.get(ledgerReference),
      transaction.get(progressReference)
    ]);

    if (ledgerSnapshot.exists) return;

    const currentPoints = progressSnapshot.exists
      ? Number(progressSnapshot.data()?.points || 0)
      : 0;

    transaction.set(ledgerReference, {
      kind: "scan",
      sourceId: scanId,
      xp: xpReward,
      createdAt: new Date().toISOString()
    });

    transaction.set(
      progressReference,
      { points: currentPoints + xpReward },
      { merge: true }
    );
  });
}

exports.onScanCreated = onDocumentCreated(
  "users/{userId}/scans/{scanId}",
  async (event) => {
    const scan = event.data?.data();
    if (!scan) return;

    const userId = event.params.userId;
    const scanId = event.params.scanId;

    await awardAvailableXpForScan(userId, scanId, Number(scan.xpReward || 0));

    const { admin } = await getRoleUsers();
    if (!admin || !adminPref(admin, "scans")) return;

    await createNotificationOnce({
      id: `scan_${scanId}_${admin.id}`,
      recipientId: admin.id,
      senderId: userId,
      title: "📦 Marti escaneó un producto",
      body: `${scan.name || "Producto"}${scan.rarity ? ` · ${scan.rarity}` : ""}`,
      type: "scan",
      sourceId: scanId
    });
  }
);

exports.onTaskCreated = onDocumentCreated("tasks/{taskId}", async (event) => {
  const task = event.data?.data();
  if (!task) return;

  const { admin, user } = await getRoleUsers();
  if (!user) return;

  await createNotificationOnce({
    id: `task_new_${event.params.taskId}_${user.id}`,
    recipientId: user.id,
    senderId: admin?.id || "system",
    title: "📝 Nueva tarea",
    body: `${task.title || "Nueva tarea"} · +${Number(task.xp || task.points || 0)} XP`,
    type: "task_new",
    sourceId: event.params.taskId
  });
});

exports.onTaskClaimCreated = onDocumentCreated(
  "taskClaims/{claimId}",
  async (event) => {
    const claim = event.data?.data();
    if (!claim) return;

    const { admin } = await getRoleUsers();
    if (!admin || !adminPref(admin, "taskActivity")) return;

    const title = await taskTitle(claim.taskId);

    await createNotificationOnce({
      id: `claim_sent_${event.params.claimId}_${admin.id}`,
      recipientId: admin.id,
      senderId: claim.userId,
      title: "✅ Marti envió una tarea",
      body: `Esperando aprobación: ${title}`,
      type: "task_sent",
      sourceId: event.params.claimId
    });
  }
);

exports.onTaskClaimUpdated = onDocumentUpdated(
  "taskClaims/{claimId}",
  async (event) => {
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    if (!before || !after || before.status === after.status) return;

    const { admin } = await getRoleUsers();
    const title = await taskTitle(after.taskId);

    if (after.status === "approved") {
      await createNotificationOnce({
        id: `claim_approved_${event.params.claimId}_${after.userId}`,
        recipientId: after.userId,
        senderId: admin?.id || "system",
        title: "✅ Tarea aprobada",
        body: `${title} fue aprobada.`,
        type: "task_approved",
        sourceId: event.params.claimId
      });
    }

    if (after.status === "rejected") {
      await createNotificationOnce({
        id: `claim_rejected_${event.params.claimId}_${after.userId}`,
        recipientId: after.userId,
        senderId: admin?.id || "system",
        title: "⚠️ Tarea para revisar",
        body: after.rejectionNote
          ? `${title}: ${after.rejectionNote}`
          : `${title} fue rechazada. Revisala.`,
        type: "task_rejected",
        sourceId: event.params.claimId
      });
    }
  }
);

async function notifyRequestCreated(collectionName, requestId, request) {
  const { admin } = await getRoleUsers();
  if (!admin || !adminPref(admin, "storeActivity")) return;

  await createNotificationOnce({
    id: `${collectionName}_new_${requestId}_${admin.id}`,
    recipientId: admin.id,
    senderId: request.userId,
    title:
      collectionName === "rewardRequests"
        ? "🎁 Marti pidió un premio"
        : "✨ Marti hizo un pedido",
    body: request.rewardName || "Nuevo pedido en ScanGame",
    type: "store_request",
    sourceId: requestId
  });
}

async function notifyRequestUpdated(collectionName, requestId, before, after) {
  if (before.status === after.status || after.status === "pending") return;

  const { admin } = await getRoleUsers();
  const accepted = after.status === "approved" || after.status === "accepted";

  await createNotificationOnce({
    id: `${collectionName}_${after.status}_${requestId}_${after.userId}`,
    recipientId: after.userId,
    senderId: admin?.id || "system",
    title: accepted ? "🎉 Pedido aprobado" : "Pedido rechazado",
    body: `${after.rewardName || "Tu pedido"}: ${accepted ? "aprobado" : "rechazado"}`,
    type: "store_resolved",
    sourceId: requestId
  });
}

exports.onRewardRequestCreated = onDocumentCreated(
  "rewardRequests/{requestId}",
  async (event) => {
    const request = event.data?.data();
    if (request) {
      await notifyRequestCreated("rewardRequests", event.params.requestId, request);
    }
  }
);

exports.onRewardRequestUpdated = onDocumentUpdated(
  "rewardRequests/{requestId}",
  async (event) => {
    await notifyRequestUpdated(
      "rewardRequests",
      event.params.requestId,
      event.data.before.data(),
      event.data.after.data()
    );
  }
);

exports.onTaskRequestCreated = onDocumentCreated(
  "taskRequests/{requestId}",
  async (event) => {
    const request = event.data?.data();
    if (request) {
      await notifyRequestCreated("taskRequests", event.params.requestId, request);
    }
  }
);

exports.onTaskRequestUpdated = onDocumentUpdated(
  "taskRequests/{requestId}",
  async (event) => {
    await notifyRequestUpdated(
      "taskRequests",
      event.params.requestId,
      event.data.before.data(),
      event.data.after.data()
    );
  }
);

exports.onAchievementCreated = onDocumentCreated(
  "users/{userId}/achievements/{achievementId}",
  async (event) => {
    const achievement = event.data?.data();
    if (!achievement) return;

    const userId = event.params.userId;
    const achievementId = event.params.achievementId;
    const { admin } = await getRoleUsers();

    await createNotificationOnce({
      id: `achievement_${achievementId}_${userId}`,
      recipientId: userId,
      senderId: userId,
      title: `🏆 Logro: ${achievement.title}`,
      body: `${achievement.description} +${achievement.bonusXp} XP`,
      type: "achievement",
      sourceId: achievementId
    });

    if (admin && adminPref(admin, "achievements")) {
      await createNotificationOnce({
        id: `achievement_admin_${achievementId}_${userId}`,
        recipientId: admin.id,
        senderId: userId,
        title: `🏆 Marti desbloqueó ${achievement.title}`,
        body: achievement.description,
        type: "achievement",
        sourceId: achievementId
      });
    }
  }
);

exports.pushNewNotification = onDocumentCreated(
  "notifications/{notificationId}",
  async (event) => {
    const notification = event.data?.data();
    if (!notification?.recipientId) return;

    const tokensSnapshot = await db
      .collection("pushTokens")
      .where("userId", "==", notification.recipientId)
      .get();

    const tokenDocuments = tokensSnapshot.docs.filter(
      (document) => document.data().enabled !== false && document.data().token
    );

    if (tokenDocuments.length === 0) return;

    for (let start = 0; start < tokenDocuments.length; start += 500) {
      const chunk = tokenDocuments.slice(start, start + 500);
      const tokens = chunk.map((document) => document.data().token);

      const response = await getMessaging().sendEachForMulticast({
        tokens,
        notification: {
          title: notification.title || "ScanGame",
          body: notification.body || "Tenés una novedad"
        },
        webpush: {
          notification: {
            icon: `${APP_URL}icon-192.png`,
            badge: `${APP_URL}icon-192.png`
          },
          fcmOptions: {
            link: APP_URL
          }
        },
        data: {
          type: String(notification.type || "system"),
          notificationId: event.params.notificationId
        }
      });

      const cleanup = db.batch();
      let hasCleanup = false;

      response.responses.forEach((item, index) => {
        if (item.success) return;
        const code = item.error?.code || "";
        if (
          code.includes("registration-token-not-registered") ||
          code.includes("invalid-registration-token")
        ) {
          cleanup.delete(chunk[index].ref);
          hasCleanup = true;
        }
      });

      if (hasCleanup) await cleanup.commit();
    }
  }
);

function localDateKey(value) {
  return new Date(value).toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function currentDayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: TIME_ZONE });
}

function currentWeekStartKey() {
  const now = new Date();
  const local = new Date(now.toLocaleString("en-US", { timeZone: TIME_ZONE }));
  const day = local.getDay();
  local.setDate(local.getDate() - (day === 0 ? 6 : day - 1));
  return local.toLocaleDateString("en-CA");
}

async function createPendingTaskSummaries(slot) {
  const [usersSnapshot, tasksSnapshot] = await Promise.all([
    db.collection("users").where("role", "==", "user").get(),
    db.collection("tasks").where("active", "==", true).get()
  ]);

  const tasks = tasksSnapshot.docs.map((document) => ({
    id: document.id,
    ...document.data()
  }));
  const today = currentDayKey();
  const weekStart = currentWeekStartKey();

  for (const userDocument of usersSnapshot.docs) {
    const userId = userDocument.id;
    const claimsSnapshot = await db
      .collection("taskClaims")
      .where("userId", "==", userId)
      .get();
    const claims = claimsSnapshot.docs.map((document) => document.data());

    const pending = tasks.filter((task) => {
      const taskClaims = claims.filter((claim) => claim.taskId === task.id);

      if (task.frequency === "daily") {
        const relevant = taskClaims.filter(
          (claim) => localDateKey(claim.timestamp) === today
        );
        return !relevant.some(
          (claim) => claim.status === "approved" || claim.status === "pending"
        );
      }

      if (task.frequency === "weekly") {
        const relevant = taskClaims.filter(
          (claim) => localDateKey(claim.timestamp) >= weekStart
        );
        return !relevant.some(
          (claim) => claim.status === "approved" || claim.status === "pending"
        );
      }

      return !taskClaims.some(
        (claim) => claim.status === "approved" || claim.status === "pending"
      );
    });

    if (pending.length === 0) continue;

    const names = pending.slice(0, 3).map((task) => task.title);
    const extra = pending.length - names.length;
    const body = `${names.join(", ")}${extra > 0 ? ` y ${extra} más` : ""}`;

    await createNotificationOnce({
      id: `reminder_${today}_${slot}_${userId}`,
      recipientId: userId,
      senderId: "system",
      title: `⏰ Tenés ${pending.length} tarea${pending.length === 1 ? "" : "s"} pendiente${pending.length === 1 ? "" : "s"}`,
      body,
      type: "reminder",
      sourceId: `${today}_${slot}`
    });
  }
}

exports.morningPendingReminder = onSchedule(
  {
    schedule: "0 10 * * *",
    timeZone: TIME_ZONE
  },
  async () => {
    await createPendingTaskSummaries("morning");
  }
);

exports.eveningPendingReminder = onSchedule(
  {
    schedule: "30 18 * * *",
    timeZone: TIME_ZONE
  },
  async () => {
    await createPendingTaskSummaries("evening");
  }
);
