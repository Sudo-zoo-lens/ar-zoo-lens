import { useEffect, useState } from "react";
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

    // 다음 목적지 (현재는 첫 번째 웨이포인트)
    const nextArea = currentPath.areas[1]; // areas[0]은 입구(현재 위치)
    setNextStop(nextArea);

    // 현재 위치에서 다음 목적지까지의 방향 계산
    const dx = nextArea.position[0] - userPosition[0];
    const dz = nextArea.position[2] - userPosition[2];

    // 거리 계산
    const dist = Math.sqrt(dx * dx + dz * dz);
    setDistance(dist.toFixed(1));

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
            key={area.id}
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
