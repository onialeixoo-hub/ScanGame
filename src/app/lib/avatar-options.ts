export const AVATAR_IDS = [
  "camera",
  "glasses",
  "headset",
  "hoodie",
  "pepsi",
  "play"
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export const DEFAULT_USER_AVATAR: AvatarId = "hoodie";

const avatarLabels: Record<AvatarId, string> = {
  camera: "Cámara",
  glasses: "Lentes",
  headset: "Auriculares",
  hoodie: "Buzo",
  pepsi: "Pepsi",
  play: "PlayStation"
};

export function normalizeAvatarId(
  value: string | undefined,
  role: "admin" | "user"
): string {
  if (role === "admin") return "";

  const normalizedValue = value?.trim().toLowerCase() ?? "";

  const matchingAvatar = AVATAR_IDS.find(
    (avatarId) =>
      normalizedValue === avatarId ||
      normalizedValue.includes(`avatar-${avatarId}`)
  );

  return matchingAvatar ?? DEFAULT_USER_AVATAR;
}

export function getAvatarSrc(
  value: string | undefined,
  role: "admin" | "user" = "user"
): string {
  const avatarId = normalizeAvatarId(value, role);

  return avatarId
    ? `${import.meta.env.BASE_URL}avatar-${avatarId}.png`
    : "";
}

export const AVATAR_OPTIONS = AVATAR_IDS.map((id) => ({
  id,
  label: avatarLabels[id],
  src: `${import.meta.env.BASE_URL}avatar-${id}.png`
}));
