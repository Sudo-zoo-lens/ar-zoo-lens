import { useEffect, useState } from "react";
import { calculateDistance, currentLocation } from "../data/mockData";
import "./DirectionOverlay.css";

function DirectionOverlay({ currentPath, userPosition = [0, 0, 0] }) {
  const [direction, setDirection] = useState(null);
  const [distance, setDistance] = useState(0);
  const [nextStop, setNextStop] = useState(null);

  useEffect(() => {
    if (!currentPath || currentPath.areas.length < 2) {
      setDirection(null);
      return;
    }

    const currentLat = userPosition.latitude || currentPath.areas[0].latitude;
    const currentLng = userPosition.longitude || currentPath.areas[0].longitude;

    let nextArea = null;
    let minDistance = Infinity;
    const REACHED_THRESHOLD = 10; // 10m 이내면 도착한 것으로 간주

    for (let i = 1; i < currentPath.areas.length; i++) {
      const area = currentPath.areas[i];
      const dist = calculateDistance(
        currentLat,
        currentLng,
        area.latitude,
        area.longitude
      );

      if (dist > REACHED_THRESHOLD && dist < minDistance) {
        minDistance = dist;
        nextArea = area;
      }
    }

    if (!nextArea) {
      nextArea = currentPath.areas[currentPath.areas.length - 1];
      minDistance = calculateDistance(
        currentLat,
        currentLng,
        nextArea.latitude,
        nextArea.longitude
      );
    }

    setNextStop(nextArea);
    setDistance(Math.round(minDistance));

    // 현재 위치에서 다음 웨이포인트로의 방향 계산
    const dx = nextArea.position[0] - userPosition[0];
    const dz = nextArea.position[2] - userPosition[2];

    // 각도 계산 (라디안 -> 도)
    let angle = Math.atan2(dx, -dz) * (180 / Math.PI);

    // 방향 결정
    if (angle > -45 && angle <= 45) {
      setDirection("straight");
    } else if (angle > 45 && angle <= 135) {
      setDirection("right");
    } else if (angle > -135 && angle <= -45) {
      setDirection("left");
    } else {
      setDirection("back");
    }
  }, [currentPath, userPosition]);

  if (!direction || !nextStop) return null;

  const directionConfig = {
    straight: {
      icon: "↑",
      text: "직진",
      color: "#4CAF50",
      rotation: 0,
    },
    left: {
      icon: "←",
      text: "좌회전",
      color: "#2196F3",
      rotation: -90,
    },
    right: {
      icon: "→",
      text: "우회전",
      color: "#FF9800",
      rotation: 90,
    },
    back: {
      icon: "↓",
      text: "뒤로",
      color: "#F44336",
      rotation: 180,
    },
  };

  const config = directionConfig[direction];

  return (
    <div className="direction-overlay">
      <div className="direction-arrow-container">
        <div
          className="direction-arrow"
          style={{
            color: config.color,
            transform: `rotate(${config.rotation}deg)`,
          }}
        >
          {config.icon}
        </div>
        <div className="direction-text" style={{ color: config.color }}>
          {config.text}
        </div>
      </div>

      <div className="direction-info">
        <div className="direction-destination">
          <span className="destination-emoji">{nextStop.emoji}</span>
          <span className="destination-name">{nextStop.name}</span>
        </div>
        <div className="direction-distance">{distance}m</div>
      </div>

      {/* 진행 상황 */}
      <div className="route-progress">
        {currentPath.areas.map((area, index) => (
          <div
            key={area.id || `waypoint-${index}`}
            className={`progress-dot ${index === 0 ? "current" : ""} ${
              index === 1 ? "next" : ""
            }`}
            title={area.name}
          >
            {area.emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

export default DirectionOverlay;
