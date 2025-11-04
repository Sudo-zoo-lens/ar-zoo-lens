import { useEffect, useState } from "react";
import { calculateDistance } from "../data/mockData";
import "./CompactDirectionOverlay.css";

function CompactDirectionOverlay({
  currentPath,
  userPosition = [0, 0, 0],
  onClose,
}) {
  const [direction, setDirection] = useState(null);
  const [distance, setDistance] = useState(0);
  const [nextStop, setNextStop] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

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

    let angle = Math.atan2(dx, -dz) * (180 / Math.PI);

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
    straight: { icon: "↑", text: "직진", color: "#4CAF50" },
    left: { icon: "←", text: "좌회전", color: "#2196F3" },
    right: { icon: "→", text: "우회전", color: "#FF9800" },
    back: { icon: "↓", text: "뒤로", color: "#F44336" },
  };

  const config = directionConfig[direction];

  return (
    <div className="compact-direction-overlay navigation-style">
      <button
        className="close-direction-btn"
        onClick={() => {
          if (onClose) {
            onClose();
          }
        }}
        title="경로 안내 종료"
      >
        ✕
      </button>

      <div className="navigation-main">
        <div className="navigation-arrow" style={{ color: config.color }}>
          {config.icon}
        </div>
        <div
          className="navigation-direction-text"
          style={{ color: config.color }}
        >
          {config.text}
        </div>
        <div className="navigation-distance">
          <span className="distance-value">{distance}</span>
          <span className="distance-unit">m</span>
        </div>
        <div className="navigation-destination">
          <span className="destination-label">목적지</span>
          <span className="destination-name">
            {nextStop.emoji} {nextStop.name}
          </span>
        </div>
      </div>

      <div className="expand-toggle" onClick={() => setIsExpanded(!isExpanded)}>
        <span>{isExpanded ? "상세 정보 접기 ▼" : "상세 정보 펼치기 ▲"}</span>
      </div>

      {isExpanded && (
        <div className="expanded-view">
          <div className="expanded-direction">
            <div className="big-arrow" style={{ color: config.color }}>
              {config.icon}
            </div>
            <div className="direction-label" style={{ color: config.color }}>
              {config.text}
            </div>
          </div>

          <div className="route-details">
            <div className="detail-label">전체 경로</div>
            <div className="route-steps">
              {currentPath.areas.map((area, index) => (
                <div
                  key={area.id || `waypoint-${index}`}
                  className={`route-step ${index === 0 ? "current" : ""} ${
                    index === 1 ? "next" : ""
                  }`}
                >
                  <span className="step-emoji">{area.emoji}</span>
                  <span className="step-name">{area.name}</span>
                </div>
              ))}
            </div>
            <div className="route-info">
              <div className="info-item">⏱️ {currentPath.estimatedTime}분</div>
              <div className="info-item">
                📏 {currentPath.totalDistance.toFixed(0)}m
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CompactDirectionOverlay;
