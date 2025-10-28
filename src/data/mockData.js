import { findWaypoints } from "./waypoints";

// 카테고리별 색상 정의
export const categoryColors = {
  GATE: "#2196F3", // 파랑
  ANIMAL: "#FF9800", // 주황
  FUN: "#E91E63", // 분홍
  FACILITY: "#00BCD4", // 청록
  NATURE: "#4CAF50", // 초록
};

// 현재 위치 (정문에서 시작)
export const currentLocation = {
  latitude: 37.549544,
  longitude: 127.076119,
};

// GPS 좌표를 3D 좌표로 변환하는 함수
// 기준점(정문)을 원점(0,0,0)으로 하여 상대 좌표 계산
const METERS_PER_DEGREE_LAT = 111320; // 위도 1도당 약 111km
const METERS_PER_DEGREE_LNG = 88740; // 서울 기준 경도 1도당 약 88km

export const gpsToPosition = (latitude, longitude) => {
  const refLat = currentLocation.latitude;
  const refLng = currentLocation.longitude;

  // 위도/경도 차이를 미터로 변환
  const dx = (longitude - refLng) * METERS_PER_DEGREE_LNG;
  const dz = -(latitude - refLat) * METERS_PER_DEGREE_LAT; // Z축은 북쪽이 음수

  // 스케일 조정 (10m를 3D 공간의 1 단위로 - 더 확대됨)
  const scale = 0.1;

  return [dx * scale, 0, dz * scale];
};

// 두 GPS 좌표 사이의 거리 계산 (미터)
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // 지구 반지름 (미터)
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // 미터 단위
};

// 두 GPS 좌표 사이의 방위각 계산 (도)
export const calculateBearing = (lat1, lon1, lat2, lon2) => {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360; // 0-360도
};

// 이벤트 데이터
export const events = [
  {
    id: "alpaca-event",
    name: "알파카 체험 프로그램",
    areaId: "herbivore", // 초식동물 구역
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
    areaId: "sea-animals", // 바다동물 구역
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
    areaId: "carnivore-village", // 맹수마을
    startTime: "15:00",
    endTime: "15:30",
    description: "맹수들의 식사시간 라이브 관찰",
    schedule: [{ time: "15:00~15:30", activity: "맹수 먹이시간 관찰" }],
    maxParticipants: 50,
    currentParticipants: 25,
  },
];

// 동물원 구역 목 데이터 (원본)
const zooAreasData = [
  // 문(파랑)
  {
    id: "main-gate",
    name: "정문",
    emoji: "🚪",
    category: "GATE",
    color: categoryColors.GATE,
    latitude: 37.549544,
    longitude: 127.076119,
    capacity: 100,
    visitors: Math.floor(Math.random() * 130), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 104), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 78), // capacity의 130%까지 가능
    description: "구의문 출입구",
  },

  // 동물(주황)
  {
    id: "sea-animals",
    name: "바다동물",
    emoji: "🐋",
    category: "ANIMAL",
    color: categoryColors.ANIMAL,
    latitude: 37.5473265330352,
    longitude: 127.082822587213,
    capacity: 50,
    visitors: Math.floor(Math.random() * 65), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 65), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 65), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 65), // capacity의 130%까지 가능
    description: "열대동물 전시관",
  },

  // 재미나라(분홍)
  {
    id: "children-garden",
    name: "어린이정원",
    emoji: "🌸",
    category: "FUN",
    color: categoryColors.FUN,
    latitude: 37.548149821116,
    longitude: 127.077855673325,
    capacity: 60,
    visitors: Math.floor(Math.random() * 78), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 91), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 104), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 65), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 78), // capacity의 130%까지 가능
    description: "상상력을 키우는 공간",
  },

  // 편의시설(청록)
  {
    id: "kkum-maru",
    name: "꿈마루",
    emoji: "🏠",
    category: "FACILITY",
    color: categoryColors.FACILITY,
    latitude: 37.5492570920947,
    longitude: 127.079294007445,
    capacity: 40,
    visitors: Math.floor(Math.random() * 52), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 39), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 65), // capacity의 130%까지 가능
    description: "카페테리아 및 휴게소",
  },

  // 자연나라(초록)
  {
    id: "botanical-garden",
    name: "식물원",
    emoji: "🌿",
    category: "NATURE",
    color: categoryColors.NATURE,
    latitude: 37.548643,
    longitude: 127.081047,
    capacity: 40,
    visitors: Math.floor(Math.random() * 52), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 39), // capacity의 130%까지 가능
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
    visitors: Math.floor(Math.random() * 46), // capacity의 130%까지 가능
    description: "사계절 정원",
  },
];

// GPS 좌표를 position으로 변환하여 export
export const zooAreas = zooAreasData.map((area) => ({
  ...area,
  position: gpsToPosition(area.latitude, area.longitude),
  congestionLevel: area.visitors / area.capacity,
}));

// 혼잡도 레벨 정의
export const congestionLevels = {
  LOW: { min: 0, max: 0.3, color: "#4CAF50", label: "여유" },
  MEDIUM: { min: 0.3, max: 0.6, color: "#FFC107", label: "보통" },
  HIGH: { min: 0.6, max: 0.8, color: "#FF9800", label: "혼잡" },
  VERY_HIGH: { min: 0.8, max: 1.0, color: "#F44336", label: "매우 혼잡" },
};

// 혼잡도에 따른 색상 반환
export const getCongestionColor = (level) => {
  if (level <= 0.3) return congestionLevels.LOW.color;
  if (level <= 0.6) return congestionLevels.MEDIUM.color;
  if (level <= 0.8) return congestionLevels.HIGH.color;
  return congestionLevels.VERY_HIGH.color;
};

// 혼잡도에 따른 라벨 반환
export const getCongestionLabel = (level) => {
  if (level <= 0.3) return congestionLevels.LOW.label;
  if (level <= 0.6) return congestionLevels.MEDIUM.label;
  if (level <= 0.8) return congestionLevels.HIGH.label;
  return congestionLevels.VERY_HIGH.label;
};

// 두 지점 사이의 거리 계산
const getDistance = (pos1, pos2) => {
  const dx = pos1[0] - pos2[0];
  const dz = pos1[2] - pos2[2];
  return Math.sqrt(dx * dx + dz * dz);
};

// 간단한 경로 찾기 알고리즘 (혼잡도 고려)
export const findOptimalPath = (
  startAreaId,
  endAreaId,
  useWaypoints = true
) => {
  const startArea = zooAreas.find((area) => area.id === startAreaId);
  const endArea = zooAreas.find((area) => area.id === endAreaId);

  if (!startArea || !endArea) return null;

  // 웨이포인트 사용 여부에 따라 다르게 처리
  let pathPoints = [];

  if (useWaypoints) {
    // 웨이포인트가 있으면 사용
    const waypointsBetween = findWaypoints(startAreaId, endAreaId);

    if (waypointsBetween && waypointsBetween.length > 0) {
      // 웨이포인트를 3D 좌표로 변환
      pathPoints = waypointsBetween.map((wp) => ({
        latitude: wp.latitude,
        longitude: wp.longitude,
        position: gpsToPosition(wp.latitude, wp.longitude),
      }));
    } else {
      // 웨이포인트가 없으면 시설들만 사용 (기존 로직)
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
  } else {
    // 기존 로직: 시설들만 사용
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

  // 실제 GPS 거리 계산 (미터 단위)
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

  // 걸음 속도 기준: 평균 보행 속도 4km/h = 67m/min
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
      // 혼잡도에 따라 이동 시간 증가 (웨이포인트에는 혼잡도 정보가 없으므로 0 처리)
      const congestionLevel = point.congestionLevel || 0;
      const congestionMultiplier = 1 + congestionLevel * 0.3;
      return total + (dist / walkingSpeedMetersPerMin) * congestionMultiplier;
    }, 0)
  );

  return {
    areas: pathPoints,
    totalDistance: Math.round(totalDist), // 미터 단위
    avgCongestion: pathPoints.some((p) => p.congestionLevel !== undefined)
      ? pathPoints.reduce((sum, p) => sum + (p.congestionLevel || 0), 0) /
        pathPoints.filter((p) => p.congestionLevel !== undefined).length
      : 0,
    estimatedTime: estimatedTime, // 분 단위
  };
};

// 다중 목적지 우선순위 기반 경로 추천
export const recommendRoute = (
  selectedDestinations,
  userPosition = currentLocation,
  attendingEvents = new Set()
) => {
  if (!selectedDestinations || selectedDestinations.length === 0) {
    return null;
  }

  // 1. 이벤트 시간 우선순위 적용
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes(); // 분 단위로 변환

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

  // 2. 거리 필터링 완화 (모든 선택된 목적지 포함)
  const nearbyDestinations = destinationsWithEvents.map((dest) => {
    const distance = calculateDistance(
      userPosition.latitude,
      userPosition.longitude,
      dest.latitude,
      dest.longitude
    );

    return {
      ...dest,
      distance,
    };
  });

  // 3. 혼잡도 계산 (모든 목적지 포함하되 점수에만 반영)
  const validDestinations = nearbyDestinations.map((dest) => {
    const directDistance = dest.distance;

    // 이벤트가 임박한 경우 혼잡도 조건 완화
    const isEventUrgent =
      dest.hasEvent &&
      dest.timeUntilEvent !== null &&
      dest.timeUntilEvent <= 60;

    // 혼잡도가 높은 경우 우회 경로 고려 (점수 계산에만 사용)
    const congestionMultiplier = 1 + dest.congestionLevel * 0.3;
    const congestedDistance = directDistance * congestionMultiplier;

    // 디버깅을 위한 로그
    console.log(
      `${dest.name}: 직접거리 ${Math.round(
        directDistance
      )}m, 혼잡거리 ${Math.round(congestedDistance)}m`
    );

    return {
      ...dest,
      congestedDistance,
      congestionMultiplier,
    };
  });

  console.log(`혼잡도 계산 후: ${validDestinations.length}개 시설`);

  // 4. 종합 점수 계산 및 정렬
  const scoredDestinations = validDestinations.map((dest) => {
    // 이미 계산된 거리 사용
    const distance = dest.distance;

    // 점수 계산 (낮을수록 우선순위 높음)
    let score = 0;

    // 참석하는 이벤트가 있으면 최고 우선순위 부여
    if (dest.isAttending) {
      score = -50000; // 최고 우선순위 (음수로 가장 낮은 점수)
    } else {
      // 이벤트 우선순위 (가장 중요) - 가중치 높임
      score += dest.priorityScore * 10000;

      // 혼잡도 점수 (낮을수록 좋음) - 가중치 조정
      score += dest.congestionLevel * 500;

      // 거리 점수 (가까울수록 좋음) - 정규화
      score += distance / 5; // 미터를 점수로 변환 (더 민감하게)

      // 이벤트 참가 가능 여부 보너스
      if (
        dest.hasEvent &&
        dest.timeUntilEvent !== null &&
        dest.timeUntilEvent > 0
      ) {
        score -= 2000; // 이벤트 참가 가능한 경우 보너스
      }
    }

    return {
      ...dest,
      calculatedScore: score,
      distance,
      congestionMultiplier: 1 + dest.congestionLevel * 0.3,
    };
  });

  // 5. 최종 정렬 (점수 낮은 순)
  const finalRecommendations = scoredDestinations.sort((a, b) => {
    return a.calculatedScore - b.calculatedScore;
  });

  return finalRecommendations;
};

// 이벤트 우선순위 계산 함수
const calculateEventPriority = (timeUntilEvent, event, isAttending = false) => {
  if (!event || timeUntilEvent === null) return 0;

  // 참석하는 이벤트는 별도 처리 (최고 우선순위)
  if (isAttending) {
    return 0; // 참석하는 이벤트는 점수 계산에서 별도 처리
  }

  // 이벤트 시작까지 남은 시간에 따른 우선순위
  if (timeUntilEvent <= 0) {
    // 이미 시작된 이벤트는 낮은 우선순위
    return 10;
  } else if (timeUntilEvent <= 30) {
    // 30분 이내 시작 예정 - 최고 우선순위
    return 1;
  } else if (timeUntilEvent <= 60) {
    // 1시간 이내 시작 예정 - 높은 우선순위
    return 2;
  } else if (timeUntilEvent <= 120) {
    // 2시간 이내 시작 예정 - 중간 우선순위
    return 3;
  } else {
    // 2시간 이후 시작 예정 - 낮은 우선순위
    return 5;
  }
};

// 이벤트 참석 여부 확인 및 시간 체크
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
  const canAttend = timeUntilEvent > 0; // 이벤트 시작 전

  // 도착 가능 시간 계산 (보행 속도 67m/min)
  const distance = calculateDistance(
    userPosition.latitude,
    userPosition.longitude,
    zooAreas.find((a) => a.id === areaId).latitude,
    zooAreas.find((a) => a.id === areaId).longitude
  );

  const walkingTime = Math.ceil(distance / 67); // 분 단위
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

// 실시간 혼잡도 업데이트 시뮬레이션
export const updateCongestionLevels = () => {
  // 원본 배열을 직접 수정
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
