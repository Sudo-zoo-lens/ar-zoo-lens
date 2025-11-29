import React, { useState, useEffect, useRef, useCallback } from "react";
import MapView from "./components/MapView";
import NavigationUI from "./components/NavigationUI";
import CompactDirectionOverlay from "./components/CompactDirectionOverlay";
import CameraView from "./components/CameraView";
import SplashScreen from "./components/SplashScreen";
import IntroScreen from "./components/IntroScreen";
import FirstPersonMapView from "./components/FirstPersonMapView";
import {
  findOptimalPath,
  currentLocation,
  updateCongestionLevels,
  recommendRoute,
  checkEventAttendance,
  gpsToPosition,
  zooAreas,
} from "./data/mockData";
import "./App.css";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentPage, setCurrentPage] = useState("intro"); // 'intro', 'map', 'list', 'navigation'
  const [initialPanelOpen, setInitialPanelOpen] = useState(false);
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
  const [forcedRecommendations, setForcedRecommendations] = useState(new Set());
  const [activeRouteIndex, setActiveRouteIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showNextDestinationModal, setShowNextDestinationModal] =
    useState(false);
  const [showStopNavigationModal, setShowStopNavigationModal] = useState(false);

  const firstPersonModeRef = useRef(firstPersonMode);
  const userPositionRef = useRef(userPosition);
  const lastMoveTime = useRef(0);
  const savedUserPositionRef = useRef(null); // navigation 시작 전 위치 저장

  // 스플래시 화면 타이머
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // 인트로 화면 시작 핸들러
  const handleIntroStart = useCallback((mode) => {
    if (mode === "map") {
      setCurrentPage("map");
      setFirstPersonMode(false);
      setInitialPanelOpen(false);
      window.history.pushState({ page: "map" }, "", "/map");
    } else if (mode === "list") {
      setCurrentPage("list");
      setFirstPersonMode(false);
      setInitialPanelOpen(true);
      window.history.pushState({ page: "list" }, "", "/list");
    }
  }, []);

  // 인트로로 돌아가기
  const handleBackToIntro = useCallback(() => {
    setCurrentPage("intro");
    setInitialPanelOpen(false);
    setSelectedDestinations([]);
    setCurrentPath(null);
    setFirstPersonMode(false);
    setIsNavigating(false);
    window.history.pushState({ page: "intro" }, "", "/");
  }, []);

  // 내비게이션 페이지에서 뒤로가기
  const handleBackFromNavigation = useCallback(() => {
    // 저장된 원래 위치로 복원
    if (savedUserPositionRef.current) {
      setUserPosition(savedUserPositionRef.current);
      savedUserPositionRef.current = null;
    }
    setCurrentPage("map");
    setIsNavigating(false);
    setCurrentPath(null);
    window.history.pushState({ page: "map" }, "", "/map");
  }, []);

  // 다음 목적지로 이동
  const handleNavigateToNext = useCallback(
    (currentIndex) => {
      if (!recommendedRoute || currentIndex >= recommendedRoute.length - 1) {
        setIsNavigating(false);
        setCurrentPath(null);
        setActiveRouteIndex(0);
        return;
      }

      const nextIndex = currentIndex + 1;
      const currentDest = recommendedRoute[currentIndex];
      const nextDest = recommendedRoute[nextIndex];

      setActiveRouteIndex(nextIndex);

      const path = findOptimalPath(currentDest.id, nextDest.id, true);

      if (path) {
        setCurrentPath(path);
      } else {
        const mainGate = zooAreas.find((area) => area.id === "main-gate");
        const startPosition = mainGate
          ? { latitude: mainGate.latitude, longitude: mainGate.longitude }
          : userPosition;
        const fallbackPath = {
          areas: [
            {
              ...startPosition,
              id: "current-position",
              name: "현재 위치",
              position: gpsToPosition(
                startPosition.latitude,
                startPosition.longitude
              ),
            },
            nextDest,
          ],
          totalDistance: nextDest.distance || 0,
          estimatedTime: Math.ceil((nextDest.distance || 0) / 67),
        };
        setCurrentPath(fallbackPath);
      }
    },
    [recommendedRoute, userPosition]
  );

  // 브라우저 뒤로가기/앞으로가기 처리
  useEffect(() => {
    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        if (event.state.page === "intro") {
          setInitialPanelOpen(false);
          setSelectedDestinations([]);
          setCurrentPath(null);
          setFirstPersonMode(false);
          setIsNavigating(false);
        } else if (event.state.page === "map") {
          setFirstPersonMode(false);
          setInitialPanelOpen(false);
          setIsNavigating(false);
        } else if (event.state.page === "list") {
          setFirstPersonMode(false);
          setInitialPanelOpen(true);
          setIsNavigating(false);
        } else if (event.state.page === "navigation") {
          setFirstPersonMode(false);
          setInitialPanelOpen(false);
          setIsNavigating(true);
        }
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

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
        if (!selectedDestinations.includes(showEventModal.areaId)) {
          setSelectedDestinations((prev) => [...prev, showEventModal.areaId]);
        }

        if (willAttend) {
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
        setShowEventModal(null);
      }
    },
    [showEventModal, selectedDestinations]
  );

  useEffect(() => {
    if (selectedDestinations.length > 0) {
      const recommendations = recommendRoute(
        selectedDestinations,
        userPosition,
        attendingEvents,
        forcedRecommendations
      );
      setRecommendedRoute(recommendations);
    } else {
      setRecommendedRoute(null);
      setCurrentPath(null);
    }
  }, [
    selectedDestinations,
    userPosition,
    attendingEvents,
    forcedRecommendations,
  ]);

  useEffect(() => {
    if (!isNavigating || !recommendedRoute || !currentPath) return;

    const currentDest = recommendedRoute[activeRouteIndex];
    if (!currentDest) return;

    const distanceToDest = Math.sqrt(
      Math.pow((userPosition.latitude - currentDest.latitude) * 111320, 2) +
        Math.pow((userPosition.longitude - currentDest.longitude) * 88740, 2)
    );

    if (distanceToDest < 30 && !showNextDestinationModal) {
      if (activeRouteIndex < recommendedRoute.length - 1) {
        const nextIndex = activeRouteIndex + 1;
        const nextDest = recommendedRoute[nextIndex];
        setActiveRouteIndex(nextIndex);

        const path = findOptimalPath(currentDest.id, nextDest.id, true);

        if (path) {
          setCurrentPath(path);
        } else {
          const fallbackPath = {
            areas: [
              {
                ...userPosition,
                id: "current-position",
                name: "현재 위치",
                position: gpsToPosition(
                  userPosition.latitude,
                  userPosition.longitude
                ),
              },
              nextDest,
            ],
            totalDistance: nextDest.distance || 0,
            estimatedTime: Math.ceil((nextDest.distance || 0) / 67),
          };
          setCurrentPath(fallbackPath);
        }
      } else {
        setIsNavigating(false);
        setCurrentPath(null);
        setActiveRouteIndex(0);
        alert("🎉 모든 목적지에 도착했습니다!");
      }
      setShowNextDestinationModal(true);
      setTimeout(() => setShowNextDestinationModal(false), 1000);
    }
  }, [
    userPosition,
    isNavigating,
    recommendedRoute,
    activeRouteIndex,
    currentPath,
    showNextDestinationModal,
  ]);

  const handleAreaSelect = useCallback(
    (area) => {
      if (area.id === "main-gate") return;
      handleDestinationToggle(area.id);
    },
    [handleDestinationToggle]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      // 목록보기 모드에서는 키보드 이동 비활성화
      if (initialPanelOpen) return;

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
  }, [initialPanelOpen]);

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
          (el) =>
            el &&
            el.classList &&
            (el.classList.contains("navigation-ui") ||
              el.classList.contains("event-modal") ||
              el.classList.contains("travel-modal"))
        );
      }
      let node = target;
      while (node) {
        if (
          node.classList &&
          (node.classList.contains("navigation-ui") ||
            node.classList.contains("event-modal") ||
            node.classList.contains("travel-modal"))
        )
          return true;
        node = node.parentElement;
      }
      return false;
    };

    const handlePointerStart = (event) => {
      // 목록보기 모드(initialPanelOpen=true)일 때는 패널 닫기 방지
      if (initialPanelOpen) return;
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
  }, [initialPanelOpen]);

  // 스플래시 화면 보여주기
  if (showSplash) {
    return <SplashScreen />;
  }

  // 인트로 화면 보여주기
  if (currentPage === "intro") {
    return <IntroScreen onStart={handleIntroStart} />;
  }

  // 내비게이션 페이지 보여주기
  if (currentPage === "navigation") {
    if (!currentPath) {
      // 경로가 없으면 지도 페이지로 돌아가기
      setCurrentPage("map");
      setIsNavigating(false);
      return null;
    }
    return (
      <div className="app">
        <FirstPersonMapView
          currentPath={currentPath}
          userPosition={userPosition}
          recommendedRoute={recommendedRoute}
          activeRouteIndex={activeRouteIndex}
          onBack={handleBackFromNavigation}
          onNavigateComplete={() => {
            // 저장된 원래 위치로 복원
            if (savedUserPositionRef.current) {
              setUserPosition(savedUserPositionRef.current);
              savedUserPositionRef.current = null;
            }
            setIsNavigating(false);
            setCurrentPath(null);
            setActiveRouteIndex(0);
          }}
          onNavigateToNext={handleNavigateToNext}
        />
      </div>
    );
  }

  // 선택된 목적지의 정보 가져오기
  const getAreaInfo = (areaId) => {
    return zooAreas.find((area) => area.id === areaId);
  };

  return (
    <div className="app">
      {/* 뒤로가기 버튼 - 지도/목록 페이지에서만 표시 */}
      {!showSplash &&
        currentPage !== "intro" &&
        currentPage !== "navigation" &&
        !firstPersonMode && (
          <button className="back-to-intro-btn" onClick={handleBackToIntro}>
            ← 홈으로
          </button>
        )}

      {/* 상단 경로 표시 바 */}
      {currentPage !== "navigation" &&
        !firstPersonMode &&
        !initialPanelOpen && (
          <div className="map-top-bar">
            <div className="route-chips-container">
              <div className="route-chips">
                <div className="route-chip current-location">내 위치</div>
                {selectedDestinations.map((destId, index) => {
                  const area = getAreaInfo(destId);
                  return (
                    <React.Fragment key={destId}>
                      <span className="route-arrow">→</span>
                      <button
                        className="route-chip destination"
                        onClick={() => handleDestinationToggle(destId)}
                      >
                        {area?.name || destId}
                      </button>
                    </React.Fragment>
                  );
                })}
              </div>
              {selectedDestinations.length > 0 && (
                <button
                  className="route-chip explore-btn"
                  onClick={() => {
                    if (recommendedRoute && recommendedRoute.length > 0) {
                      setShowTravelConfirmModal(true);
                    }
                  }}
                  disabled={!recommendedRoute || recommendedRoute.length === 0}
                >
                  탐색
                </button>
              )}
            </div>
            {selectedDestinations.length === 0 && (
              <div className="route-hint">
                지도에서 시설을 선택해주세요 (최대 5개)
              </div>
            )}
            {selectedDestinations.length >= 5 && (
              <div className="route-limit">※ 최대 5개 선택 가능</div>
            )}
          </div>
        )}

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
                onClose={() => {
                  if (isNavigating) {
                    setShowStopNavigationModal(true);
                  } else {
                    setCurrentPath(null);
                  }
                }}
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

      {currentPage !== "navigation" && !firstPersonMode && (
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
          forcedRecommendations={forcedRecommendations}
          onForceRecommend={(areaId) =>
            setForcedRecommendations((prev) => new Set([...prev, areaId]))
          }
          initialPanelOpen={initialPanelOpen}
          onPanelClose={() => setInitialPanelOpen(false)}
        />
      )}

      {currentPage !== "navigation" &&
        !firstPersonMode &&
        !initialPanelOpen && (
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

      {currentPage !== "navigation" &&
        !firstPersonMode &&
        !initialPanelOpen && (
          <>
            {/* 지도 페이지 하단 흰색 바 */}
            <div className="map-bottom-bar">
              <div className="map-action-buttons">
                <button
                  className="map-action-btn"
                  onClick={() => setInitialPanelOpen(true)}
                >
                  전체 시설 보기
                </button>
                <button
                  className="map-action-btn primary"
                  onClick={() => {
                    if (recommendedRoute && recommendedRoute.length > 0) {
                      setShowTravelConfirmModal(true);
                    }
                  }}
                  disabled={!recommendedRoute || recommendedRoute.length === 0}
                >
                  이 경로대로 안내
                </button>
                <button
                  className="map-action-btn"
                  onClick={() => {
                    if (selectedDestinations.length > 0) {
                      setCongestionUpdate((prev) => prev + 1);
                      const newRecommendations = recommendRoute(
                        selectedDestinations,
                        userPosition,
                        attendingEvents,
                        forcedRecommendations
                      );
                      setRecommendedRoute(newRecommendations);
                    }
                  }}
                  disabled={selectedDestinations.length === 0}
                >
                  혼잡도 기반 재탐색
                </button>
              </div>
            </div>
          </>
        )}

      {showEventModal && (
        <div
          className="event-modal-overlay"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
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
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventAttendance(false);
                }}
              >
                참석하지 않기
              </button>
              <button
                className="btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventAttendance(true);
                }}
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
                    const validRoute = recommendedRoute.filter(
                      (dest) =>
                        dest.recommended !== false ||
                        forcedRecommendations.has(dest.id)
                    );
                    if (validRoute.length === 0) {
                      alert(
                        "추천 가능한 시설이 없습니다. 다른 시설을 선택해주세요."
                      );
                      setShowTravelConfirmModal(null);
                      return;
                    }
                    setIsNavigating(true);
                    setActiveRouteIndex(0);
                    setRecommendedRoute(validRoute);
                    const firstDest = validRoute[0];

                    const path = findOptimalPath(
                      "main-gate",
                      firstDest.id,
                      true
                    );

                    if (path) {
                      setCurrentPath(path);
                    } else {
                      const fallbackPath = {
                        areas: [
                          {
                            ...userPosition,
                            id: "current-position",
                            name: "현재 위치",
                            position: gpsToPosition(
                              userPosition.latitude,
                              userPosition.longitude
                            ),
                          },
                          firstDest,
                        ],
                        totalDistance: firstDest.distance || 0,
                        estimatedTime: Math.ceil(
                          (firstDest.distance || 0) / 67
                        ),
                      };
                      setCurrentPath(fallbackPath);
                    }
                    // navigation 페이지로 이동 전 원래 위치 저장
                    savedUserPositionRef.current = { ...userPosition };
                    // navigation 페이지로 이동 (userPosition은 변경하지 않음 - navigation 페이지 내부에서 정문 위치 사용)
                    setCurrentPage("navigation");
                    window.history.pushState(
                      { page: "navigation" },
                      "",
                      "/navigation"
                    );
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

      {showNextDestinationModal && recommendedRoute && (
        <div className="event-modal-overlay">
          <div className="event-modal">
            <h3>
              ✅ {recommendedRoute[activeRouteIndex]?.name}에 도착했습니다!
            </h3>
            <div className="event-info">
              {activeRouteIndex < recommendedRoute.length - 1 ? (
                <>
                  <p>다음 목적지로 안내를 시작할까요?</p>
                  <div className="next-destination-info">
                    <h4>
                      📍 다음: {recommendedRoute[activeRouteIndex + 1]?.emoji}{" "}
                      {recommendedRoute[activeRouteIndex + 1]?.name}
                    </h4>
                    <p>
                      거리: 약{" "}
                      {Math.round(
                        Math.sqrt(
                          Math.pow(
                            (userPosition.latitude -
                              recommendedRoute[activeRouteIndex + 1]
                                ?.latitude) *
                              111320,
                            2
                          ) +
                            Math.pow(
                              (userPosition.longitude -
                                recommendedRoute[activeRouteIndex + 1]
                                  ?.longitude) *
                                88740,
                              2
                            )
                        )
                      )}
                      m
                    </p>
                  </div>
                </>
              ) : (
                <p>🎉 모든 목적지를 방문하셨습니다!</p>
              )}
            </div>
            <div className="modal-buttons">
              <button
                className="btn-secondary"
                onClick={() => {
                  setIsNavigating(false);
                  setCurrentPath(null);
                  setShowNextDestinationModal(false);
                  setActiveRouteIndex(0);
                }}
              >
                안내 종료
              </button>
              {activeRouteIndex < recommendedRoute.length - 1 && (
                <>
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowNextDestinationModal(false);
                      const newRecommendations = recommendRoute(
                        selectedDestinations.filter(
                          (id) => id !== recommendedRoute[activeRouteIndex].id
                        ),
                        userPosition,
                        attendingEvents,
                        forcedRecommendations
                      );
                      setRecommendedRoute(newRecommendations);
                      setActiveRouteIndex(0);
                      if (newRecommendations && newRecommendations.length > 0) {
                        const firstDest = newRecommendations[0];
                        const path = {
                          areas: [
                            {
                              ...userPosition,
                              id: "current-position",
                              name: "현재 위치",
                              position: gpsToPosition(
                                userPosition.latitude,
                                userPosition.longitude
                              ),
                            },
                            firstDest,
                          ],
                          totalDistance: firstDest.distance || 0,
                          estimatedTime: Math.ceil(
                            (firstDest.distance || 0) / 67
                          ),
                        };
                        setCurrentPath(path);
                      }
                    }}
                  >
                    경로 재추천
                  </button>
                  <button
                    className="btn-primary"
                    onClick={() => {
                      setShowNextDestinationModal(false);
                      const nextIndex = activeRouteIndex + 1;
                      setActiveRouteIndex(nextIndex);
                      const nextDest = recommendedRoute[nextIndex];
                      const path = {
                        areas: [
                          {
                            ...userPosition,
                            id: "current-position",
                            name: "현재 위치",
                            position: gpsToPosition(
                              userPosition.latitude,
                              userPosition.longitude
                            ),
                          },
                          nextDest,
                        ],
                        totalDistance: nextDest.distance || 0,
                        estimatedTime: Math.ceil((nextDest.distance || 0) / 67),
                      };
                      setCurrentPath(path);
                    }}
                  >
                    다음 목적지로
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {showStopNavigationModal && (
        <div
          className="event-modal-overlay"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ 경로 안내를 종료하시겠습니까?</h3>
            <div className="event-info">
              <p>현재 진행 중인 경로 안내가 종료됩니다.</p>
              <p>추천 경로는 그대로 유지됩니다.</p>
            </div>
            <div className="modal-buttons">
              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowStopNavigationModal(false);
                }}
              >
                취소
              </button>
              <button
                className="btn-primary"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNavigating(false);
                  setCurrentPath(null);
                  setShowStopNavigationModal(false);
                  setActiveRouteIndex(0);
                }}
              >
                안내 종료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
