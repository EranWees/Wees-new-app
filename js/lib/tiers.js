// Placeholder tiers. Later these come from studio settings.
const TIERS = [
  { name: "Starter", min: 0 }, { name: "Bronze", min: 51 }, { name: "Silver", min: 101 },
  { name: "Gold", min: 251 }, { name: "Platinum", min: 501 }, { name: "Diamond", min: 1001 },
];

function tierInfo(photos) {
  let i = 0;
  TIERS.forEach((t, idx) => { if (photos >= t.min) i = idx; });
  const current = TIERS[i], next = TIERS[i + 1] || null;
  const progress = next ? (photos - current.min) / (next.min - current.min) : 1;
  return { index: i, current, next, progress, remaining: next ? next.min - photos : 0 };
}
