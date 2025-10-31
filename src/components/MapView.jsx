import { useEffect, useState, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapView.css";
import Joystick from "./Joystick";
import {
  zooAreas,
  calculateDistance,
  getCongestionColor,
  calculateBearing,
} from "../data/mockData";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function MapView({
  selectedDestinations,
  onAreaSelect,
  currentPath,
  userPosition,
  onDestinationToggle,
  congestionUpdate,
  categoryFilter,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [, forceUpdate] = useState(0);
  const moveInterval = useRef(null);
  const categoryFilterRef = useRef(categoryFilter);

  useEffect(() => {
    categoryFilterRef.current = categoryFilter;
  }, [categoryFilter]);

  useEffect(() => {
    if (congestionUpdate !== undefined) {
      forceUpdate((prev) => prev + 1);
    }
  }, [congestionUpdate]);

  const handleJoystickMove = (direction) => {
    if (!map.current) return;

    if (moveInterval.current) {
      clearInterval(moveInterval.current);
      moveInterval.current = null;
    }

    if (direction.x === 0 && direction.y === 0) {
      return;
    }

    const moveSpeed = 0.00001;

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
    }, 50);
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [userPosition.longitude, userPosition.latitude],
      zoom: 19.5,
      pitch: 80,
      bearing: 120,
      antialias: true,
      projection: "globe",
    });

    if (map.current.dragPan) {
      map.current.dragPan.disable();
    }

    map.current.on("load", () => {
      addMarkers();
      addRoute();
    });

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

      const newBearing = startBearing - dx * 0.3;
      const newPitch = clamp(startPitch + dy * 0.2, 0, 80);

      map.current.easeTo({
        bearing: newBearing,
        pitch: newPitch,
        duration: 0,
      });
    };

    const onPointerUp = () => {
      isPointerDown = false;
      canvas.style.cursor = "grab";
      addMarkers();
    };

    const handleMouseDown = (e) => onPointerDown(e.clientX, e.clientY);
    const handleMouseMove = (e) => onPointerMove(e.clientX, e.clientY);
    const handleMouseUp = () => onPointerUp();

    canvas.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

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

    map.current.on("rotate", () => {
      addMarkers();
    });

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);

      if (moveInterval.current) {
        clearInterval(moveInterval.current);
        moveInterval.current = null;
      }

      markers.current.forEach((marker) => marker.remove());
      markers.current = [];

      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  const addMarkers = useCallback(() => {
    const currentFilter = categoryFilterRef.current;

    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    if (!map.current) return;

    const filteredAreas =
      currentFilter && currentFilter.length > 0
        ? zooAreas.filter((area) => currentFilter.includes(area.category))
        : zooAreas;

    filteredAreas.forEach((area) => {
      const distance = Math.round(
        calculateDistance(
          userPosition.latitude,
          userPosition.longitude,
          area.latitude,
          area.longitude
        )
      );

      const color = getCongestionColor(area.congestionLevel);
      const isSelected = selectedDestinations.includes(area.id);
      const selectedClass = isSelected ? "selected" : "";

      const el = document.createElement("div");
      el.className = `custom-marker ${selectedClass}`;
      el.innerHTML = `
        <div class="marker-container">
          <div class="ar-distance-badge" style="background: linear-gradient(135deg, ${color}ee 0%, ${color}dd 100%); border-color: ${color}88;">
            ${distance}m
          </div>
          <div class="marker-pin" style="background-color: ${area.color}">
            <span class="marker-emoji">${area.emoji}</span>
            ${isSelected ? '<div class="selected-indicator">✓</div>' : ""}
          </div>
          <div class="marker-shadow"></div>
        </div>
      `;

      el.addEventListener("click", () => {
        setSelectedMarker(area);
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([area.longitude, area.latitude])
        .addTo(map.current);

      markers.current.push(marker);
    });
  }, [userPosition, selectedDestinations, onDestinationToggle]);

  useEffect(() => {
    if (map.current) {
      addMarkers();
    }
  }, [categoryFilter, addMarkers]);

  const addRoute = () => {
    if (!currentPath || !map.current) return;

    const coordinates = currentPath.areas.map((area) => [
      area.longitude,
      area.latitude,
    ]);

    if (map.current.getLayer("route")) {
      map.current.removeLayer("route");
      map.current.removeSource("route");
    }

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

  useEffect(() => {
    if (map.current) {
      if (currentPath) {
        addRoute();
        if (currentPath.areas && currentPath.areas.length >= 2) {
          const start = currentPath.areas[0];
          const end = currentPath.areas[1];
          const bearing = calculateBearing(
            start.latitude,
            start.longitude,
            end.latitude,
            end.longitude
          );
          map.current.easeTo({
            bearing: bearing,
            duration: 1000,
          });
        }
      } else {
        if (map.current.getLayer("route")) {
          map.current.removeLayer("route");
        }
        if (map.current.getSource("route")) {
          map.current.removeSource("route");
        }
      }
    }
  }, [currentPath]);

  useEffect(() => {
    if (map.current) {
      map.current.setCenter([userPosition.longitude, userPosition.latitude]);
      addMarkers();
    }
  }, [userPosition, addMarkers]);

  useEffect(() => {
    if (map.current) {
      addMarkers();
    }
  }, [addMarkers, congestionUpdate]);

  return (
    <div className="map-view-container">
      <div className="user-marker-overlay">
        <div className="user-marker-container">
          <div className="user-marker-dot"></div>
          <div className="user-marker-pulse"></div>
        </div>
      </div>

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
              onClick={() => {
                // 모든 선택된 목적지 제거
                selectedDestinations.forEach((destId) => {
                  onDestinationToggle && onDestinationToggle(destId);
                });
              }}
              title="안내 취소"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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
                className={`ar-navigate-btn ${
                  selectedDestinations.includes(selectedMarker.id)
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  onDestinationToggle && onDestinationToggle(selectedMarker.id);
                  setSelectedMarker(null);
                }}
              >
                {selectedDestinations.includes(selectedMarker.id)
                  ? "✕ 경로에서 제거하기"
                  : "➕ 경로에 추가하기"}
              </button>
            )}
          </div>
        </div>
      )}

      <div ref={mapContainer} className="mapbox-map" />

      <Joystick onMove={handleJoystickMove} />
    </div>
  );
}

export default MapView;
