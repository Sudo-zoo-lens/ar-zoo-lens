import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import ARScene from "./components/ARScene";
import MapView from "./components/MapView";
import NavigationUI from "./components/NavigationUI";
import CompactDirectionOverlay from "./components/CompactDirectionOverlay";
import CameraView from "./components/CameraView";
import {
  findOptimalPath,
  currentLocation,
  updateCongestionLevels,
  recommendRoute,
  checkEventAttendance,
} from "./data/mockData";
import "./App.css";

function App() {
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [currentPath, setCurrentPath] = useState(null);
  const [firstPersonMode, setFirstPersonMode] = useState(false);
  const [userPosition, setUserPosition] = useState(currentLocation);
  const [congestionUpdate, setCongestionUpdate] = useState(0);
  const [closePanels, setClosePanels] = useState(false);
  const [recommendedRoute, setRecommendedRoute] = useState(null);
  const [showEventModal, setShowEventModal] = useState(null);
  const [showTravelConfirmModal, setShowTravelConfirmModal] = useState(null);
  const [attendingEvents, setAttendingEvents] = useState(new Set());
  const [categoryFilter, setCategoryFilter] = useState([]);

  const firstPersonModeRef = useRef(firstPersonMode);
  const userPositionRef = useRef(userPosition);
  const lastMoveTime = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      updateCongestionLevels();
      setCongestionUpdate((prev) => prev + 1);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    firstPersonModeRef.current = firstPersonMode;
  }, [firstPersonMode]);

  useEffect(() => {
    userPositionRef.current = userPosition;
  }, [userPosition]);

  const handleDestinationToggle = useCallback(
    (areaId) => {
      setSelectedDestinations((prev) => {
        const isSelected = prev.includes(areaId);
        let newDestinations;

        if (isSelected) {
          newDestinations = prev.filter((id) => id !== areaId);
          setAttendingEvents((prevEvents) => {
            const newSet = new Set(prevEvents);
            newSet.delete(areaId);
            return newSet;
          });
        } else {
          if (prev.length >= 5) {
            return prev;
          }
          newDestinations = [...prev, areaId];
        }

        const eventCheck = checkEventAttendance(areaId, userPosition);
        if (eventCheck && !isSelected) {
          setShowEventModal({ areaId, eventCheck });
          return prev;
        }

        return newDestinations;
      });
    },
    [userPosition]
  );

  const handleEventAttendance = useCallback(
    (willAttend) => {
      if (showEventModal) {
        if (willAttend) {
          setSelectedDestinations((prev) => [...prev, showEventModal.areaId]);
          setAttendingEvents(
            (prev) => new Set([...prev, showEventModal.areaId])
          );
        } else {
          setAttendingEvents((prev) => {
            const newSet = new Set(prev);
            newSet.delete(showEventModal.areaId);
            return newSet;
          });
        }
      }
      setShowEventModal(null);
    },
    [showEventModal]
  );

  useEffect(() => {
    if (selectedDestinations.length > 0) {
      const recommendations = recommendRoute(
        selectedDestinations,
        userPosition,
        attendingEvents
      );
      setRecommendedRoute(recommendations);
    } else {
      setRecommendedRoute(null);
      setCurrentPath(null);
    }
  }, [selectedDestinations, userPosition, attendingEvents]);

  const handleAreaSelect = useCallback(
    (area) => {
      if (area.id === "main-gate") return;
      handleDestinationToggle(area.id);
    },
    [handleDestinationToggle]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      const navEl = document.querySelector(".navigation-ui");
      if (navEl && navEl.contains(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      const validKeys = [
        "w",
        "s",
        "a",
        "d",
        "ㅈ",
        "ㄴ",
        "ㅁ",
        "ㄷ",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
      ];

      if (validKeys.includes(key)) {
        setClosePanels((prev) => !prev);

        event.preventDefault();
        event.stopPropagation();

        const now = Date.now();
        if (now - lastMoveTime.current < 50) {
          return;
        }
        lastMoveTime.current = now;

        const moveDistance = 0.00001;

        switch (key) {
          case "w":
          case "ㅈ":
          case "arrowup":
            setUserPosition((prev) => ({
              ...prev,
              latitude: prev.latitude + moveDistance,
            }));
            break;
          case "s":
          case "ㄴ":
          case "arrowdown":
            setUserPosition((prev) => ({
              ...prev,
              latitude: prev.latitude - moveDistance,
            }));
            break;
          case "a":
          case "ㅁ":
          case "arrowleft":
            setUserPosition((prev) => ({
              ...prev,
              longitude: prev.longitude - moveDistance,
            }));
            break;
          case "d":
          case "ㄷ":
          case "arrowright":
            setUserPosition((prev) => ({
              ...prev,
              longitude: prev.longitude + moveDistance,
            }));
            break;
          default:
            break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  const handleMove = useCallback((direction) => {
    const moveDistance = 0.00001;

    setUserPosition((prev) => {
      switch (direction) {
        case "up":
          return { ...prev, latitude: prev.latitude + moveDistance };
        case "down":
          return { ...prev, latitude: prev.latitude - moveDistance };
        case "left":
          return { ...prev, longitude: prev.longitude - moveDistance };
        case "right":
          return { ...prev, longitude: prev.longitude + moveDistance };
        default:
          return prev;
      }
    });
  }, []);

  useEffect(() => {
    const isInsideNavigationUI = (target) => {
      const path =
        (target && (target.composedPath ? target.composedPath() : null)) || [];
      if (Array.isArray(path) && path.length) {
        return path.some(
          (el) => el && el.classList && el.classList.contains("navigation-ui")
        );
      }
      let node = target;
      while (node) {
        if (node.classList && node.classList.contains("navigation-ui"))
          return true;
        node = node.parentElement;
      }
      return false;
    };

    const handlePointerStart = (event) => {
      if (isInsideNavigationUI(event.target)) return;
      setClosePanels((prev) => !prev);
    };

    window.addEventListener("touchstart", handlePointerStart, {
      passive: true,
    });

    window.addEventListener("mousedown", handlePointerStart);

    return () => {
      window.removeEventListener("touchstart", handlePointerStart);
      window.removeEventListener("mousedown", handlePointerStart);
    };
  }, []);

  return (
    <div className="app">
      {firstPersonMode && (
        <>
          <CameraView
            isActive={firstPersonMode}
            showAR={!currentPath}
            userPosition={userPosition}
            onAreaSelect={handleAreaSelect}
            congestionUpdate={congestionUpdate}
            categoryFilter={categoryFilter}
          >
            {currentPath && (
              <CompactDirectionOverlay
                currentPath={currentPath}
                userPosition={[0, 0, 0]}
                onClose={() => setCurrentPath(null)}
              />
            )}
          </CameraView>

          <div className="camera-top-bar">
            <button
              className="top-back-btn"
              onClick={() => setFirstPersonMode(false)}
            >
              🗺️
            </button>
            <div className="camera-status">AR 탐색</div>
            <div style={{ width: 44 }} />
          </div>

          <div className="reticle" />

          <button className="camera-capture-btn" onClick={() => {}}></button>
        </>
      )}

      {!firstPersonMode && (
        <NavigationUI
          selectedDestinations={selectedDestinations}
          onDestinationToggle={handleDestinationToggle}
          currentPath={currentPath}
          recommendedRoute={recommendedRoute}
          firstPersonMode={firstPersonMode}
          onModeChange={setFirstPersonMode}
          congestionUpdate={congestionUpdate}
          closePanels={closePanels}
          onTravelConfirm={setShowTravelConfirmModal}
          attendingEvents={attendingEvents}
          lockDestinationPanel={!!showEventModal}
          onCategoryFilter={setCategoryFilter}
          selectedCategory={categoryFilter}
        />
      )}

      {!firstPersonMode && (
        <MapView
          selectedDestinations={selectedDestinations}
          onAreaSelect={handleAreaSelect}
          currentPath={currentPath}
          userPosition={userPosition}
          onDestinationToggle={handleDestinationToggle}
          congestionUpdate={congestionUpdate}
          categoryFilter={categoryFilter}
        />
      )}

      {!firstPersonMode && (
        <button
          className="enter-camera-btn"
          onClick={() => setFirstPersonMode(true)}
        >
          📷 카메라
        </button>
      )}

      {showEventModal && (
        <div className="event-modal-overlay">
          <div className="event-modal">
            <h3>🎉 이벤트 참석 확인</h3>
            <div className="event-info">
              <h4>{showEventModal.eventCheck.event.name}</h4>
              <p>{showEventModal.eventCheck.event.description}</p>
              <div className="event-time">
                <span>
                  ⏰ 시작 시간: {showEventModal.eventCheck.event.startTime}
                </span>
                <span>
                  📍 도착 예정: {showEventModal.eventCheck.arrivalTime}
                </span>
              </div>
              {showEventModal.eventCheck.canArriveOnTime ? (
                <p className="success">✅ 시간 내 도착 가능합니다!</p>
              ) : (
                <p className="warning">⚠️ 이벤트 시작 후 도착 예정입니다.</p>
              )}
            </div>
            <div className="modal-buttons">
              <button
                className="btn-secondary"
                onClick={() => handleEventAttendance(false)}
              >
                취소
              </button>
              <button
                className="btn-primary"
                onClick={() => handleEventAttendance(true)}
              >
                참석하기
              </button>
            </div>
          </div>
        </div>
      )}

      {showTravelConfirmModal && (
        <div className="travel-modal-overlay">
          <div className="travel-modal">
            <h3>🚶 이 경로로 이동하시겠습니까?</h3>
            <div className="travel-info">
              <p className="travel-description">
                선택하신 {selectedDestinations.length}개 장소를 최적 순서로
                안내합니다. 이벤트 시간과 혼잡도를 고려하여 경로를 추천했습니다.
              </p>
              {recommendedRoute && recommendedRoute.length > 0 && (
                <div className="travel-route">
                  <h4 className="route-title">📋 추천 경로 순서</h4>
                  {recommendedRoute.slice(0, 5).map((dest, index) => (
                    <div key={dest.id} className="route-item">
                      <span className="route-number">{index + 1}</span>
                      <span className="route-emoji">{dest.emoji}</span>
                      <span className="route-name">{dest.name}</span>
                      {dest.hasEvent && (
                        <span className="event-tag">🎉 이벤트</span>
                      )}
                      <span className="route-distance">
                        📍{" "}
                        {Math.round(
                          Math.sqrt(
                            Math.pow(
                              dest.latitude - currentLocation.latitude,
                              2
                            ) +
                              Math.pow(
                                dest.longitude - currentLocation.longitude,
                                2
                              )
                          ) * 111320
                        )}
                        m
                      </span>
                    </div>
                  ))}
                  {recommendedRoute.length > 5 && (
                    <div className="route-more">
                      외 {recommendedRoute.length - 5}개 장소 더...
                    </div>
                  )}
                </div>
              )}
              <div className="route-benefits">
                <h4 className="benefits-title">✨ 이 경로의 장점</h4>
                <ul className="benefits-list">
                  <li>🎯 이벤트 시간에 맞춘 최적 순서</li>
                  <li>🚶‍♂️ 혼잡도가 낮은 경로 우선</li>
                  <li>📏 가장 가까운 거리로 이동</li>
                  <li>⏰ 총 이동 시간 최소화</li>
                </ul>
              </div>
            </div>
            <div className="modal-buttons">
              <button
                className="btn-secondary"
                onClick={() => setShowTravelConfirmModal(null)}
              >
                취소
              </button>
              <button
                className="btn-primary"
                onClick={() => {
                  if (recommendedRoute && recommendedRoute.length > 0) {
                    const path = findOptimalPath(
                      "main-gate",
                      recommendedRoute[0].id
                    );
                    setCurrentPath(path);
                  }
                  setShowTravelConfirmModal(null);
                }}
              >
                🚶 경로 안내 시작
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
