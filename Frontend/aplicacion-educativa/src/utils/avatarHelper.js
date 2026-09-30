export const AVATAR_MAP = {
  astronaut: "🚀",
  dino: "🦖",
  cat: "🐱",
  robot: "🤖",
  star: "⭐",
  lion: "🦁",
};

export function getAvatarEmoji(avatar) {
  if (!avatar) return "🚀";
  if (AVATAR_MAP[avatar]) return AVATAR_MAP[avatar];
  return avatar;
}
