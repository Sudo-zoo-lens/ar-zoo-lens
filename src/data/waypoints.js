// 모든 웨이포인트를 하나의 배열로 관리
export const allWaypoints = [
  // 정문 근처
  { latitude: 37.549252, longitude: 127.076754 },
  { latitude: 37.549321, longitude: 127.077368 },
  { latitude: 37.54919, longitude: 127.077408 },
  { latitude: 37.549185, longitude: 127.078132 },
  { latitude: 37.548553, longitude: 127.079044 },
  { latitude: 37.548621, longitude: 127.079133 },

  // 식물원/환경연못 근처
  { latitude: 37.548152, longitude: 127.08073 },
  { latitude: 37.548161, longitude: 127.080863 },
  { latitude: 37.54823, longitude: 127.080997 },
  { latitude: 37.548156, longitude: 127.081085 },
  { latitude: 37.54809, longitude: 127.081333 },
  { latitude: 37.548066, longitude: 127.081758 },

  // 팔각당 방향
  { latitude: 37.549415, longitude: 127.077854 },
  { latitude: 37.549573, longitude: 127.077902 },
  { latitude: 37.549732, longitude: 127.078019 },
  { latitude: 37.549721, longitude: 127.078423 },
  { latitude: 37.550279, longitude: 127.07967 },
  { latitude: 37.550393, longitude: 127.080599 },
  { latitude: 37.550127, longitude: 127.083305 },
  { latitude: 37.54995, longitude: 127.082887 },
  { latitude: 37.549942, longitude: 127.082624 },
  { latitude: 37.5498, longitude: 127.082533 },

  // 열대동물관 근처
  { latitude: 37.548786, longitude: 127.081997 },
  { latitude: 37.54912, longitude: 127.081687 },
  { latitude: 37.549301, longitude: 127.08188 },
  { latitude: 37.549409, longitude: 127.081967 },
  { latitude: 37.549816, longitude: 127.082139 },
  { latitude: 37.549224, longitude: 127.081788 },
  { latitude: 37.549401, longitude: 127.081955 },

  // 바다동물원 근처
  { latitude: 37.547895, longitude: 127.082053 },
  { latitude: 37.547598, longitude: 127.082055 },
  { latitude: 37.547455, longitude: 127.082444 },
  { latitude: 37.547285, longitude: 127.082754 },
  { latitude: 37.547496, longitude: 127.083056 },
  { latitude: 37.547328, longitude: 127.083304 },
  { latitude: 37.547386, longitude: 127.082463 },
  { latitude: 37.547345, longitude: 127.083294 },
  { latitude: 37.547269, longitude: 127.082833 },
  { latitude: 37.547705, longitude: 127.082677 },
  { latitude: 37.547681, longitude: 127.082673 },
  { latitude: 37.547485, longitude: 127.082468 },
  { latitude: 37.54789, longitude: 127.08203 },
  { latitude: 37.547622, longitude: 127.082052 },

  // 중간 지역
  { latitude: 37.54749, longitude: 127.083049 },
  { latitude: 37.547726, longitude: 127.082733 },
  { latitude: 37.548108, longitude: 127.083238 },
  { latitude: 37.54853, longitude: 127.082693 },
  { latitude: 37.54896, longitude: 127.082399 },
  { latitude: 37.548373, longitude: 127.082296 },
  { latitude: 37.548763, longitude: 127.081971 },
  { latitude: 37.548516, longitude: 127.081529 },
  { latitude: 37.548058, longitude: 127.081754 },
  { latitude: 37.548286, longitude: 127.083513 },
  { latitude: 37.548436, longitude: 127.083615 },
  { latitude: 37.548456, longitude: 127.083635 },
  { latitude: 37.548623, longitude: 127.08359 },
  { latitude: 37.548965, longitude: 127.082383 },
  { latitude: 37.548969, longitude: 127.082429 },

  // 놀이동산 방향
  { latitude: 37.549606, longitude: 127.082816 },
  { latitude: 37.549626, longitude: 127.082857 },
  { latitude: 37.549781, longitude: 127.082691 },
  { latitude: 37.54959, longitude: 127.08283 },
  { latitude: 37.549949, longitude: 127.082634 },
  { latitude: 37.549847, longitude: 127.082579 },
  { latitude: 37.549979, longitude: 127.083231 },
  { latitude: 37.549851, longitude: 127.082524 },
  { latitude: 37.549877, longitude: 127.082129 },
  { latitude: 37.550033, longitude: 127.083305 },
  { latitude: 37.55006, longitude: 127.082605 },
  { latitude: 37.550158, longitude: 127.082654 },
  { latitude: 37.550189, longitude: 127.082626 },
  { latitude: 37.550197, longitude: 127.082689 },
  { latitude: 37.550134, longitude: 127.083116 },
  { latitude: 37.550317, longitude: 127.08338 },
  { latitude: 37.550332, longitude: 127.083632 },
  { latitude: 37.550405, longitude: 127.083565 },
  { latitude: 37.550409, longitude: 127.082679 },
  { latitude: 37.550469, longitude: 127.083567 },
  { latitude: 37.550483, longitude: 127.08353 },
  { latitude: 37.550628, longitude: 127.083651 },
  { latitude: 37.550634, longitude: 127.082421 },
  { latitude: 37.550872, longitude: 127.082452 },
  { latitude: 37.550977, longitude: 127.083309 },
  { latitude: 37.55005, longitude: 127.08371 },
  { latitude: 37.55021, longitude: 127.083492 },
  { latitude: 37.550561, longitude: 127.084308 },
  { latitude: 37.550786, longitude: 127.085186 },
  { latitude: 37.551059, longitude: 127.08382 },
  { latitude: 37.551321, longitude: 127.086207 },
  { latitude: 37.551365, longitude: 127.083131 },
];

// 거리 계산 헬퍼 함수
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

export const findWaypoints = (
  fromLat,
  fromLng,
  toLat,
  toLng,
  maxWaypoints = 30
) => {
  const waypoints = [];
  const visited = new Set();

  let currentLat = fromLat;
  let currentLng = fromLng;

  for (let i = 0; i < maxWaypoints; i++) {
    let bestWaypoint = null;
    let bestScore = Infinity;

    for (const wp of allWaypoints) {
      const wpKey = `${wp.latitude},${wp.longitude}`;

      if (visited.has(wpKey)) continue;

      const distFromCurrent = calculateDistance(
        currentLat,
        currentLng,
        wp.latitude,
        wp.longitude
      );

      const distToDestination = calculateDistance(
        wp.latitude,
        wp.longitude,
        toLat,
        toLng
      );

      const currentToDestDist = calculateDistance(
        currentLat,
        currentLng,
        toLat,
        toLng
      );

      if (distFromCurrent < 3) continue;
      if (distFromCurrent > 100) continue;
      if (distToDestination > currentToDestDist + 10) continue;

      const score = distFromCurrent + distToDestination;

      if (score < bestScore) {
        bestScore = score;
        bestWaypoint = wp;
      }
    }

    if (!bestWaypoint) {
      break;
    }

    const distToDestination = calculateDistance(
      bestWaypoint.latitude,
      bestWaypoint.longitude,
      toLat,
      toLng
    );

    if (distToDestination < 30) {
      waypoints.push(bestWaypoint);
      break;
    }

    waypoints.push(bestWaypoint);
    visited.add(`${bestWaypoint.latitude},${bestWaypoint.longitude}`);

    currentLat = bestWaypoint.latitude;
    currentLng = bestWaypoint.longitude;
  }

  return waypoints;
};
