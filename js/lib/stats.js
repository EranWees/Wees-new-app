// Real numbers, calculated from the client's sessions.
// Only delivered (ready) sessions count, so unpaid or released ones never add photos.
function clientStats(batches) {
  const delivered = batches.filter((b) => b.status === "ready");
  return {
    photos: delivered.reduce((sum, b) => sum + b.photos, 0),
    sessions: delivered.length,
  };
}
