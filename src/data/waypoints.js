export const waypoints = {
  "main-gate-to-sea-animals": [
    { latitude: 37.549544, longitude: 127.076119 },
    { latitude: 37.5485, longitude: 127.079 },
    { latitude: 37.5475, longitude: 127.081 },
    { latitude: 37.5473265330352, longitude: 127.082822587213 },
  ],

  "sea-animals-to-herbivore": [
    { latitude: 37.5473265330352, longitude: 127.082822587213 },
    { latitude: 37.5478, longitude: 127.0825 },
    { latitude: 37.5479146124793, longitude: 127.082568623513 },
  ],

  "herbivore-to-carnivore": [
    { latitude: 37.5479146124793, longitude: 127.082568623513 },
    { latitude: 37.5483, longitude: 127.0828 },
    { latitude: 37.5488399906927, longitude: 127.083135460948 },
  ],
};

export const getWaypointsBetween = (fromId, toId) => {
  const key = `${fromId}-to-${toId}`;
  return waypoints[key] || null;
};

export const findWaypoints = (fromId, toId) => {
  const forward = getWaypointsBetween(fromId, toId);
  if (forward) return forward;

  const backward = getWaypointsBetween(toId, fromId);
  if (backward) {
    return [...backward].reverse();
  }

  return null;
};
