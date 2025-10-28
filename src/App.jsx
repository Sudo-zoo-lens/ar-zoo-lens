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
  const [selectedDestinations, setSelectedDestinations] = useState([]); // 다중 목적지
  const [currentPath, setCurrentPath] = useState(null);
  const [firstPersonMode, setFirstPersonMode] = useState(false);
  const [userPosition, setUserPosition] = useState(currentLocation);
  const [congestionUpdate, setCongestionUpdate] = useState(0); // 혼잡도 업데이트 트리거
  const [closePanels, setClosePanels] = useState(false); // 패널 닫기 트리거
  const [recommendedRoute, setRecommendedRoute] = useState(null); // 추천 경로
  const [showEventModal, setShowEventModal] = useState(null); // 이벤트 참석 확인 모달
  const [showTravelConfirmModal, setShowTravelConfirmModal] = useState(null); // 경로 확인 모달
  const [attendingEvents, setAttendingEvents] = useState(new Set()); // 참석할 이벤트들

  // Ref를 사용해서 최신 상태 추적
  const firstPersonModeRef = useRef(firstPersonMode);
  const userPositionRef = useRef(userPosition);
  const lastMoveTime = useRef(0);

  // 혼잡도 실시간 업데이트 (2초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      updateCongestionLevels();
      setCongestionUpdate((prev) => prev + 1); // 강제 리렌더링
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    firstPersonModeRef.current = firstPersonMode;
  }, [firstPersonMode]);

  useEffect(() => {
    userPositionRef.current = userPosition;
  }, [userPosition]);

  // 다중 목적지 선택 핸들러
  const handleDestinationToggle = useCallback(
    (areaId) => {
      setSelectedDestinations((prev) => {
        const isSelected = prev.includes(areaId);
        let newDestinations;

        if (isSelected) {
          // 이미 선택된 경우 제거
          newDestinations = prev.filter((id) => id !== areaId);
          // 참석 이벤트 목록에서도 제거
          setAttendingEvents((prevEvents) => {
            const newSet = new Set(prevEvents);
            newSet.delete(areaId);
            return newSet;
          });
        } else {
          // 최대 5개까지만 선택 가능
          if (prev.length >= 5) {
            return prev;
          }
          newDestinations = [...prev, areaId];
        }

        // 이벤트가 있는 시설인 경우 참석 여부 확인
        const eventCheck = checkEventAttendance(areaId, userPosition);
        if (eventCheck && !isSelected) {
          setShowEventModal({ areaId, eventCheck });
          return prev; // 모달에서 확인 후 처리
        }

        return newDestinations;
      });
    },
    [userPosition]
  );

  // 이벤트 참석 확인 처리
  const handleEventAttendance = useCallback(
    (willAttend) => {
      if (showEventModal) {
        if (willAttend) {
          // 목적지에 추가하고 참석 이벤트 목록에도 추가
          setSelectedDestinations((prev) => [...prev, showEventModal.areaId]);
          setAttendingEvents(
            (prev) => new Set([...prev, showEventModal.areaId])
          );
        } else {
          // 참석하지 않는 경우 참석 이벤트 목록에서 제거 (혹시 있다면)
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

  // 경로 추천 업데이트
  useEffect(() => {
    if (selectedDestinations.length > 0) {
      const recommendations = recommendRoute(
        selectedDestinations,
        userPosition,
        attendingEvents
      );
      setRecommendedRoute(recommendations);

      // 자동으로 경로를 설정하지 않음 - 사용자가 "추천 경로 보기" 및 "이 경로로 이동하시겠습니까?"를 눌러야만 경로 설정
    } else {
      setRecommendedRoute(null);
      setCurrentPath(null);
    }
  }, [selectedDestinations, userPosition, attendingEvents]);

  // 구역 선택 핸들러 (3D 씬에서)
  const handleAreaSelect = useCallback(
    (area) => {
      if (area.id === "main-gate") return;
      handleDestinationToggle(area.id);
    },
    [handleDestinationToggle]
  );

  // 키보드로 위치 이동 (throttle 적용)
  useEffect(() => {
    const handleKeyDown = (event) => {
      // input, textarea 등에서는 동작하지 않도록
      if (
        event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA"
      ) {
        return;
      }

      // NavigationUI 내부에서 발생한 키 입력은 무시 (패널 닫지 않음)
      const navEl = document.querySelector(".navigation-ui");
      if (navEl && navEl.contains(event.target)) {
        return;
      }

      const key = event.key.toLowerCase();

      // 영어 + 한글 키 매핑 (한글: ㅈ=w, ㄴ=s, ㅁ=a, ㄷ=d)
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
        // 키보드 이동 상호작용 시 패널 닫기
        setClosePanels((prev) => !prev);

        event.preventDefault();
        event.stopPropagation();

        // Throttle: 50ms에 한 번만 업데이트
        const now = Date.now();
        if (now - lastMoveTime.current < 50) {
          return;
        }
        lastMoveTime.current = now;

        const moveDistance = 0.00001; // 약 1미터

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

  // 모바일 컨트롤 핸들러
  const handleMove = useCallback((direction) => {
    const moveDistance = 0.00001; // 약 1미터

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

  // 터치/마우스 이벤트 시 패널 닫기 (NavigationUI 외부에서만)
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
      if (isInsideNavigationUI(event.target)) return; // UI 내부 클릭/터치는 무시
      setClosePanels((prev) => !prev);
    };

    // 터치 이벤트 리스너 추가
    window.addEventListener("touchstart", handlePointerStart, {
      passive: true,
    });

    // 마우스 클릭 이벤트도 추가 (데스크톱용)
    window.addEventListener("mousedown", handlePointerStart);

    return () => {
      window.removeEventListener("touchstart", handlePointerStart);
      window.removeEventListener("mousedown", handlePointerStart);
    };
  }, []);

  return (
    <div className="app">
      {/* 카메라 뷰 (네비게이션 모드일 때) */}
      {firstPersonMode && (
        <>
          <CameraView
            isActive={firstPersonMode}
            showAR={!currentPath}
            userPosition={userPosition}
            onAreaSelect={handleAreaSelect}
            congestionUpdate={congestionUpdate}
          >
            {/* 카메라 위에 표시될 컴팩트 방향 안내 (경로가 있을 때) */}
            {currentPath && (
              <CompactDirectionOverlay
                currentPath={currentPath}
                userPosition={[0, 0, 0]}
                onClose={() => {
                  console.log("경로 닫기 함수 호출됨");
                  setCurrentPath(null);
                }}
              />
            )}
          </CameraView>

          {/* 카메라 HUD - 포켓몬고 같은 구성 */}
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

          {/* 중앙 조준선 */}
          <div className="reticle" />

          {/* 하단 캡처 버튼 (연출용) */}
          <button className="camera-capture-btn" onClick={() => {}}></button>
        </>
      )}

      {/* 네비게이션 UI (카메라 모드가 아닐 때만) */}
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
        />
      )}

      {/* 지도 뷰 (카메라 모드가 아닐 때만 보임) */}
      {!firstPersonMode && (
        <MapView
          selectedDestinations={selectedDestinations}
          onAreaSelect={handleAreaSelect}
          currentPath={currentPath}
          userPosition={userPosition}
          onDestinationToggle={handleDestinationToggle}
          congestionUpdate={congestionUpdate}
        />
      )}

      {/* 지도 모드 하단 중앙 카메라 진입 버튼 */}
      {!firstPersonMode && (
        <button
          className="enter-camera-btn"
          onClick={() => setFirstPersonMode(true)}
        >
          📷 카메라
        </button>
      )}

      {/* 이벤트 참석 확인 모달 */}
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

      {/* 경로 확인 모달 */}
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
                  // 경로 안내 시작
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
