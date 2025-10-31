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

    const nextArea = currentPath.areas[1];
    setNextStop(nextArea);

    const dx = nextArea.position[0] - userPosition[0];
    const dz = nextArea.position[2] - userPosition[2];

    // 실제 GPS 거리 계산 (미터 단위)
    const currentArea = currentPath.areas[0];
    const dist = calculateDistance(
      currentArea.latitude,
      currentArea.longitude,
      nextArea.latitude,
      nextArea.longitude
    );
    setDistance(Math.round(dist));

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
                  key={area.id}
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
