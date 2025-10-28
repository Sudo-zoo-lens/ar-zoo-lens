import { useEffect, useState, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapView.css";
import Joystick from "./Joystick";
import {
  zooAreas,
  calculateDistance,
  getCongestionColor,
} from "../data/mockData";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MapView({
  selectedDestination,
  onAreaSelect,
  currentPath,
  userPosition,
  onDestinationChange,
  congestionUpdate,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [, forceUpdate] = useState(0);
  const moveInterval = useRef(null);

  // 혼잡도 업데이트 시 강제 리렌더링
  useEffect(() => {
    if (congestionUpdate !== undefined) {
      forceUpdate((prev) => prev + 1);
    }
  }, [congestionUpdate]);

  // 조이스틱 이동 핸들러
  const handleJoystickMove = (direction) => {
    if (!map.current) return;

    // 기존 이동 인터벌 정리
    if (moveInterval.current) {
      clearInterval(moveInterval.current);
      moveInterval.current = null;
    }

    // 조이스틱이 중앙에 있으면 이동 중지
    if (direction.x === 0 && direction.y === 0) {
      return;
    }

    // 이동 속도 설정 (조이스틱 값에 비례)
    const moveSpeed = 0.00001; // 지도 좌표 단위로 이동

    // 현재 지도 중심점과 회전각 가져오기
    const currentCenter = map.current.getCenter();
    const currentBearing = map.current.getBearing(); // 현재 바라보는 방향 (도 단위)

    // 회전각을 라디안으로 변환
    const bearingRad = (currentBearing * Math.PI) / 180;

    // 조이스틱 방향을 현재 바라보는 방향 기준으로 변환
    // X축: 좌우 이동 (bearing에 따라 회전)
    // Y축: 앞뒤 이동 (bearing에 따라 회전)
    const moveX =
      (direction.x * Math.cos(bearingRad) -
        direction.y * Math.sin(bearingRad)) *
      moveSpeed;
    const moveY =
      (direction.x * Math.sin(bearingRad) +
        direction.y * Math.cos(bearingRad)) *
      moveSpeed;

    // 새로운 중심점 계산
    const newCenter = [
      currentCenter.lng + moveX,
      currentCenter.lat - moveY, // Y축은 반대 방향
    ];

    // 지도 중심점 부드럽게 이동
    map.current.easeTo({
      center: newCenter,
      duration: 100, // 빠른 반응을 위한 짧은 지속시간
    });

    // 연속 이동을 위한 인터벌 설정
    moveInterval.current = setInterval(() => {
      const currentCenter = map.current.getCenter();
      const currentBearing = map.current.getBearing();
      const bearingRad = (currentBearing * Math.PI) / 180;

      const moveX =
        (direction.x * Math.cos(bearingRad) -
          direction.y * Math.sin(bearingRad)) *
        moveSpeed;
      const moveY =
        (direction.x * Math.sin(bearingRad) +
          direction.y * Math.cos(bearingRad)) *
        moveSpeed;

      const newCenter = [currentCenter.lng + moveX, currentCenter.lat - moveY];

      map.current.easeTo({
        center: newCenter,
        duration: 100,
      });
    }, 50); // 50ms마다 이동
  };

  // 지도 초기화
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [userPosition.longitude, userPosition.latitude],
      zoom: 18,
      pitch: 60, // 포켓몬고 스타일 1인칭 시점
      bearing: 0, // 방향
      antialias: true,
      projection: "globe", // 지구 곡률 표현
    });

    // 드래그로 지도 이동은 막고 회전만 허용 (기본 회전 제스처 유지)
    if (map.current.dragPan) {
      map.current.dragPan.disable();
    }

    // 지도 로드 완료 후 마커 추가
    map.current.on("load", () => {
      addMarkers();
      addRoute();
    });

    // 커스텀 회전 제스처: 좌클릭/터치 드래그로 회전, 세로 드래그로 피치
    const canvas = map.current.getCanvas();
    let isPointerDown = false;
    let startX = 0;
    let startY = 0;
    let startBearing = 0;
    let startPitch = 0;

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

    const onPointerDown = (x, y) => {
      isPointerDown = true;
      startX = x;
      startY = y;
      startBearing = map.current.getBearing();
      startPitch = map.current.getPitch();
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (x, y) => {
      if (!isPointerDown) return;
      const dx = x - startX;
      const dy = y - startY;

      const newBearing = startBearing - dx * 0.3; // 좌우 드래그로 회전
      const newPitch = clamp(startPitch + dy * 0.2, 0, 80); // 상하 드래그로 피치

      map.current.easeTo({
        bearing: newBearing,
        pitch: newPitch,
        duration: 0,
      });
    };

    const onPointerUp = () => {
      isPointerDown = false;
      canvas.style.cursor = "grab";
      updateMarkers();
    };

    // 마우스 이벤트
    const handleMouseDown = (e) => onPointerDown(e.clientX, e.clientY);
    const handleMouseMove = (e) => onPointerMove(e.clientX, e.clientY);
    const handleMouseUp = () => onPointerUp();

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // 터치 이벤트 (한 손가락)
    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      const t = e.touches[0];
      onPointerDown(t.clientX, t.clientY);
    };
    const handleTouchMove = (e) => {
      if (!isPointerDown || e.touches.length !== 1) return;
      const t = e.touches[0];
      onPointerMove(t.clientX, t.clientY);
    };
    const handleTouchEnd = () => onPointerUp();

    canvas.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);

    // 회전 시 마커 위치 업데이트
    map.current.on("rotate", () => {
      updateMarkers();
    });

    return () => {
      // 커스텀 리스너 정리
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      // 이동 인터벌 정리
      if (moveInterval.current) {
        clearInterval(moveInterval.current);
        moveInterval.current = null;
      }

      // 마커들 정리
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 사용자 위치 변경 시 지도 중심 이동
  useEffect(() => {
    if (map.current) {
      map.current.setCenter([userPosition.longitude, userPosition.latitude]);
      updateMarkers();
    }
  }, [userPosition]);

  // 마커 추가 함수
  const addMarkers = () => {
    // 기존 마커들 제거
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    if (!map.current) return;

    zooAreas.forEach((area) => {
      const distance = Math.round(
        calculateDistance(
          userPosition.latitude,
          userPosition.longitude,
          area.latitude,
          area.longitude
        )
      );

      const color = getCongestionColor(area.congestionLevel);

      // 커스텀 마커 엘리먼트 생성
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.innerHTML = `
        <div class="marker-container">
          <div class="ar-distance-badge" style="background: linear-gradient(135deg, ${color}ee 0%, ${color}dd 100%); border-color: ${color}88;">
            ${distance}m
          </div>
          <div class="marker-pin" style="background-color: ${area.color}">
            <span class="marker-emoji">${area.emoji}</span>
          </div>
          <div class="marker-shadow"></div>
        </div>
      `;

      // 클릭 이벤트 추가
      el.addEventListener("click", () => {
        setSelectedMarker(area);
      });

      // Mapbox 마커 생성 및 저장
      const marker = new mapboxgl.Marker(el)
        .setLngLat([area.longitude, area.latitude])
        .addTo(map.current);

      markers.current.push(marker);
    });

    // 사용자 위치 마커는 Mapbox 마커가 아닌 고정 오버레이로 표시
    // (이렇게 하면 화면 위치에 고정됨)
  };

  // 마커 업데이트 함수
  const updateMarkers = () => {
    addMarkers();
  };

  // 경로 추가 함수
  const addRoute = () => {
    if (!currentPath || !map.current) return;

    const coordinates = currentPath.areas.map((area) => [
      area.longitude,
      area.latitude,
    ]);

    // 기존 경로 제거
    if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }

    // 경로 라인 추가
    map.current.addSource("route", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      },
    });

    // 경로 스타일 추가
    map.current.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#2196F3",
        "line-width": 5,
        "line-opacity": 0.8,
      },
    });
  };

  // 경로 변경 시 업데이트
  useEffect(() => {
    if (map.current && currentPath) {
      addRoute();
    }
  }, [currentPath]);

  return (
    <div className="map-view-container">
      {/* 사용자 위치 마커 (고정 오버레이) */}
      <div className="user-marker-overlay">
        <div className="user-marker-container">
          <div className="user-marker-dot"></div>
          <div className="user-marker-pulse"></div>
        </div>
      </div>

      {/* AR 정보 오버레이 - 경로 안내 중 */}
      {currentPath && !selectedMarker && (
        <div className="ar-map-overlay">
          <div className="ar-info-panel">
            <div className="ar-info-item">
              <span className="ar-icon">🎯</span>
              <div className="ar-info-content">
                <div className="ar-label">목적지</div>
                <div className="ar-value">
                  {currentPath.areas[currentPath.areas.length - 1].name}
                </div>
              </div>
            </div>
            <div className="ar-info-divider"></div>
            <div className="ar-info-item">
              <span className="ar-icon">🚶</span>
              <div className="ar-info-content">
                <div className="ar-label">거리</div>
                <div className="ar-value">{currentPath.totalDistance}m</div>
              </div>
            </div>
            <div className="ar-info-divider"></div>
            <div className="ar-info-item">
              <span className="ar-icon">⏱️</span>
              <div className="ar-info-content">
                <div className="ar-label">예상 시간</div>
                <div className="ar-value">{currentPath.estimatedTime}분</div>
              </div>
            </div>
            <button
              className="ar-cancel-btn"
              onClick={() => onDestinationChange && onDestinationChange(null)}
              title="안내 취소"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* AR 정보 오버레이 - 시설 선택 시 */}
      {selectedMarker && (
        <div className="ar-map-overlay">
          <div className="ar-info-panel ar-info-panel-expanded">
            <button
              className="ar-cancel-btn"
              onClick={() => setSelectedMarker(null)}
              title="닫기"
            >
              ✕
            </button>

            <div className="ar-facility-header">
              <span className="ar-facility-emoji">{selectedMarker.emoji}</span>
              <h3 className="ar-facility-name">{selectedMarker.name}</h3>
            </div>

            <p className="ar-facility-description">
              {selectedMarker.description}
            </p>

            <div className="ar-facility-stats">
              <div className="ar-stat-card">
                <div className="ar-stat-label">혼잡도</div>
                <div
                  className="ar-stat-value"
                  style={{
                    color:
                      selectedMarker.congestionLevel < 0.3
                        ? "#4CAF50"
                        : selectedMarker.congestionLevel < 0.6
                        ? "#FFC107"
                        : selectedMarker.congestionLevel < 0.8
                        ? "#FF9800"
                        : "#F44336",
                  }}
                >
                  {selectedMarker.congestionLevel < 0.3
                    ? "여유"
                    : selectedMarker.congestionLevel < 0.6
                    ? "보통"
                    : selectedMarker.congestionLevel < 0.8
                    ? "혼잡"
                    : "매우 혼잡"}
                </div>
              </div>

              <div className="ar-stat-card">
                <div className="ar-stat-label">방문객</div>
                <div className="ar-stat-value">
                  {selectedMarker.visitors} / {selectedMarker.capacity}명
                </div>
              </div>

              <div className="ar-stat-card">
                <div className="ar-stat-label">거리</div>
                <div className="ar-stat-value">
                  {Math.round(
                    calculateDistance(
                      userPosition.latitude,
                      userPosition.longitude,
                      selectedMarker.latitude,
                      selectedMarker.longitude
                    )
                  )}
                  m
                </div>
              </div>
            </div>

            {selectedMarker.id !== "main-gate" && (
              <button
                className="ar-navigate-btn"
                onClick={() => {
                  onAreaSelect && onAreaSelect(selectedMarker);
                  setSelectedMarker(null);
                }}
              >
                🧭 여기로 안내
              </button>
            )}
          </div>
        </div>
      )}

      {/* Mapbox 지도 컨테이너 */}
      <div ref={mapContainer} className="mapbox-map" />

      {/* 조이스틱 컨트롤 */}
      <Joystick onMove={handleJoystickMove} />
    </div>
  );
}

export default MapView;
