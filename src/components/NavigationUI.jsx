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
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, congestion, distance
  const [showLegend, setShowLegend] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // 카테고리 필터
  const [, forceUpdate] = useState(0);

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
    if (closePanels !== undefined) {
      if (lockDestinationPanel) return;
      closeAllPanels();
    }
  }, [closePanels, lockDestinationPanel]);

  // 거리 계산 함수 (간단한 유클리드 거리)
  const calculateDistance = (area) => {
    const dx = area.latitude - currentLocation.latitude;
    const dy = area.longitude - currentLocation.longitude;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // 정렬된 구역 목록 (카테고리 필터링 포함)
  const sortedAreas = [...zooAreas]
    .filter((area) => area.id !== "main-gate")
    .filter((area) => {
      if (selectedCategory === null) return true;
      return area.category === selectedCategory;
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
                  selectedCategory === null ? "active" : ""
                }`}
                onClick={() => setSelectedCategory(null)}
              >
                전체
              </button>
              <button
                className={`category-filter-btn ${
                  selectedCategory === "ANIMAL" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("ANIMAL")}
              >
                🐾 동물
              </button>
              <button
                className={`category-filter-btn ${
                  selectedCategory === "FUN" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("FUN")}
              >
                🎪 재미나라
              </button>
              <button
                className={`category-filter-btn ${
                  selectedCategory === "FACILITY" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("FACILITY")}
              >
                🏪 편의시설
              </button>
              <button
                className={`category-filter-btn ${
                  selectedCategory === "NATURE" ? "active" : ""
                }`}
                onClick={() => setSelectedCategory("NATURE")}
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
              <button className="close-btn" onClick={closeAllPanels}>
                ✕
              </button>
            </div>

            {/* 추천 순서 표시 */}
            <div className="recommendation-list">
              {recommendedRoute.map((dest, index) => {
                const event = dest.event;
                const isAttending = dest.isAttending;
                const distance = Math.round(
                  Math.sqrt(
                    Math.pow(dest.latitude - currentLocation.latitude, 2) +
                      Math.pow(dest.longitude - currentLocation.longitude, 2)
                  ) * 111320 // 대략적인 미터 변환
                );

                return (
                  <div
                    key={dest.id}
                    className={`recommendation-item ${
                      isAttending ? "attending-event" : ""
                    }`}
                  >
                    <div
                      className={`recommendation-rank ${
                        isAttending ? "attending-rank" : ""
                      }`}
                    >
                      <span className="rank-number">{index + 1}</span>
                    </div>
                    <div className="recommendation-content">
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
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 우선순위 설명 */}
            <div className="priority-explanation">
              <h4>🎯 우선순위 기준</h4>
              <ul>
                <li>1. 참석하는 이벤트 (최우선)</li>
                <li>2. 이벤트 시간 (30분 이내 최우선)</li>
                <li>3. 이벤트 시설은 1000m까지 고려</li>
                <li>4. 임박한 이벤트는 혼잡도 조건 완화</li>
                <li>5. 혼잡도가 낮은 경로 우선</li>
                <li>6. 거리가 가까운 순서로 정렬</li>
              </ul>
              <div className="algorithm-info">
                <p className="algorithm-note">
                  💡 참석하는 이벤트가 있으면 해당 시설을 가장 먼저 방문하도록
                  경로를 추천합니다.
                </p>
              </div>
            </div>

            {/* 경로 안내 시작 버튼 */}
            {selectedDestinations.length >= 2 && (
              <div style={{ padding: "20px", borderTop: "1px solid #ddd" }}>
                <button
                  className="start-navigation-btn"
                  onClick={() =>
                    onTravelConfirm && onTravelConfirm(recommendedRoute)
                  }
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
                    <span className="video-duration">5:30</span>
                    <span className="video-views">조회수 1.2만</span>
                  </div>
                </div>
                <button
                  className="play-btn"
                  onClick={() => playVideo("e3lNmhZaBmA")}
                >
                  재생
                </button>
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
        <>
          {/* 배경 오버레이 */}
          <div className="panel-overlay" onClick={closeAllPanels} />

          <div className="legend">
            <h4>카테고리</h4>
            <div className="legend-items">
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: categoryColors.GATE }}
                />
                <span>문</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: categoryColors.ANIMAL }}
                />
                <span>동물</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: categoryColors.FUN }}
                />
                <span>재미나라</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: categoryColors.FACILITY }}
                />
                <span>편의시설</span>
              </div>
              <div className="legend-item">
                <div
                  className="legend-color"
                  style={{ backgroundColor: categoryColors.NATURE }}
                />
                <span>자연나라</span>
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
        </>
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
    </div>
  );
}

export default NavigationUI;
