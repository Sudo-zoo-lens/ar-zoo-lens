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

  // GPS 위치 추적 (현재는 비활성화 - 정문 위치 사용)
  useEffect(() => {
    // TODO: 실제 GPS를 사용하려면 아래 주석을 해제하세요
    /*
    if ("geolocation" in navigator) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("GPS 위치를 가져올 수 없습니다:", error);
          // 실패 시 정문 위치 사용
          setUserPosition(currentLocation);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 5000,
        }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
    */

    // 테스트용: 정문에서 시작
    console.log("테스트 모드: 정문 위치 사용 중");
  }, []);

  // 테스트용: 키보드로 회전 (Q/E 키 + 한글 ㅂ/ㄷ)
  useEffect(() => {
    const handleKeyDown = (event) => {
      const key = event.key.toLowerCase();
      switch (key) {
        case "q":
        case "ㅂ":
          // 왼쪽으로 회전
          setHeading((prev) => normalizeAngle(prev - 5));
          break;
        case "e":
        case "ㄷ":
          // 오른쪽으로 회전
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

      const pois = zooAreas
        .map((area) => {
          // 거리 계산
          const distance = calculateDistance(
            userPosition.latitude,
            userPosition.longitude,
            area.latitude,
            area.longitude
          );

          // 방위각 계산 (0-360)
          const bearing = normalizeAngle(
            calculateBearing(
              userPosition.latitude,
              userPosition.longitude,
              area.latitude,
              area.longitude
            )
          );

          // 화면 상 각도 차이 계산 (-180 ~ +180)
          const angleDiff = getAngleDifference(bearing, normalizedHeading);

          return {
            ...area,
            distance: Math.round(distance), // 정수로 반올림하여 떨림 방지
            bearing: Math.round(bearing),
            angleDiff: Math.round(angleDiff * 10) / 10, // 소수점 한 자리로 제한
          };
        })
        .filter((poi) => {
          // 시야각 내에 있고 (±60도), 200m 이내인 것만
          return Math.abs(poi.angleDiff) < 60 && poi.distance < 200;
        })
        .sort((a, b) => a.distance - b.distance); // 가까운 순서

      setVisiblePOIs(pois);
    };

    updateVisiblePOIs();
    const interval = setInterval(updateVisiblePOIs, 300); // 0.3초마다 업데이트 (떨림 방지)

    return () => clearInterval(interval);
  }, [userPosition, heading, forceUpdate]);

  return (
    <div className="ar-overlay-container">
      {/* AR 시설 상세 패널 */}
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

      {/* 개발 정보 (디버깅용) */}
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

      {/* AR 마커들 */}
      {!selectedPOI &&
        visiblePOIs.map((poi) => {
          // 화면 상의 X 위치 계산 (-60도 ~ +60도를 0% ~ 100%로 변환)
          const screenX = ((poi.angleDiff + 60) / 120) * 100;

          // 거리에 따른 크기 조정 (가까울수록 크게, 더 크게 표시)
          const scale = Math.max(0.8, Math.min(2.5, 150 / poi.distance));

          // 거리에 따른 Y 위치 (가까운 것은 중앙, 먼 것은 약간 위쪽)
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

      {/* 중앙 십자선 */}
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
