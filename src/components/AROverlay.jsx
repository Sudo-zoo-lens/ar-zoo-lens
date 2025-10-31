import { useEffect, useState } from "react";
import {
  zooAreas,
  calculateDistance,
  calculateBearing,
  currentLocation,
} from "../data/mockData";
import "./AROverlay.css";

function AROverlay({
  userPosition: externalUserPosition,
  onAreaSelect,
  congestionUpdate,
  categoryFilter,
}) {
  const [userPosition, setUserPosition] = useState(
    externalUserPosition || currentLocation
  );
  const [heading, setHeading] = useState(0); // 사용자가 바라보는 방향 (도)
  const [visiblePOIs, setVisiblePOIs] = useState([]);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [forceUpdate, setForceUpdate] = useState(0);

  // 각도를 0-360 범위로 정규화
  const normalizeAngle = (angle) => {
    let normalized = angle % 360;
    if (normalized < 0) normalized += 360;
    return normalized;
  };

  // 두 각도의 차이를 -180 ~ +180 범위로 계산
  const getAngleDifference = (targetAngle, currentAngle) => {
    let diff = targetAngle - currentAngle;
    while (diff > 180) diff -= 360;
    while (diff < -180) diff += 360;
    return diff;
  };

  // 외부에서 전달받은 위치가 변경되면 업데이트
  useEffect(() => {
    if (externalUserPosition) {
      setUserPosition(externalUserPosition);
    }
  }, [externalUserPosition]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      switch (key) {
        case "q":
        case "ㅂ":
          setHeading((prev) => normalizeAngle(prev - 5));
          break;
        case "e":
        case "ㄷ":
          setHeading((prev) => normalizeAngle(prev + 5));
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 디바이스 방향 추적
  useEffect(() => {
    const handleOrientation = (event) => {
      if (event.alpha !== null) {
        // alpha: 0-360도, 북쪽이 0도
        // iOS: alpha는 북쪽이 0도, 시계방향
        const compass = normalizeAngle(360 - event.alpha);
        setHeading(compass);
      }
    };

    // iOS 13+ 권한 요청
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      DeviceOrientationEvent.requestPermission()
        .then((response) => {
          if (response === "granted") {
            window.addEventListener("deviceorientation", handleOrientation);
          }
        })
        .catch(console.error);
    } else {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    return () =>
      window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  // 혼잡도 업데이트 감지
  useEffect(() => {
    if (congestionUpdate !== undefined) {
      setForceUpdate((prev) => prev + 1);
    }
  }, [congestionUpdate]);

  // 보이는 시설 계산 (떨림 방지를 위해 업데이트 주기 조정)
  useEffect(() => {
    const updateVisiblePOIs = () => {
      // heading을 정규화 (안전장치)
      const normalizedHeading = normalizeAngle(heading);

      const filteredAreas =
        categoryFilter && categoryFilter.length > 0
          ? zooAreas.filter((area) => categoryFilter.includes(area.category))
          : zooAreas;

      const pois = filteredAreas
        .map((area) => {
          const distance = calculateDistance(
            userPosition.latitude,
            userPosition.longitude,
            area.latitude,
            area.longitude
          );

          const bearing = normalizeAngle(
            calculateBearing(
              userPosition.latitude,
              userPosition.longitude,
              area.latitude,
              area.longitude
            )
          );

          const angleDiff = getAngleDifference(bearing, normalizedHeading);

          return {
            ...area,
            distance: Math.round(distance),
            bearing: Math.round(bearing),
            angleDiff: Math.round(angleDiff * 10) / 10,
          };
        })
        .filter((poi) => {
          return Math.abs(poi.angleDiff) < 60 && poi.distance < 200;
        })
        .sort((a, b) => a.distance - b.distance);

      setVisiblePOIs(pois);
    };

    updateVisiblePOIs();
    const interval = setInterval(updateVisiblePOIs, 300);

    return () => clearInterval(interval);
  }, [userPosition, heading, forceUpdate, categoryFilter]);

  return (
    <div className="ar-overlay-container">
      {selectedPOI && (
        <div className="ar-facility-panel">
          <button
            className="ar-facility-close-btn"
            onClick={() => setSelectedPOI(null)}
            title="닫기"
          >
            ✕
          </button>

          <div className="ar-facility-header">
            <span className="ar-facility-emoji">{selectedPOI.emoji}</span>
            <h3 className="ar-facility-name">{selectedPOI.name}</h3>
          </div>

          <p className="ar-facility-description">{selectedPOI.description}</p>

          <div className="ar-facility-stats">
            <div className="ar-stat-card">
              <div className="ar-stat-label">혼잡도</div>
              <div
                className="ar-stat-value"
                style={{
                  color:
                    selectedPOI.congestionLevel < 0.3
                      ? "#4CAF50"
                      : selectedPOI.congestionLevel < 0.6
                      ? "#FFC107"
                      : selectedPOI.congestionLevel < 0.8
                      ? "#FF9800"
                      : "#F44336",
                }}
              >
                {selectedPOI.congestionLevel < 0.3
                  ? "여유"
                  : selectedPOI.congestionLevel < 0.6
                  ? "보통"
                  : selectedPOI.congestionLevel < 0.8
                  ? "혼잡"
                  : "매우 혼잡"}
              </div>
            </div>

            <div className="ar-stat-card">
              <div className="ar-stat-label">방문객</div>
              <div className="ar-stat-value">
                {selectedPOI.visitors} / {selectedPOI.capacity}명
              </div>
            </div>

            <div className="ar-stat-card">
              <div className="ar-stat-label">거리</div>
              <div className="ar-stat-value">
                {Math.round(selectedPOI.distance)}m
              </div>
            </div>
          </div>

          {selectedPOI.id !== "main-gate" && (
            <button
              className="ar-navigate-btn"
              onClick={() => {
                onAreaSelect && onAreaSelect(selectedPOI);
                setSelectedPOI(null);
              }}
            >
              🧭 여기로 안내
            </button>
          )}
        </div>
      )}

      {!selectedPOI && (
        <div className="ar-debug-info">
          <div>
            방향: {Math.round(normalizeAngle(heading))}° (시설:{" "}
            {visiblePOIs.length}개)
          </div>
          <div>
            위치: {userPosition.latitude.toFixed(6)},{" "}
            {userPosition.longitude.toFixed(6)}
          </div>
          <div style={{ fontSize: "10px", marginTop: "4px", opacity: 0.7 }}>
            Q/E: 회전 (±5°)
          </div>
        </div>
      )}

      {!selectedPOI &&
        visiblePOIs.map((poi) => {
          const screenX = ((poi.angleDiff + 60) / 120) * 100;

          const scale = Math.max(0.8, Math.min(2.5, 150 / poi.distance));

          const screenY = Math.max(
            30,
            Math.min(50, 50 - (200 - poi.distance) / 10)
          );

          return (
            <div
              key={poi.id}
              className="ar-poi-marker"
              style={{
                left: `${screenX}%`,
                top: `${screenY}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                cursor: "pointer",
              }}
              onClick={() => {
                setSelectedPOI(poi);
              }}
            >
              <div
                className="ar-poi-icon"
                style={{
                  backgroundColor: poi.color,
                }}
              >
                <span className="ar-poi-emoji">{poi.emoji}</span>
              </div>
              <div className="ar-poi-info">
                <div className="ar-poi-name">{poi.name}</div>
                <div className="ar-poi-distance">
                  {Math.round(poi.distance)}m
                </div>
              </div>
            </div>
          );
        })}

      {!selectedPOI && (
        <div className="ar-crosshair">
          <div className="crosshair-horizontal"></div>
          <div className="crosshair-vertical"></div>
        </div>
      )}
    </div>
  );
}

export default AROverlay;
