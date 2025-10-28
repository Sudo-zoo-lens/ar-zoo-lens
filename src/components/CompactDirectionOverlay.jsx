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
    <div className="compact-direction-overlay">
      {/* 닫기 버튼 */}
      <button 
        className="close-direction-btn" 
        onClick={() => {
          console.log('닫기 버튼 클릭됨');
          if (onClose) {
            onClose();
          } else {
            console.log('onClose 함수가 없습니다');
          }
        }}
      >
        ✕
      </button>

      {/* 컴팩트 뷰 - 항상 보임 */}
      <div className="compact-view" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="compact-arrow" style={{ color: config.color }}>
          {config.icon}
        </div>
        <div className="compact-info">
          <div className="compact-destination">
            {nextStop.emoji} {nextStop.name}
          </div>
          <div className="compact-distance">{distance}m</div>
        </div>
        <div className="expand-indicator">{isExpanded ? "▼" : "▲"}</div>
      </div>

      {/* 확장 뷰 - 탭하면 보임 */}
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
