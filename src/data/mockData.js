// 동물원 구역 목 데이터
export const zooAreas = [
  {
    id: "lion-habitat",
    name: "사자 서식지",
    emoji: "🦁",
    position: [-3, 0, -5],
    congestionLevel: 0.8, // 0.0 ~ 1.0 (낮음 ~ 높음)
    visitors: 45,
    capacity: 50,
    description: "아프리카 사자 가족을 만나보세요",
  },
  {
    id: "elephant-park",
    name: "코끼리 공원",
    emoji: "🐘",
    position: [3, 0, -5],
    congestionLevel: 0.3,
    visitors: 15,
    capacity: 50,
    description: "거대한 아시아 코끼리들의 쉼터",
  },
  {
    id: "giraffe-savanna",
    name: "기린 사바나",
    emoji: "🦒",
    position: [-3, 0, -10],
    congestionLevel: 0.6,
    visitors: 30,
    capacity: 50,
    description: "키 큰 기린들의 먹이 주기 체험",
  },
  {
    id: "panda-bamboo",
    name: "판다 대나무 숲",
    emoji: "🐼",
    position: [3, 0, -10],
    congestionLevel: 0.9,
    visitors: 48,
    capacity: 50,
    description: "귀여운 판다의 식사 시간",
  },
  {
    id: "penguin-cove",
    name: "펭귄 코브",
    emoji: "🐧",
    position: [0, 0, -15],
    congestionLevel: 0.4,
    visitors: 20,
    capacity: 50,
    description: "시원한 남극 펭귄 전시관",
  },
  {
    id: "monkey-forest",
    name: "원숭이 숲",
    emoji: "🐵",
    position: [-5, 0, -8],
    congestionLevel: 0.5,
    visitors: 25,
    capacity: 50,
    description: "장난꾸러기 원숭이들의 놀이터",
  },
  {
    id: "tiger-mountain",
    name: "호랑이 산",
    emoji: "🐯",
    position: [5, 0, -8],
    congestionLevel: 0.7,
    visitors: 35,
    capacity: 50,
    description: "백두산 호랑이 보호 구역",
  },
  {
    id: "entrance",
    name: "입구",
    emoji: "🎫",
    position: [0, 0, 0],
    congestionLevel: 0.2,
    visitors: 10,
    capacity: 100,
    description: "동물원 메인 입구",
  },
];

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
export const findOptimalPath = (startAreaId, endAreaId) => {
  const startArea = zooAreas.find((area) => area.id === startAreaId);
  const endArea = zooAreas.find((area) => area.id === endAreaId);

  if (!startArea || !endArea) return null;

  // 실제로는 더 복잡한 알고리즘을 사용하지만, 여기서는 단순화
  // 혼잡도가 낮은 경유지를 찾아서 경로 생성
  const path = [startArea];

  // 중간 경유지 찾기 (혼잡도가 낮은 곳 우선)
  const intermediateAreas = zooAreas
    .filter((area) => area.id !== startAreaId && area.id !== endAreaId)
    .filter((area) => {
      // 시작점과 끝점 사이에 있는 구역만 고려
      const distToStart = getDistance(area.position, startArea.position);
      const distToEnd = getDistance(area.position, endArea.position);
      const totalDist = getDistance(startArea.position, endArea.position);
      return distToStart + distToEnd < totalDist * 1.5;
    })
    .sort((a, b) => a.congestionLevel - b.congestionLevel);

  // 혼잡도가 가장 낮은 중간 지점 추가 (옵션)
  if (intermediateAreas.length > 0 && Math.random() > 0.5) {
    path.push(intermediateAreas[0]);
  }

  path.push(endArea);

  return {
    areas: path,
    totalDistance: path.reduce((total, area, index) => {
      if (index === 0) return 0;
      return total + getDistance(path[index - 1].position, area.position);
    }, 0),
    avgCongestion:
      path.reduce((sum, area) => sum + area.congestionLevel, 0) / path.length,
    estimatedTime: Math.ceil(
      path.reduce((total, area, index) => {
        if (index === 0) return 0;
        const dist = getDistance(path[index - 1].position, area.position);
        // 혼잡도에 따라 이동 시간 증가
        const congestionMultiplier = 1 + area.congestionLevel * 0.5;
        return total + dist * congestionMultiplier;
      }, 0) * 2 // 2분/단위
    ),
  };
};

// 실시간 혼잡도 업데이트 시뮬레이션
export const updateCongestionLevels = () => {
  return zooAreas.map((area) => ({
    ...area,
    congestionLevel: Math.max(
      0,
      Math.min(1, area.congestionLevel + (Math.random() - 0.5) * 0.1)
    ),
    visitors: Math.max(
      0,
      Math.min(
        area.capacity,
        area.visitors + Math.floor((Math.random() - 0.5) * 5)
      )
    ),
  }));
};
