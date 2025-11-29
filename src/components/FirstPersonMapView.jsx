import { useEffect, useState, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./FirstPersonMapView.css";
import Joystick from "./Joystick";
import {
  zooAreas,
  calculateDistance,
  getCongestionColor,
  calculateBearing,
  currentLocation,
} from "../data/mockData";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function FirstPersonMapView({
  currentPath,
  userPosition,
  recommendedRoute,
  activeRouteIndex,
  onBack,
  onNavigateComplete,
  onNavigateToNext,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const moveInterval = useRef(null);
  const [, forceUpdate] = useState(0);
  const [characterPosition, setCharacterPosition] = useState(() => {
    const mainGate = zooAreas.find((area) => area.id === "main-gate");
    return mainGate
      ? { latitude: mainGate.latitude, longitude: mainGate.longitude }
      : userPosition;
  });
  const characterPositionRef = useRef(characterPosition);
  const nubieLayerRef = useRef(null);

  // characterPosition이 변경될 때마다 ref 업데이트
  useEffect(() => {
    characterPositionRef.current = characterPosition;
  }, [characterPosition]);

  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const arrivalModalShownRef = useRef(false);
  const arrivalTimerRef = useRef(null);

  // activeRouteIndex가 변경되면 도착 모달 플래그 리셋 (단, 타이머 실행 중이 아닐 때만)
  useEffect(() => {
    // 타이머가 실행 중이 아니고 모달이 표시되지 않았을 때만 리셋
    if (!arrivalTimerRef.current && !showArrivalModal) {
      arrivalModalShownRef.current = false;
    }
  }, [activeRouteIndex, showArrivalModal]);

  // 목적지 도착 감지 (interval 사용)
  useEffect(() => {
    if (!currentPath || !recommendedRoute || recommendedRoute.length === 0)
      return;

    const currentDest = recommendedRoute[activeRouteIndex];
    if (!currentDest) return;

    let checkInterval = null;

    // 1초마다 거리 체크
    const startChecking = () => {
      checkInterval = setInterval(() => {
        // 이미 모달이 표시 중이거나 타이머가 실행 중이면 감지하지 않음
        if (arrivalModalShownRef.current || arrivalTimerRef.current) {
          return;
        }

        const distanceToDest = calculateDistance(
          characterPositionRef.current.latitude,
          characterPositionRef.current.longitude,
          currentDest.latitude,
          currentDest.longitude
        );

        // 30m 이내에 도착하고, 아직 모달을 보여주지 않았으면 도착 모달 표시
        if (distanceToDest < 30) {
          arrivalModalShownRef.current = true;
          setShowArrivalModal(true);

          // interval 중단
          if (checkInterval) {
            clearInterval(checkInterval);
            checkInterval = null;
          }

          // 기존 타이머가 있으면 정리
          if (arrivalTimerRef.current) {
            clearTimeout(arrivalTimerRef.current);
          }

          // 자동으로 2초 후 다음 목적지로 이동
          const currentIndex = activeRouteIndex;
          const hasNext = currentIndex < recommendedRoute.length - 1;
          const navigateToNext = onNavigateToNext;
          const navigateComplete = onNavigateComplete;

          arrivalTimerRef.current = setTimeout(() => {
            // 모달 닫기
            setShowArrivalModal(false);
            arrivalModalShownRef.current = false;
            arrivalTimerRef.current = null;

            // 다음 목적지로 이동 또는 완료
            if (hasNext && navigateToNext) {
              navigateToNext(currentIndex);
            } else if (navigateComplete) {
              navigateComplete();
            }
          }, 2000);
        }

        // 목적지에서 멀어지면 모달 표시 플래그 리셋 (다시 접근할 수 있도록)
        if (distanceToDest > 50) {
          arrivalModalShownRef.current = false;
        }
      }, 1000); // 1초마다 체크
    };

    startChecking();

    // cleanup
    return () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
      // 타이머는 cleanup에서 취소하지 않음 (모달이 닫힐 때까지 유지)
    };
  }, [
    currentPath,
    recommendedRoute,
    activeRouteIndex,
    onNavigateToNext,
    onNavigateComplete,
  ]);

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

    // 캐릭터 위치도 함께 업데이트
    const newCharacterPosition = {
      latitude: currentCenter.lat - moveY,
      longitude: currentCenter.lng + moveX,
    };
    setCharacterPosition(newCharacterPosition);
    characterPositionRef.current = newCharacterPosition;

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

      // 캐릭터 위치도 함께 업데이트
      const newCharPos = {
        latitude: currentCenter.lat - moveY,
        longitude: currentCenter.lng + moveX,
      };
      setCharacterPosition(newCharPos);
      characterPositionRef.current = newCharPos;

      map.current.easeTo({
        center: newCenter,
        duration: 100,
      });
    }, 50);
  };

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // 정문 위치로 시작
    const mainGate = zooAreas.find((area) => area.id === "main-gate");
    const startPosition = mainGate
      ? { latitude: mainGate.latitude, longitude: mainGate.longitude }
      : userPosition;

    // 사용자 위치 중심으로 지도 초기화
    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([startPosition.longitude, startPosition.latitude]);

    // 경로에 포함된 모든 위치 추가
    if (currentPath && currentPath.areas) {
      currentPath.areas.forEach((area) => {
        bounds.extend([area.longitude, area.latitude]);
      });
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [startPosition.longitude, startPosition.latitude],
      zoom: 19,
      pitch: 65,
      bearing: 0,
      antialias: true,
      projection: "globe",
    });

    if (map.current.dragPan) {
      map.current.dragPan.disable();
    }

    map.current.on("load", () => {
      // 경로에 맞춰 bounds 설정
      if (currentPath && currentPath.areas && currentPath.areas.length > 0) {
        map.current.fitBounds(bounds, {
          padding: { top: 100, bottom: 200, left: 80, right: 80 },
          pitch: 0,
          bearing: 0,
          duration: 1000,
        });
      } else {
        map.current.setCenter([userPosition.longitude, userPosition.latitude]);
        map.current.setZoom(17);
      }

      addMarkers();
      addRoute();
      add3DModel();

      // 다음 목적지 방향으로 카메라 회전
      if (currentPath && currentPath.areas && currentPath.areas.length >= 2) {
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
    });

    // 지도 회전/이동 제스처 설정
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
      const newPitch = clamp(startPitch + dy * 0.2, 0, 85);

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
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    if (!map.current) return;

    // 경로에 포함된 장소들만 표시
    if (currentPath && currentPath.areas) {
      currentPath.areas.forEach((area, index) => {
        const distance = Math.round(
          calculateDistance(
            userPosition.latitude,
            userPosition.longitude,
            area.latitude,
            area.longitude
          )
        );

        const color = getCongestionColor(area.congestionLevel || 0.3);
        const isDestination = index === currentPath.areas.length - 1;
        const isStart = index === 0;

        const el = document.createElement("div");
        el.className = `custom-marker ${isDestination ? "destination" : ""} ${
          isStart ? "start" : ""
        }`;
        el.innerHTML = `
          <div class="marker-container">
            ${
              !isStart
                ? `<div class="ar-distance-badge" style="background: linear-gradient(135deg, ${color}ee 0%, ${color}dd 100%); border-color: ${color}88;">
              ${distance}m
            </div>`
                : ""
            }
            <div class="marker-pin" style="background-color: ${
              area.color || color
            }">
              <span class="marker-emoji">${area.emoji}</span>
              ${
                isDestination
                  ? '<div class="destination-indicator">🎯</div>'
                  : ""
              }
            </div>
            <div class="marker-shadow"></div>
          </div>
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([area.longitude, area.latitude])
          .addTo(map.current);

        markers.current.push(marker);
      });
    }
  }, [userPosition, currentPath]);

  useEffect(() => {
    if (map.current) {
      addMarkers();
    }
  }, [addMarkers]);

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
        "line-width": 6,
        "line-opacity": 0.9,
      },
    });
  }, [currentPath]);

  const add3DModel = () => {
    if (!map.current) return;

    const create3DLayer = (
      modelPath,
      layerId,
      longitudeOffset,
      latitudeOffset,
      scaleMultiplier = 5
    ) => {
      const modelAltitude = 0;
      const modelRotate = [Math.PI / 2, 0, 0];

      return {
        id: layerId,
        type: "custom",
        renderingMode: "3d",
        onAdd: function (map, gl) {
          this.camera = new THREE.Camera();
          this.scene = new THREE.Scene();

          const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
          directionalLight.position.set(0, 70, 100).normalize();
          this.scene.add(directionalLight);

          const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
          this.scene.add(ambientLight);

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

          this.renderer = new THREE.WebGLRenderer({
            canvas: map.getCanvas(),
            context: gl,
            antialias: true,
          });

          this.renderer.autoClear = false;
        },
        render: function (gl, matrix) {
          if (!this.model) return;

          // 매 프레임 현재 캐릭터 위치를 계산
          const currentCharPos = characterPositionRef.current;
          const modelOrigin = [
            currentCharPos.longitude + longitudeOffset,
            currentCharPos.latitude + latitudeOffset,
          ];

          const modelAsMercatorCoordinate =
            mapboxgl.MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude);

          const modelTransform = {
            translateX: modelAsMercatorCoordinate.x,
            translateY: modelAsMercatorCoordinate.y,
            translateZ: modelAsMercatorCoordinate.z,
            rotateX: modelRotate[0],
            rotateY: modelRotate[1],
            rotateZ: modelRotate[2],
            scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
          };

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

    // nubie 캐릭터 레이어 - 정문 위치에 배치
    const mainGate = zooAreas.find((area) => area.id === "main-gate");
    const nubieLayer = create3DLayer(
      new URL("../image/3d/nubie.glb", import.meta.url).href,
      "3d-model-nubie",
      0,
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
    if (map.current.getLayer("3d-model-nubie")) {
      map.current.removeLayer("3d-model-nubie");
    }

    map.current.addLayer(nubieLayer);
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
      }
    }
  }, [currentPath, addRoute]);

  useEffect(() => {
    if (map.current) {
      // 정문 위치로 설정
      const mainGate = zooAreas.find((area) => area.id === "main-gate");
      if (mainGate) {
        map.current.setCenter([mainGate.longitude, mainGate.latitude]);
      } else {
        map.current.setCenter([userPosition.longitude, userPosition.latitude]);
      }
      addMarkers();
    }
  }, [userPosition, addMarkers]);

  if (!currentPath) {
    return null;
  }

  const destination = currentPath.areas[currentPath.areas.length - 1];
  const nextStop =
    currentPath.areas.length > 1 ? currentPath.areas[1] : destination;

  // 현재 위치에서 목적지까지의 거리 계산
  const distanceToDestination = Math.round(
    calculateDistance(
      characterPosition.latitude,
      characterPosition.longitude,
      destination.latitude,
      destination.longitude
    )
  );

  // 예상 도착 시간 계산 (분속 67m 가정)
  const estimatedMinutes = Math.ceil(distanceToDestination / 67);

  return (
    <div className="first-person-map-view-container">
      {/* 도착 모달 */}
      {showArrivalModal &&
        recommendedRoute &&
        recommendedRoute[activeRouteIndex] && (
          <div className="arrival-modal-overlay">
            <div className="arrival-modal">
              <div className="arrival-icon">✅</div>
              <h3 className="arrival-title">
                {recommendedRoute[activeRouteIndex].emoji}{" "}
                {recommendedRoute[activeRouteIndex].name}에 도착했습니다!
              </h3>
              {activeRouteIndex < recommendedRoute.length - 1 ? (
                <p className="arrival-message">
                  다음 목적지로 안내를 시작합니다...
                </p>
              ) : (
                <p className="arrival-message">
                  🎉 모든 목적지를 방문하셨습니다!
                </p>
              )}
            </div>
          </div>
        )}

      {/* 내비게이션 정보 패널 */}
      <div className="navigation-info-panel-top">
        <button
          className="back-navigation-btn-top"
          onClick={onBack}
          title="뒤로"
        >
          ←
        </button>
        <div className="navigation-info-content">
          <div className="navigation-info-item">
            <span className="nav-icon">🎯</span>
            <div className="nav-info-content">
              <div className="nav-label">목적지</div>
              <div className="nav-value">
                {destination.emoji} {destination.name}
              </div>
            </div>
          </div>
          <div className="navigation-info-divider"></div>
          <div className="navigation-info-item">
            <span className="nav-icon">🚶</span>
            <div className="nav-info-content">
              <div className="nav-label">남은 거리</div>
              <div className="nav-value">{distanceToDestination}m</div>
            </div>
          </div>
          <div className="navigation-info-divider"></div>
          <div className="navigation-info-item">
            <span className="nav-icon">⏱️</span>
            <div className="nav-info-content">
              <div className="nav-label">예상 시간</div>
              <div className="nav-value">{estimatedMinutes}분</div>
            </div>
          </div>
        </div>
        {recommendedRoute && recommendedRoute.length > 0 && (
          <div className="navigation-route-info">
            <div className="route-progress">
              {activeRouteIndex + 1} / {recommendedRoute.length}
            </div>
          </div>
        )}
      </div>

      <div ref={mapContainer} className="mapbox-map" />

      <Joystick onMove={handleJoystickMove} />
    </div>
  );
}

export default FirstPersonMapView;
