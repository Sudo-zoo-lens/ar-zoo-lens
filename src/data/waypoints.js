// 웨이포인트 데이터
// 각 시설간의 실제 길(pathway)을 따라가는 중간 지점들

export const waypoints = {
  // 정문 -> 바다동물
  "main-gate-to-sea-animals": [
    { latitude: 37.549544, longitude: 127.076119 }, // 시작: 정문
    { latitude: 37.5485, longitude: 127.079 }, // 웨이포인트1
    { latitude: 37.5475, longitude: 127.081 }, // 웨이포인트2
    { latitude: 37.5473265330352, longitude: 127.082822587213 }, // 끝: 바다동물
  ],

  // 바다동물 -> 초식동물
  "sea-animals-to-herbivore": [
    { latitude: 37.5473265330352, longitude: 127.082822587213 },
    { latitude: 37.5478, longitude: 127.0825 },
    { latitude: 37.5479146124793, longitude: 127.082568623513 },
  ],

  // 예시: 더 추가하려면
  "herbivore-to-carnivore": [
    { latitude: 37.5479146124793, longitude: 127.082568623513 },
    { latitude: 37.5483, longitude: 127.0828 },
    { latitude: 37.5488399906927, longitude: 127.083135460948 },
  ],

  // ... 각 경로마다 웨이포인트 정의
};

// 두 시설 사이의 경로에 웨이포인트가 있는지 찾기
export const getWaypointsBetween = (fromId, toId) => {
  const key = `${fromId}-to-${toId}`;
  return waypoints[key] || null;
};

// 역방향 경로도 체크
export const findWaypoints = (fromId, toId) => {
  const forward = getWaypointsBetween(fromId, toId);
  if (forward) return forward;

  const backward = getWaypointsBetween(toId, fromId);
  if (backward) {
    // 역방향이면 뒤집어서 반환
    return [...backward].reverse();
  }

  return null;
};
