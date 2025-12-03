import { findWaypoints } from "./waypoints";

export const categoryColors = {
  GATE: "#2196F3",
  ANIMAL: "#FF9800",
  FUN: "#E91E63",
  FACILITY: "#00BCD4",
  NATURE: "#4CAF50",
};

export const currentLocation = {
  latitude: 37.549544,
  longitude: 127.076119,
};

const METERS_PER_DEGREE_LAT = 111320;
const METERS_PER_DEGREE_LNG = 88740;

export const gpsToPosition = (latitude, longitude) => {
  const refLat = currentLocation.latitude;
  const refLng = currentLocation.longitude;

  const dx = (longitude - refLng) * METERS_PER_DEGREE_LNG;
  const dz = -(latitude - refLat) * METERS_PER_DEGREE_LAT;

  const scale = 0.1;

  return [dx * scale, 0, dz * scale];
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
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

export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
};

export const events = [
  {
    id: "alpaca-event",
    name: "알파카 체험 프로그램",
    areaId: "herbivore",
    startTime: "14:00",
    endTime: "14:50",
    description: "알파카와 함께하는 특별 체험 프로그램",
    schedule: [
      { time: "14:00~14:10", activity: "알파카는 어떤 동물이지?" },
      { time: "14:10~14:20", activity: "행동풍부화가 뭐예요?" },
      { time: "14:20~14:40", activity: "알파카를 위한 장난감 만들기" },
      { time: "14:40~14:50", activity: "알파카들의 반응을 살피고 관찰해보기" },
    ],
    maxParticipants: 20,
    currentParticipants: 8,
  },
  {
    id: "otter-feeding",
    name: "수달 먹이시간",
    areaId: "sea-animals",
    startTime: "15:00",
    endTime: "15:30",
    description: "수달들의 먹이시간 관찰",
    schedule: [
      { time: "15:00~15:15", activity: "수달 먹이 준비" },
      { time: "15:15~15:30", activity: "수달 먹이시간 관찰" },
    ],
    maxParticipants: 30,
    currentParticipants: 15,
  },
  {
    id: "animal-mukbang-live",
    name: "동물먹방라이브",
    areaId: "carnivore-village",
    startTime: "15:00",
    endTime: "15:30",
    description: "맹수들의 식사시간 라이브 관찰",
    schedule: [{ time: "15:00~15:30", activity: "맹수 먹이시간 관찰" }],
    maxParticipants: 50,
    currentParticipants: 25,
  },
];

const zooAreasData = [
  {
    id: "main-gate",
    name: "정문",
    emoji: "🚪",
    category: "GATE",
    color: categoryColors.GATE,
    latitude: 37.549544,
    longitude: 127.076119,
    capacity: 100,
    visitors: Math.floor(Math.random() * 130),
    description: "동물원 정문 입구",
  },
  {
    id: "back-gate",
    name: "후문",
    emoji: "🚪",
    category: "GATE",
    color: categoryColors.GATE,
    latitude: 37.55065,
    longitude: 127.085055,
    capacity: 80,
    visitors: Math.floor(Math.random() * 104),
    description: "동물원 후문 출구",
  },
  {
    id: "guui-gate",
    name: "구의문",
    emoji: "🚪",
    category: "GATE",
    color: categoryColors.GATE,
    latitude: 37.546198,
    longitude: 127.084548,
    capacity: 60,
    visitors: Math.floor(Math.random() * 78),
    description: "구의문 출입구",
  },

  {
    id: "sea-animals",
    name: "바다동물",
    emoji: "🐋",
    category: "ANIMAL",
    color: categoryColors.ANIMAL,
    latitude: 37.5473265330352,
    longitude: 127.082822587213,
    capacity: 50,
    visitors: Math.floor(Math.random() * 65),
    description: "바다동물 전시관",
  },
  {
    id: "herbivore",
    name: "초식동물",
    emoji: "🦒",
    category: "ANIMAL",
    color: categoryColors.ANIMAL,
    latitude: 37.5479146124793,
    longitude: 127.082568623513,
    capacity: 50,
    visitors: Math.floor(Math.random() * 65),
    description: "초식동물 서식지",
  },
  {
    id: "carnivore-village",
    name: "맹수마을",
    emoji: "🦁",
    category: "ANIMAL",
    color: categoryColors.ANIMAL,
    latitude: 37.5488399906927,
    longitude: 127.083135460948,
    capacity: 50,
    visitors: Math.floor(Math.random() * 65),
    description: "맹수들의 마을",
  },
  {
    id: "tropical-animals",
    name: "열대동물",
    emoji: "🐘",
    category: "ANIMAL",
    color: categoryColors.ANIMAL,
    latitude: 37.5493545390007,
    longitude: 127.0817327974,
    capacity: 50,
    visitors: Math.floor(Math.random() * 65),
    description: "열대동물 전시관",
  },

  {
    id: "children-garden",
    name: "어린이정원",
    emoji: "🌸",
    category: "FUN",
    color: categoryColors.FUN,
    latitude: 37.548149821116,
    longitude: 127.077855673325,
    capacity: 60,
    visitors: Math.floor(Math.random() * 78),
    description: "어린이를 위한 정원",
  },
  {
    id: "water-park",
    name: "물놀이장",
    emoji: "💦",
    category: "FUN",
    color: categoryColors.FUN,
    latitude: 37.547733817408,
    longitude: 127.08016373868,
    capacity: 70,
    visitors: Math.floor(Math.random() * 91),
    description: "시원한 물놀이 시설",
  },
  {
    id: "amusement-park",
    name: "놀이동산",
    emoji: "🎢",
    category: "FUN",
    color: categoryColors.FUN,
    latitude: 37.5509838727564,
    longitude: 127.083834,
    capacity: 80,
    visitors: Math.floor(Math.random() * 104),
    description: "신나는 놀이동산",
  },
  {
    id: "music-fountain",
    name: "음악분수",
    emoji: "⛲",
    category: "FUN",
    color: categoryColors.FUN,
    latitude: 37.5495776633293,
    longitude: 127.078219284712,
    capacity: 50,
    visitors: Math.floor(Math.random() * 65),
    description: "아름다운 음악분수",
  },
  {
    id: "imagination-land",
    name: "상상나라",
    emoji: "🎨",
    category: "FUN",
    color: categoryColors.FUN,
    latitude: 37.5507516679991,
    longitude: 127.077530197565,
    capacity: 60,
    visitors: Math.floor(Math.random() * 78),
    description: "상상력을 키우는 공간",
  },

  {
    id: "kkum-maru",
    name: "꿈마루",
    emoji: "🏠",
    category: "FACILITY",
    color: categoryColors.FACILITY,
    latitude: 37.5492570920947,
    longitude: 127.079294007445,
    capacity: 40,
    visitors: Math.floor(Math.random() * 52),
    description: "편의시설",
  },
  {
    id: "octagon",
    name: "팔각당",
    emoji: "🏛️",
    category: "FACILITY",
    color: categoryColors.FACILITY,
    latitude: 37.5499261570828,
    longitude: 127.082474652194,
    capacity: 30,
    visitors: Math.floor(Math.random() * 39),
    description: "휴게 공간",
  },
  {
    id: "guui-cafeteria",
    name: "구의문 카페테리아",
    emoji: "☕",
    category: "FACILITY",
    color: categoryColors.FACILITY,
    latitude: 37.5468659265176,
    longitude: 127.084372374435,
    capacity: 50,
    visitors: Math.floor(Math.random() * 65),
    description: "카페테리아 및 휴게소",
  },

  {
    id: "botanical-garden",
    name: "식물원",
    emoji: "🌿",
    category: "NATURE",
    color: categoryColors.NATURE,
    latitude: 37.548643,
    longitude: 127.081047,
    capacity: 40,
    visitors: Math.floor(Math.random() * 52),
    description: "다양한 식물 전시",
  },
  {
    id: "eco-pond",
    name: "생태연못",
    emoji: "🦆",
    category: "NATURE",
    color: categoryColors.NATURE,
    latitude: 37.548133,
    longitude: 127.078305,
    capacity: 30,
    visitors: Math.floor(Math.random() * 39),
    description: "생태 연못",
  },
  {
    id: "four-season-garden",
    name: "포시즌가든",
    emoji: "🌺",
    category: "NATURE",
    color: categoryColors.NATURE,
    latitude: 37.550513,
    longitude: 127.079498,
    capacity: 35,
    visitors: Math.floor(Math.random() * 46),
    description: "사계절 정원",
  },
];

export const zooAreas = zooAreasData.map((area) => ({
  ...area,
  position: gpsToPosition(area.latitude, area.longitude),
  congestionLevel: area.visitors / area.capacity,
}));

export const congestionLevels = {
  LOW: { min: 0, max: 0.3, color: "#4CAF50", label: "여유" },
  MEDIUM: { min: 0.3, max: 0.6, color: "#FFC107", label: "보통" },
  HIGH: { min: 0.6, max: 0.8, color: "#FF9800", label: "혼잡" },
  VERY_HIGH: { min: 0.8, max: 1.0, color: "#F44336", label: "매우 혼잡" },
};

export const getCongestionColor = (level) => {
  if (level <= 0.3) return congestionLevels.LOW.color;
  if (level <= 0.6) return congestionLevels.MEDIUM.color;
  if (level <= 0.8) return congestionLevels.HIGH.color;
  return congestionLevels.VERY_HIGH.color;
};

export const getCongestionLabel = (level) => {
  if (level <= 0.3) return congestionLevels.LOW.label;
  if (level <= 0.6) return congestionLevels.MEDIUM.label;
  if (level <= 0.8) return congestionLevels.HIGH.label;
  return congestionLevels.VERY_HIGH.label;
};

const getDistance = (pos1, pos2) => {
  const dx = pos1[0] - pos2[0];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dz * dz);
};

export const findOptimalPath = (
  startAreaId,
  endAreaId,
  useWaypoints = true
) => {
  const startArea = zooAreas.find((area) => area.id === startAreaId);
  const endArea = zooAreas.find((area) => area.id === endAreaId);

  if (!startArea || !endArea) return null;

  let pathPoints = [];

  if (useWaypoints) {
    const waypointsBetween = findWaypoints(
      startArea.latitude,
      startArea.longitude,
      endArea.latitude,
      endArea.longitude
    );

    pathPoints = [startArea];

    if (waypointsBetween && waypointsBetween.length > 0) {
      const waypointAreas = waypointsBetween.map((wp, idx) => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
        position: gpsToPosition(wp.latitude, wp.longitude),
        name: `경유지 ${idx + 1}`,
        emoji: "📍",
      }));
      pathPoints.push(...waypointAreas);
    } else {
      const intermediateAreas = zooAreas
        .filter((area) => area.id !== startAreaId && area.id !== endAreaId)
        .filter((area) => {
          const distToStart = getDistance(area.position, startArea.position);
          const distToEnd = getDistance(area.position, endArea.position);
          const totalDist = getDistance(startArea.position, endArea.position);
          return distToStart + distToEnd < totalDist * 1.3;
        })
        .sort((a, b) => {
          const aScore =
            getDistance(a.position, startArea.position) +
            getDistance(a.position, endArea.position);
          const bScore =
            getDistance(b.position, startArea.position) +
            getDistance(b.position, endArea.position);
          return aScore - bScore;
        });

      if (intermediateAreas.length > 0) {
        pathPoints.push(intermediateAreas[0]);
      }
    }

    pathPoints.push(endArea);
  } else {
    pathPoints = [startArea];

    const intermediateAreas = zooAreas
      .filter((area) => area.id !== startAreaId && area.id !== endAreaId)
      .filter((area) => {
        const distToStart = getDistance(area.position, startArea.position);
        const distToEnd = getDistance(area.position, endArea.position);
        const totalDist = getDistance(startArea.position, endArea.position);
        return distToStart + distToEnd < totalDist * 1.5;
      })
      .sort((a, b) => a.congestionLevel - b.congestionLevel);

    if (intermediateAreas.length > 0 && Math.random() > 0.5) {
      pathPoints.push(intermediateAreas[0]);
    }

    pathPoints.push(endArea);
  }

  const totalDist = pathPoints.reduce((total, point, index) => {
    if (index === 0) return 0;
    const prevPoint = pathPoints[index - 1];
    return (
      total +
      calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        point.latitude,
        point.longitude
      )
    );
  }, 0);

  const walkingSpeedMetersPerMin = 67;

  const estimatedTime = Math.ceil(
    pathPoints.reduce((total, point, index) => {
      if (index === 0) return 0;
      const prevPoint = pathPoints[index - 1];
      const dist = calculateDistance(
        prevPoint.latitude,
        prevPoint.longitude,
        point.latitude,
        point.longitude
      );
      const congestionLevel = point.congestionLevel || 0;
      const congestionMultiplier = 1 + congestionLevel * 0.3;
      return total + (dist / walkingSpeedMetersPerMin) * congestionMultiplier;
    }, 0)
  );

  return {
    areas: pathPoints,
    totalDistance: Math.round(totalDist),
    avgCongestion: pathPoints.some((p) => p.congestionLevel !== undefined)
      ? pathPoints.reduce((sum, p) => sum + (p.congestionLevel || 0), 0) /
        pathPoints.filter((p) => p.congestionLevel !== undefined).length
      : 0,
    estimatedTime: estimatedTime,
  };
};

export const recommendRoute = (
  selectedDestinations,
  userPosition = currentLocation,
  attendingEvents = new Set(),
  forcedRecommendations = new Set()
) => {
  if (!selectedDestinations || selectedDestinations.length === 0) {
    return null;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const destinationsWithEvents = selectedDestinations.map((destId) => {
    const area = zooAreas.find((a) => a.id === destId);
    const event = events.find((e) => e.areaId === destId);
    const isAttending = attendingEvents.has(destId);

    if (event) {
      const [startHour, startMin] = event.startTime.split(":").map(Number);
      const eventStartTime = startHour * 60 + startMin;
      const timeUntilEvent = eventStartTime - currentTime;

      return {
        ...area,
        event,
        timeUntilEvent,
        hasEvent: true,
        isAttending,
        priorityScore: calculateEventPriority(
          timeUntilEvent,
          event,
          isAttending
        ),
      };
    }

    return {
      ...area,
      event: null,
      timeUntilEvent: null,
      hasEvent: false,
      isAttending: false,
      priorityScore: 0,
    };
  });

  const destinationsWithDistance = destinationsWithEvents.map((dest) => {
    const distance = calculateDistance(
      userPosition.latitude,
      userPosition.longitude,
      dest.latitude,
      dest.longitude
    );

    const directDistance = distance;
    const congestionMultiplier = 1 + dest.congestionLevel * 0.3;
    const congestedDistance = directDistance * congestionMultiplier;

    let recommended = true;
    let notRecommendedReason = "";

    if (distance > 600) {
      recommended = false;
      notRecommendedReason = `현재 위치에서 ${Math.round(
        distance
      )}m 떨어져 있어 방문이 어려워요`;
    } else if (dest.congestionLevel > 0.8) {
      recommended = false;
      notRecommendedReason = "현재 매우 혼잡하여 관람이 어려울 수 있어요";
    }

    if (forcedRecommendations.has(dest.id)) {
      recommended = true;
      notRecommendedReason = "";
    }

    return {
      ...dest,
      distance,
      congestedDistance,
      congestionMultiplier,
      recommended,
      notRecommendedReason,
    };
  });

  const recommendedDestinations = destinationsWithDistance.filter(
    (d) => d.recommended
  );

  let useCongestionOrder = false;
  if (recommendedDestinations.length > 0) {
    const sortedByDistance = [...recommendedDestinations].sort(
      (a, b) => a.distance - b.distance
    );
    const sortedByCongestion = [...recommendedDestinations].sort(
      (a, b) => a.congestionLevel - b.congestionLevel
    );

    const distanceOrderPath = calculateTotalPathDistance(
      sortedByDistance,
      userPosition
    );
    const congestionOrderPath = calculateTotalPathDistance(
      sortedByCongestion,
      userPosition
    );

    useCongestionOrder = congestionOrderPath <= distanceOrderPath * 2;

    if (!useCongestionOrder) {
      destinationsWithDistance.forEach((dest) => {
        if (!dest.recommended) return;
        dest.recommended = false;
        dest.notRecommendedReason =
          "혼잡도 우선 경로가 거리 우선 경로보다 2배 이상 멀어요";
      });
    }
  }

  // 이벤트 시간 무시하고 기준 수정: 혼잡도와 거리만 고려
  const finalRecommendations = destinationsWithDistance.sort((a, b) => {
    if (a.recommended !== b.recommended) {
      return a.recommended ? -1 : 1;
    }

    // 이벤트 시간은 무시하고 혼잡도와 거리만 고려
    if (useCongestionOrder) {
      if (Math.abs(a.congestionLevel - b.congestionLevel) > 0.1) {
        return a.congestionLevel - b.congestionLevel;
      }
      return a.distance - b.distance;
    } else {
      return a.distance - b.distance;
    }
  });

  return finalRecommendations;
};

const calculateTotalPathDistance = (sortedDestinations, startPosition) => {
  if (sortedDestinations.length === 0) return 0;

  let totalDistance = 0;
  let currentPos = startPosition;

  for (const dest of sortedDestinations) {
    const distance = calculateDistance(
      currentPos.latitude,
      currentPos.longitude,
      dest.latitude,
      dest.longitude
    );
    totalDistance += distance;
    currentPos = { latitude: dest.latitude, longitude: dest.longitude };
  }

  return totalDistance;
};

const calculateEventPriority = (timeUntilEvent, event, isAttending = false) => {
  if (!event || timeUntilEvent === null) return 0;

  if (isAttending) {
    return 0;
  }

  if (timeUntilEvent <= 0) {
    return 10;
  } else if (timeUntilEvent <= 30) {
    return 1;
  } else if (timeUntilEvent <= 60) {
    return 2;
  } else if (timeUntilEvent <= 120) {
    return 3;
  } else {
    return 5;
  }
};

export const checkEventAttendance = (
  areaId,
  userPosition = currentLocation
) => {
  const event = events.find((e) => e.areaId === areaId);
  if (!event) return null;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startHour, startMin] = event.startTime.split(":").map(Number);
  const eventStartTime = startHour * 60 + startMin;

  const timeUntilEvent = eventStartTime - currentTime;
  const canAttend = timeUntilEvent > 0;

  const distance = calculateDistance(
    userPosition.latitude,
    userPosition.longitude,
    zooAreas.find((a) => a.id === areaId).latitude,
    zooAreas.find((a) => a.id === areaId).longitude
  );

  const walkingTime = Math.ceil(distance / 67);
  const arrivalTime = currentTime + walkingTime;
  const canArriveOnTime = arrivalTime <= eventStartTime;

  return {
    event,
    timeUntilEvent,
    canAttend,
    canArriveOnTime,
    walkingTime,
    arrivalTime:
      Math.floor(arrivalTime / 60) +
      ":" +
      String(arrivalTime % 60).padStart(2, "0"),
  };
};

export const updateCongestionLevels = () => {
  zooAreas.forEach((area) => {
    area.visitors = Math.max(
      0,
      Math.min(
        Math.floor(area.capacity * 1.3),
        area.visitors + Math.floor((Math.random() - 0.5) * 8)
      )
    );
    area.congestionLevel = area.visitors / area.capacity;
  });
};
