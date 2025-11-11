import { useState, useEffect } from "react";
import {
  zooAreas,
  getCongestionColor,
  getCongestionLabel,
  currentLocation,
  events,
} from "../data/mockData";
import "./NavigationUI.css";

function NavigationUI({
  selectedDestinations,
  onDestinationToggle,
  currentPath,
  recommendedRoute,
  firstPersonMode,
  onModeChange,
  congestionUpdate,
  closePanels,
  onTravelConfirm,
  attendingEvents = new Set(),
  lockDestinationPanel = false,
  onCategoryFilter,
  selectedCategory: externalSelectedCategory,
  forcedRecommendations = new Set(),
  onForceRecommend,
  initialPanelOpen = false,
  onPanelClose,
}) {
  const [isDestinationOpen, setIsDestinationOpen] = useState(initialPanelOpen);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name"); // name, congestion, distance
  const selectedCategory = externalSelectedCategory;
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [, forceUpdate] = useState(0);

  // 모든 패널을 닫는 함수
  const closeAllPanels = () => {
    setIsDestinationOpen(false);
    setIsRecommendationOpen(false);
    if (onPanelClose) {
      onPanelClose();
    }
  };

  // initialPanelOpen이 변경되면 패널 상태 업데이트
  useEffect(() => {
    if (initialPanelOpen) {
      setIsDestinationOpen(true);
    }
  }, [initialPanelOpen]);

  // 혼잡도 업데이트 시 강제 리렌더링
  useEffect(() => {
    if (congestionUpdate !== undefined) {
      forceUpdate((prev) => prev + 1);
    }
  }, [congestionUpdate]);

  // 화면 회전 시 모든 패널 닫기
  useEffect(() => {
    const handleOrientationChange = () => {
      if (lockDestinationPanel) return;
      closeAllPanels();
    };

    // orientationchange 이벤트 리스너 추가
    window.addEventListener("orientationchange", handleOrientationChange);

    // resize 이벤트도 추가 (일부 브라우저에서 orientationchange가 제대로 작동하지 않을 수 있음)
    window.addEventListener("resize", handleOrientationChange);

    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, [lockDestinationPanel]);

  // closePanels prop 변경 시 모든 패널 닫기 (단, initialPanelOpen이 true면 닫지 않음)
  useEffect(() => {
    if (
      closePanels !== undefined &&
      !lockDestinationPanel &&
      !initialPanelOpen
    ) {
      closeAllPanels();
    }
  }, [closePanels, lockDestinationPanel, initialPanelOpen]);

  // 거리 계산 함수 (간단한 유클리드 거리)
  const calculateDistance = (area) => {
    const dx = area.latitude - currentLocation.latitude;
    const dy = area.longitude - currentLocation.longitude;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 정렬된 구역 목록 (카테고리 필터링 - 필터링된 항목 숨김)
  const sortedAreas = [...zooAreas]
    .filter((area) => area.id !== "main-gate")
    .filter((area) => {
      if (selectedCategory && selectedCategory.length > 0) {
        return selectedCategory.includes(area.category);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "congestion") {
        return a.congestionLevel - b.congestionLevel;
      } else if (sortBy === "distance") {
        return calculateDistance(a) - calculateDistance(b);
      }
      return a.name.localeCompare(b.name);
    });

  // 카메라 모드일 때는 아무것도 렌더링하지 않음
  if (firstPersonMode) {
    return null;
  }

  return (
    <div className="navigation-ui">
      {/* 목적지 선택 패널 */}
      {isDestinationOpen && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="panel-overlay"
            onClick={() => {
              if (lockDestinationPanel) return;
              closeAllPanels();
            }}
          />

          <div className="destination-panel">
            {/* 헤더와 닫기 버튼 */}
            <div className="panel-header">
              <h3>목적지 선택</h3>
              <button className="close-btn" onClick={closeAllPanels}>
                ✕
              </button>
            </div>

            {/* 정렬 옵션 */}
            <div className="sort-options">
              <button
                className={sortBy === "name" ? "active" : ""}
                onClick={() => setSortBy("name")}
              >
                이름순
              </button>
              <button
                className={sortBy === "distance" ? "active" : ""}
                onClick={() => setSortBy("distance")}
              >
                거리순
              </button>
              <button
                className={sortBy === "congestion" ? "active" : ""}
                onClick={() => setSortBy("congestion")}
              >
                혼잡도순
              </button>
            </div>

            {/* 선택된 목적지 표시 */}
            {selectedDestinations.length > 0 && (
              <div className="selected-destinations">
                <h4>선택된 목적지 ({selectedDestinations.length}/5)</h4>
                <div className="selected-list">
                  {selectedDestinations.map((destId) => {
                    const area = zooAreas.find((a) => a.id === destId);
                    const event = events.find((e) => e.areaId === destId);
                    const isAttending = attendingEvents.has(destId);
                    return (
                      <div
                        key={destId}
                        className={`selected-item ${
                          isAttending ? "attending-event" : ""
                        }`}
                      >
                        <span className="selected-emoji">{area?.emoji}</span>
                        <span className="selected-name">{area?.name}</span>
                        {event && (
                          <span
                            className={`event-indicator ${
                              isAttending ? "attending" : ""
                            }`}
                          >
                            {isAttending ? "✅" : "🎉"}
                          </span>
                        )}
                        <button
                          className="remove-btn"
                          onClick={() => onDestinationToggle(destId)}
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* 추천 경로 보기 버튼 (1개 이상 선택 시) */}
                {selectedDestinations.length >= 1 && (
                  <div className="route-recommendation-section">
                    <button
                      className="route-recommendation-btn"
                      onClick={() => setIsRecommendationOpen(true)}
                    >
                      <span className="btn-icon">⭐</span>
                      <span className="btn-text">추천 경로 보기</span>
                      <span className="btn-arrow">→</span>
                    </button>
                    <p className="route-description">
                      {selectedDestinations.length === 1
                        ? "정문에서 선택한 목적지까지 경로를 안내합니다"
                        : "이벤트 시간과 혼잡도를 고려한 최적 경로를 추천합니다"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 구역 리스트 */}
            <div className="area-list">
              {sortedAreas.map((area) => {
                const color = getCongestionColor(area.congestionLevel);
                const label = getCongestionLabel(area.congestionLevel);
                const isSelected = selectedDestinations.includes(area.id);
                const event = events.find((e) => e.areaId === area.id);
                const isMaxSelected = selectedDestinations.length >= 5;

                return (
                  <div
                    key={area.id}
                    className={`area-item ${isSelected ? "selected" : ""} ${
                      isMaxSelected && !isSelected ? "disabled" : ""
                    }`}
                    onClick={() => {
                      if (!isMaxSelected || isSelected) {
                        onDestinationToggle(area.id);
                      }
                    }}
                  >
                    <div className="area-header">
                      <span className="area-emoji">{area.emoji}</span>
                      <span className="area-name">{area.name}</span>
                      {event && <span className="event-badge">🎉</span>}
                      {area.color && (
                        <div
                          className="category-indicator"
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: area.color,
                            marginLeft: "8px",
                          }}
                        />
                      )}
                      {isSelected && <span className="checkmark">✓</span>}
                    </div>
                    <div className="area-info">
                      <div
                        className="congestion-badge"
                        style={{ backgroundColor: color }}
                      >
                        {label}
                      </div>
                      <span className="area-visitors">
                        {area.visitors}/{area.capacity}명
                      </span>
                    </div>
                    <div className="area-description">{area.description}</div>
                    {event && (
                      <div className="event-info">
                        <span className="event-time">⏰ {event.startTime}</span>
                        <span className="event-name">{event.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* 추천 경로 패널 */}
      {isRecommendationOpen && recommendedRoute && (
        <>
          {/* 배경 오버레이 */}
          <div className="panel-overlay" onClick={closeAllPanels} />

          <div className="recommendation-panel">
            {/* 헤더와 닫기 버튼 */}
            <div className="panel-header">
              <h3>⭐ 추천 경로</h3>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  className="reset-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowResetConfirmModal(true);
                  }}
                  style={{
                    padding: "8px 12px",
                    fontSize: "14px",
                    background: "#ff5252",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                  }}
                >
                  🗑️ 초기화
                </button>
                <button className="close-btn" onClick={closeAllPanels}>
                  ✕
                </button>
              </div>
            </div>

            {/* 추천 순서 표시 */}
            <div className="recommendation-list">
              {recommendedRoute.map((dest, index) => {
                const event = dest.event;
                const isAttending = dest.isAttending;
                const isRecommended = dest.recommended !== false;
                const distance = Math.round(
                  Math.sqrt(
                    Math.pow(dest.latitude - currentLocation.latitude, 2) +
                      Math.pow(dest.longitude - currentLocation.longitude, 2)
                  ) * 111320
                );

                return (
                  <div
                    key={dest.id}
                    className={`recommendation-item ${
                      isAttending ? "attending-event" : ""
                    } ${!isRecommended ? "not-recommended" : ""}`}
                  >
                    <div
                      className={`recommendation-rank ${
                        isAttending ? "attending-rank" : ""
                      } ${!isRecommended ? "not-recommended-rank" : ""}`}
                    >
                      <span className="rank-number">
                        {isRecommended ? index + 1 : "⚠️"}
                      </span>
                    </div>
                    <div className="recommendation-content">
                      {!isRecommended && (
                        <div className="not-recommended-badge">
                          🚫 방문 비추천
                        </div>
                      )}
                      <div className="recommendation-header">
                        <span className="recommendation-emoji">
                          {dest.emoji}
                        </span>
                        <span className="recommendation-name">{dest.name}</span>
                        {event && (
                          <span
                            className={`event-badge ${
                              isAttending ? "attending" : ""
                            }`}
                          >
                            {isAttending ? "✅ 참석" : "🎉 이벤트"}
                          </span>
                        )}
                      </div>
                      <div className="recommendation-info">
                        <span className="distance">📍 {distance}m</span>
                        <span className="congestion">
                          혼잡도: {getCongestionLabel(dest.congestionLevel)}
                        </span>
                      </div>
                      {!isRecommended && dest.notRecommendedReason && (
                        <div className="not-recommended-reason">
                          💡 {dest.notRecommendedReason}
                        </div>
                      )}
                      {event && (
                        <div className="event-details">
                          <div className="event-schedule">
                            <span className="event-time">
                              ⏰ {event.startTime} - {event.endTime}
                            </span>
                            <span className="event-participants">
                              참가자: {event.currentParticipants}/
                              {event.maxParticipants}명
                            </span>
                          </div>
                          <div className="event-description">
                            {event.description}
                          </div>
                        </div>
                      )}
                      {!isRecommended && (
                        <button
                          className="force-add-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onForceRecommend) {
                              onForceRecommend(dest.id);
                            }
                          }}
                        >
                          💪 그래도 추가하기
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 우선순위 설명 */}
            <div className="priority-explanation">
              <h4>🎯 추천 기준</h4>
              <ul>
                <li>✅ 1. 이벤트 시간 (참석 중 최우선)</li>
                <li>✅ 2. 혼잡도순 경로 ≤ 거리순 경로×2 체크</li>
                <li>✅ 3. 혼잡도 낮은 순 정렬</li>
                <li>✅ 4. 거리 가까운 순 정렬</li>
              </ul>
              <div className="algorithm-info">
                <p className="algorithm-note">
                  ⚠️ 600m 이상 떨어진 시설이나 매우 혼잡한 시설, 또는 혼잡도
                  우선 경로가 거리 우선 경로보다 2배 이상 먼 경우는 "방문
                  비추천"으로 표시됩니다. 선택된 모든 시설은 경로에 포함되며,
                  추천 시설이 우선 순위를 갖습니다.
                </p>
              </div>
            </div>

            {/* 경로 안내 시작 버튼 */}
            {selectedDestinations.length >= 1 && (
              <div style={{ padding: "20px", borderTop: "1px solid #ddd" }}>
                <button
                  className="start-navigation-btn"
                  onClick={() => {
                    if (onTravelConfirm) {
                      onTravelConfirm(recommendedRoute);
                      closeAllPanels();
                    }
                  }}
                >
                  🚶 이 경로로 이동하시겠습니까?
                </button>
                <p className="navigation-description">
                  {selectedDestinations.length === 1
                    ? "정문에서 선택하신 장소로 안내합니다"
                    : `선택하신 ${selectedDestinations.length}개 장소를 최적 순서로 안내합니다`}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* 초기화 확인 모달 */}
      {showResetConfirmModal && (
        <div
          className="event-modal-overlay"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🗑️ 경로 초기화</h3>
            <div className="event-info">
              <p>추천 경로를 초기화하시겠습니까?</p>
              <p style={{ color: "#ff5252", fontWeight: "500" }}>
                선택한 모든 목적지가 제거됩니다.
              </p>
            </div>
            <div className="modal-buttons">
              <button
                className="btn-secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowResetConfirmModal(false);
                }}
              >
                취소
              </button>
              <button
                className="btn-primary"
                style={{ background: "#ff5252" }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectedDestinations.forEach((id) => onDestinationToggle(id));
                  setShowResetConfirmModal(false);
                  closeAllPanels();
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NavigationUI;
