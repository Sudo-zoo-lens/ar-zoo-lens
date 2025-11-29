import { useEffect, useState, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./MapView.css";
import {
  zooAreas,
  calculateDistance,
  getCongestionColor,
  calculateBearing,
} from "../data/mockData";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

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
  const categoryFilterRef = useRef(categoryFilter);

  useEffect(() => {
    categoryFilterRef.current = categoryFilter;
  }, [categoryFilter]);

  useEffect(() => {
    if (congestionUpdate !== undefined) {
      forceUpdate((prev) => prev + 1);
    }
  }, [congestionUpdate]);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // 모든 시설을 포함하는 경계 계산
    const bounds = new mapboxgl.LngLatBounds();

    // 사용자 위치 추가
    bounds.extend([userPosition.longitude, userPosition.latitude]);

    // 모든 동물원 시설 위치 추가
    zooAreas.forEach((area) => {
      bounds.extend([area.longitude, area.latitude]);
    });

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [userPosition.longitude, userPosition.latitude],
      zoom: 16.5,
      pitch: 0, // 90도 수직 뷰 (0 = 완전히 위에서 내려다봄)
      bearing: 0, // 북쪽을 위로
      antialias: true,
      projection: "globe",
    });

    // 드래그로 지도 이동(pan) 활성화
    if (map.current.dragPan) {
      map.current.dragPan.enable();
    }

    map.current.on("load", () => {
      // 지도가 로드되면 모든 시설이 보이도록 bounds로 이동
      map.current.fitBounds(bounds, {
        padding: { top: 150, bottom: 200, left: 80, right: 80 },
        pitch: 0,
        bearing: 0,
        duration: 0,
      });

      addMarkers();
      addRoute();
      add3DModel();
    });

    return () => {
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

  const addRoute = useCallback(() => {
    if (!currentPath || !map.current) return;

    if (!map.current.isStyleLoaded()) {
      return;
    }

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
  }, [currentPath]);

  const add3DModel = () => {
    if (!map.current) return;

    // 3D 모델 생성 헬퍼 함수
    const create3DLayer = (
      modelPath,
      layerId,
      longitudeOffset,
      latitudeOffset,
      scaleMultiplier = 5
    ) => {
      const modelOrigin = [
        userPosition.longitude + longitudeOffset,
        userPosition.latitude + latitudeOffset,
      ];
      const modelAltitude = 0;
      const modelRotate = [Math.PI / 2, 0, 0];

      const modelAsMercatorCoordinate = mapboxgl.MercatorCoordinate.fromLngLat(
        modelOrigin,
        modelAltitude
      );

      const modelTransform = {
        translateX: modelAsMercatorCoordinate.x,
        translateY: modelAsMercatorCoordinate.y,
        translateZ: modelAsMercatorCoordinate.z,
        rotateX: modelRotate[0],
        rotateY: modelRotate[1],
        rotateZ: modelRotate[2],
        scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
      };

      return {
        id: layerId,
        type: "custom",
        renderingMode: "3d",
        onAdd: function (map, gl) {
          this.camera = new THREE.Camera();
          this.scene = new THREE.Scene();

          // 조명 추가
          const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
          directionalLight.position.set(0, 70, 100).normalize();
          this.scene.add(directionalLight);

          const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
          this.scene.add(ambientLight);

          // GLTF 로더로 모델 로드
          const loader = new GLTFLoader();
          loader.load(
            modelPath,
            (gltf) => {
              this.model = gltf.scene;
              this.scene.add(this.model);
              map.triggerRepaint();
            },
            undefined,
            (error) => {
              console.error(`3D 모델 로딩 오류 (${modelPath}):`, error);
            }
          );

          this.map = map;

          // Three.js 렌더러 설정
          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
          });

          this.renderer.autoClear = false;
        },
        render: function (gl, matrix) {
          if (!this.model) return;

          const rotationX = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(1, 0, 0),
            modelTransform.rotateX
          );
          const rotationY = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 1, 0),
            modelTransform.rotateY
          );
          const rotationZ = new THREE.Matrix4().makeRotationAxis(
            new THREE.Vector3(0, 0, 1),
            modelTransform.rotateZ
          );

          const m = new THREE.Matrix4().fromArray(matrix);
          const l = new THREE.Matrix4()
            .makeTranslation(
              modelTransform.translateX,
              modelTransform.translateY,
              modelTransform.translateZ
            )
            .scale(
              new THREE.Vector3(
                modelTransform.scale * scaleMultiplier,
                -modelTransform.scale * scaleMultiplier,
                modelTransform.scale * scaleMultiplier
              )
            )
            .multiply(rotationX)
            .multiply(rotationY)
            .multiply(rotationZ);

          this.camera.projectionMatrix = m.multiply(l);
          this.renderer.resetState();
          this.renderer.render(this.scene, this.camera);
          this.map.triggerRepaint();
        },
      };
    };

    // 나무늘보 레이어 (동쪽으로 5미터)
    const slothLayer = create3DLayer(
      new URL("../image/3d/sloth.glb", import.meta.url).href,
      "3d-model-sloth",
      0.00005,
      0,
      5
    );

    // 미어캣 레이어 (서쪽으로 5미터)
    const meerkatLayer = create3DLayer(
      new URL("../image/3d/meerkat.glb", import.meta.url).href,
      "3d-model-meerkat",
      -0.00005,
      0,
      5
    );

    // 기존 레이어가 있으면 제거
    if (map.current.getLayer("3d-model")) {
      map.current.removeLayer("3d-model");
    }
    if (map.current.getLayer("3d-model-sloth")) {
      map.current.removeLayer("3d-model-sloth");
    }
    if (map.current.getLayer("3d-model-meerkat")) {
      map.current.removeLayer("3d-model-meerkat");
    }

    // 레이어 추가
    map.current.addLayer(slothLayer);
    map.current.addLayer(meerkatLayer);
  };

  useEffect(() => {
    if (map.current) {
      if (currentPath) {
        if (map.current.isStyleLoaded()) {
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
          map.current.once("style.load", () => {
            addRoute();
          });
        }
      } else {
        if (map.current.isStyleLoaded()) {
          if (map.current.getLayer("route")) {
            map.current.removeLayer("route");
          }
          if (map.current.getSource("route")) {
            map.current.removeSource("route");
          }
        }
      }
    }
  }, [currentPath, addRoute]);

  useEffect(() => {
    if (map.current) {
      // 마커만 업데이트하고, 지도 center는 사용자가 드래그한 위치 유지
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
    </div>
  );
}

export default MapView;
