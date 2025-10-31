import { useState, useEffect } from "react";
import {
  zooAreas,
  getCongestionColor,
  getCongestionLabel,
  categoryColors,
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
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, congestion, distance
  const [showLegend, setShowLegend] = useState(false);
  const selectedCategory = externalSelectedCategory;
  const [localSelectedCategory, setLocalSelectedCategory] = useState(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);
  const [, forceUpdate] = useState(0);

  const handleCategoryClick = (category) => {
    if (onCategoryFilter) {
      const currentFilters = selectedCategory || [];
      const isSelected = currentFilters.includes(category);

      const newFilters = isSelected
        ? currentFilters.filter((c) => c !== category)
        : [...currentFilters, category];

      onCategoryFilter(newFilters);
    }
  };

  const clearAllFilters = () => {
    if (onCategoryFilter) {
      onCategoryFilter([]);
    }
  };

  // 모든 패널을 닫는 함수
  const closeAllPanels = () => {
    setIsMenuOpen(false);
    setIsDestinationOpen(false);
    setIsRecommendationOpen(false);
    setIsVideoOpen(false);
    setShowVideoModal(false);
    setShowLegend(false);
  };

  // 영상 재생 함수
  const playVideo = (videoId) => {
    setCurrentVideoId(videoId);
    setShowVideoModal(true);
  };

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

  // closePanels prop 변경 시 모든 패널 닫기
  useEffect(() => {
    if (closePanels !== undefined && !lockDestinationPanel) {
      closeAllPanels();
    }
  }, [closePanels]);

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
      if (localSelectedCategory && area.category !== localSelectedCategory) {
        return false;
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
      {/* 왼쪽 위 작은 메뉴 버튼 */}
      <button
        className="menu-toggle-btn"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        <span className="menu-icon">☰</span>
      </button>

      {/* 메뉴 패널 */}
      {isMenuOpen && (
        <div className="menu-panel">
          {/* 목적지 선택 버튼 */}
          <button
            className="menu-item-btn"
            onClick={() => setIsDestinationOpen(!isDestinationOpen)}
          >
            <span>
              {selectedDestinations.length > 0
                ? `🎯 ${selectedDestinations.length}개 선택됨`
                : "🗺️ 목적지 선택"}
            </span>
            <span className="toggle-icon">{isDestinationOpen ? "▼" : "▶"}</span>
          </button>

          {/* 추천 경로 버튼 */}
          {recommendedRoute && recommendedRoute.length > 0 && (
            <button
              className="menu-item-btn"
              onClick={() => setIsRecommendationOpen(!isRecommendationOpen)}
            >
              <span>⭐ 추천 경로</span>
              <span className="toggle-icon">
                {isRecommendationOpen ? "▼" : "▶"}
              </span>
            </button>
          )}

          {/* 추천 영상 버튼 */}
          <button
            className="menu-item-btn"
            onClick={() => setIsVideoOpen(!isVideoOpen)}
          >
            <span>🎬 추천 영상</span>
            <span className="toggle-icon">{isVideoOpen ? "▼" : "▶"}</span>
          </button>

          {/* 범례 토글 버튼 */}
          <button
            className="menu-item-btn"
            onClick={() => setShowLegend(!showLegend)}
          >
            <span>🎨 범례</span>
            <span className="toggle-icon">{showLegend ? "▼" : "▶"}</span>
          </button>
        </div>
      )}

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

            {/* 카테고리 필터 */}
            <div className="category-filters">
              <button
                className={`category-filter-btn ${
                  localSelectedCategory === null ? "active" : ""
                }`}
                onClick={() => setLocalSelectedCategory(null)}
              >
                전체
              </button>
              <button
                className={`category-filter-btn ${
                  localSelectedCategory === "ANIMAL" ? "active" : ""
                }`}
                onClick={() => setLocalSelectedCategory("ANIMAL")}
              >
                🐾 동물
              </button>
              <button
                className={`category-filter-btn ${
                  localSelectedCategory === "FUN" ? "active" : ""
                }`}
                onClick={() => setLocalSelectedCategory("FUN")}
              >
                🎪 재미나라
              </button>
              <button
                className={`category-filter-btn ${
                  localSelectedCategory === "FACILITY" ? "active" : ""
                }`}
                onClick={() => setLocalSelectedCategory("FACILITY")}
              >
                🏪 편의시설
              </button>
              <button
                className={`category-filter-btn ${
                  localSelectedCategory === "NATURE" ? "active" : ""
                }`}
                onClick={() => setLocalSelectedCategory("NATURE")}
              >
                🌿 자연나라
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

                {/* 추천 경로 보기 버튼 (2개 이상 선택 시) */}
                {selectedDestinations.length >= 2 && (
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
                      이벤트 시간과 혼잡도를 고려한 최적 경로를 추천합니다
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
            {selectedDestinations.length >= 2 && (
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
                  선택하신 {selectedDestinations.length}개 장소를 최적 순서로
                  안내합니다
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* 추천 영상 패널 */}
      {isVideoOpen && (
        <>
          {/* 배경 오버레이 */}
          <div className="panel-overlay" onClick={closeAllPanels} />

          <div className="video-panel">
            {/* 헤더와 닫기 버튼 */}
            <div className="panel-header">
              <h3>🎬 추천 영상</h3>
              <button className="close-btn" onClick={closeAllPanels}>
                ✕
              </button>
            </div>

            {/* 영상 목록 */}
            <div className="video-list">
              <div className="video-item">
                <div
                  className="video-thumbnail"
                  onClick={() => playVideo("e3lNmhZaBmA")}
                >
                  <div className="video-play-button">▶</div>
                  <img
                    src="https://img.youtube.com/vi/e3lNmhZaBmA/maxresdefault.jpg"
                    alt="추천 영상 썸네일"
                    className="thumbnail-image"
                  />
                </div>
                <div className="video-info">
                  <h4 className="video-title">동물원 체험 가이드</h4>
                  <p className="video-description">
                    동물원에서 즐기는 특별한 체험과 팁을 소개합니다
                  </p>
                  <div className="video-meta">
                    <span className="video-duration">0:45</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 추가 영상들 */}
            <div className="additional-videos">
              <h4>관련 영상</h4>
              <div className="video-grid">
                <div
                  className="mini-video-item"
                  onClick={() => playVideo("e3lNmhZaBmA")}
                >
                  <div className="mini-thumbnail">
                    <img
                      src="https://img.youtube.com/vi/e3lNmhZaBmA/mqdefault.jpg"
                      alt="관련 영상 1"
                    />
                    <div className="mini-play-button">▶</div>
                  </div>
                  <div className="mini-video-info">
                    <span className="mini-title">동물원 투어 팁</span>
                    <span className="mini-duration">3:45</span>
                  </div>
                </div>
                <div
                  className="mini-video-item"
                  onClick={() => playVideo("e3lNmhZaBmA")}
                >
                  <div className="mini-thumbnail">
                    <img
                      src="https://img.youtube.com/vi/e3lNmhZaBmA/mqdefault.jpg"
                      alt="관련 영상 2"
                    />
                    <div className="mini-play-button">▶</div>
                  </div>
                  <div className="mini-video-info">
                    <span className="mini-title">가족 동물원 여행</span>
                    <span className="mini-duration">7:20</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 범례 */}
      {showLegend && (
        <div
          className="video-modal-overlay"
          onClick={() => setShowLegend(false)}
        >
          <div
            className="video-modal legend-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="video-modal-header">
              <h3>🎨 범례</h3>
              <button
                className="video-close-btn"
                onClick={() => setShowLegend(false)}
              >
                ✕
              </button>
            </div>
            <div className="legend-modal-content">
              <h4>
                카테고리
                {selectedCategory && selectedCategory.length > 0 && (
                  <>
                    <span className="filter-count">
                      {selectedCategory.length}개 선택
                    </span>
                    <button
                      className="clear-filter-btn"
                      onClick={clearAllFilters}
                    >
                      전체 보기
                    </button>
                  </>
                )}
              </h4>
              {selectedCategory && selectedCategory.length > 0 && (
                <p className="filter-hint">
                  💡 여러 카테고리를 선택할 수 있어요
                </p>
              )}
              <div className="legend-items">
                <div
                  className={`legend-item legend-item-clickable ${
                    selectedCategory && selectedCategory.includes("GATE")
                      ? "legend-item-selected"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick("GATE");
                  }}
                >
                  <div
                    className="legend-color"
                    style={{ backgroundColor: categoryColors.GATE }}
                  />
                  <span>문</span>
                  {selectedCategory && selectedCategory.includes("GATE") && (
                    <span className="selected-check">✓</span>
                  )}
                </div>
                <div
                  className={`legend-item legend-item-clickable ${
                    selectedCategory && selectedCategory.includes("ANIMAL")
                      ? "legend-item-selected"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick("ANIMAL");
                  }}
                >
                  <div
                    className="legend-color"
                    style={{ backgroundColor: categoryColors.ANIMAL }}
                  />
                  <span>동물</span>
                  {selectedCategory && selectedCategory.includes("ANIMAL") && (
                    <span className="selected-check">✓</span>
                  )}
                </div>
                <div
                  className={`legend-item legend-item-clickable ${
                    selectedCategory && selectedCategory.includes("FUN")
                      ? "legend-item-selected"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick("FUN");
                  }}
                >
                  <div
                    className="legend-color"
                    style={{ backgroundColor: categoryColors.FUN }}
                  />
                  <span>재미나라</span>
                  {selectedCategory && selectedCategory.includes("FUN") && (
                    <span className="selected-check">✓</span>
                  )}
                </div>
                <div
                  className={`legend-item legend-item-clickable ${
                    selectedCategory && selectedCategory.includes("FACILITY")
                      ? "legend-item-selected"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick("FACILITY");
                  }}
                >
                  <div
                    className="legend-color"
                    style={{ backgroundColor: categoryColors.FACILITY }}
                  />
                  <span>편의시설</span>
                  {selectedCategory &&
                    selectedCategory.includes("FACILITY") && (
                      <span className="selected-check">✓</span>
                    )}
                </div>
                <div
                  className={`legend-item legend-item-clickable ${
                    selectedCategory && selectedCategory.includes("NATURE")
                      ? "legend-item-selected"
                      : ""
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCategoryClick("NATURE");
                  }}
                >
                  <div
                    className="legend-color"
                    style={{ backgroundColor: categoryColors.NATURE }}
                  />
                  <span>자연나라</span>
                  {selectedCategory && selectedCategory.includes("NATURE") && (
                    <span className="selected-check">✓</span>
                  )}
                </div>
              </div>

              <h4 style={{ marginTop: "12px" }}>혼잡도</h4>
              <div className="legend-items">
                <div className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: "#4CAF50" }}
                  />
                  <span>여유</span>
                </div>
                <div className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: "#FFC107" }}
                  />
                  <span>보통</span>
                </div>
                <div className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: "#FF9800" }}
                  />
                  <span>혼잡</span>
                </div>
                <div className="legend-item">
                  <div
                    className="legend-color"
                    style={{ backgroundColor: "#F44336" }}
                  />
                  <span>매우 혼잡</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 영상 재생 모달 */}
      {showVideoModal && (
        <div
          className="video-modal-overlay"
          onClick={() => setShowVideoModal(false)}
        >
          <div className="video-modal" onClick={(e) => e.stopPropagation()}>
            <div className="video-modal-header">
              <h3>🎬 영상 재생</h3>
              <button
                className="video-close-btn"
                onClick={() => setShowVideoModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="video-player-container">
              <iframe
                width="100%"
                height="315"
                src={`https://www.youtube.com/embed/${currentVideoId}?autoplay=1&rel=0`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
            <div className="video-modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowVideoModal(false)}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
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
