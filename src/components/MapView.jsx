import { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./MapView.css";
import {
  zooAreas,
  calculateDistance,
  getCongestionColor,
} from "../data/mockData";

// Leaflet 기본 아이콘 수정 (번들링 이슈 해결)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// 커스텀 아이콘 생성 함수 (AR 느낌의 거리 정보 포함)
const createCustomIcon = (emoji, color, distance, congestionLevel) => {
  // 혼잡도에 따른 배지 색상
  const badgeColor = getCongestionColor(congestionLevel);

  return L.divIcon({
    className: "custom-marker",
    html: `
      <div class="marker-container">
        <div class="ar-distance-badge" style="background: linear-gradient(135deg, ${badgeColor}ee 0%, ${badgeColor}dd 100%); border-color: ${badgeColor}88;">
          ${distance}m
        </div>
        <div class="marker-pin" style="background-color: ${color}">
          <span class="marker-emoji">${emoji}</span>
        </div>
        <div class="marker-shadow"></div>
      </div>
    `,
    iconSize: [40, 70],
    iconAnchor: [20, 70],
    popupAnchor: [0, -70],
  });
};

// 사용자 위치 아이콘
const createUserIcon = () => {
  return L.divIcon({
    className: "user-marker",
    html: `
      <div class="user-marker-container">
        <div class="user-marker-dot"></div>
        <div class="user-marker-pulse"></div>
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
};

function MapView({
  selectedDestination,
  onAreaSelect,
  currentPath,
  userPosition,
  onDestinationChange,
  congestionUpdate,
}) {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [, forceUpdate] = useState(0);

  // 혼잡도 업데이트 시 강제 리렌더링
  useEffect(() => {
    if (congestionUpdate !== undefined) {
      forceUpdate((prev) => prev + 1);
    }
  }, [congestionUpdate]);

  // 어린이대공원 중심 좌표
  const centerPosition = [37.549, 127.081];

  // 지도가 로드되면 저장
  useEffect(() => {
    if (mapRef.current) {
      setMap(mapRef.current);
    }
  }, []);

  // 경로가 선택되면 해당 영역으로 지도 이동
  useEffect(() => {
    if (map && currentPath) {
      const pathCoordinates = currentPath.areas.map((area) => [
        area.latitude,
        area.longitude,
      ]);
      const bounds = L.latLngBounds(pathCoordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, currentPath]);

  // 경로 선 좌표
  const pathLine = currentPath
    ? currentPath.areas.map((area) => [area.latitude, area.longitude])
    : [];

  return (
    <div className="map-view-container">
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

      <MapContainer
        center={centerPosition}
        zoom={16}
        ref={mapRef}
        className="leaflet-map"
        zoomControl={true}
        scrollWheelZoom={true}
      >
        {/* 지도 타일 레이어 - 일반 지도 */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* 사용자 현재 위치 */}
        <Marker
          position={[userPosition.latitude, userPosition.longitude]}
          icon={createUserIcon()}
        >
          <Popup>
            <div className="popup-content">
              <strong>📍 현재 위치</strong>
            </div>
          </Popup>
        </Marker>

        {/* 사용자 위치 주변 원 (반경 표시) */}
        <Circle
          center={[userPosition.latitude, userPosition.longitude]}
          radius={20}
          pathOptions={{
            color: "#2196F3",
            fillColor: "#2196F3",
            fillOpacity: 0.1,
            weight: 2,
          }}
        />

        {/* 동물원 구역 마커들 (AR 스타일 - 거리 정보 포함) */}
        {zooAreas.map((area) => {
          const distance = Math.round(
            calculateDistance(
              userPosition.latitude,
              userPosition.longitude,
              area.latitude,
              area.longitude
            )
          );

          return (
            <Marker
              key={area.id}
              position={[area.latitude, area.longitude]}
              icon={createCustomIcon(
                area.emoji,
                area.color,
                distance,
                area.congestionLevel
              )}
              eventHandlers={{
                click: () => {
                  setSelectedMarker(area);
                },
              }}
            />
          );
        })}

        {/* 경로 선 (AR 네온 스타일) */}
        {pathLine.length > 0 && (
          <>
            {/* 외곽 글로우 효과 */}
            <Polyline
              positions={pathLine}
              pathOptions={{
                color: "#00E5FF",
                weight: 10,
                opacity: 0.3,
                lineCap: "round",
                lineJoin: "round",
              }}
            />
            {/* 메인 라인 */}
            <Polyline
              positions={pathLine}
              pathOptions={{
                color: "#2196F3",
                weight: 5,
                opacity: 0.9,
                dashArray: "15, 10",
                lineCap: "round",
                lineJoin: "round",
              }}
            />
          </>
        )}

        {/* 경로 상의 중간 지점 표시 */}
        {currentPath &&
          currentPath.areas.map((area, index) => (
            <Circle
              key={`path-${area.id}`}
              center={[area.latitude, area.longitude]}
              radius={10}
              pathOptions={{
                color:
                  index === 0
                    ? "#4CAF50"
                    : index === currentPath.areas.length - 1
                    ? "#F44336"
                    : "#2196F3",
                fillColor:
                  index === 0
                    ? "#4CAF50"
                    : index === currentPath.areas.length - 1
                    ? "#F44336"
                    : "#2196F3",
                fillOpacity: 0.8,
                weight: 2,
              }}
            />
          ))}
      </MapContainer>
    </div>
  );
}

export default MapView;
