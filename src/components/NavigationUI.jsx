import { useState, useEffect } from "react";
import {
  zooAreas,
  getCongestionColor,
  getCongestionLabel,
  categoryColors,
  currentLocation,
} from "../data/mockData";
import "./NavigationUI.css";

function NavigationUI({
  selectedDestination,
  onDestinationChange,
  currentPath,
  firstPersonMode,
  onModeChange,
  congestionUpdate,
  closePanels,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDestinationOpen, setIsDestinationOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name"); // name, congestion, distance
  const [showLegend, setShowLegend] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null); // 카테고리 필터
  const [, forceUpdate] = useState(0);

  // 모든 패널을 닫는 함수
  const closeAllPanels = () => {
    setIsMenuOpen(false);
    setIsDestinationOpen(false);
    setShowLegend(false);
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
  }, []);

  // closePanels prop 변경 시 모든 패널 닫기
  useEffect(() => {
    if (closePanels !== undefined) {
      closeAllPanels();
    }
  }, [closePanels]);

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
              {selectedDestination
                ? `🎯 ${
                    zooAreas.find((a) => a.id === selectedDestination)?.name ||
                    "목적지"
                  }`
                : "🗺️ 목적지 선택"}
            </span>
            <span className="toggle-icon">{isDestinationOpen ? "▼" : "▶"}</span>
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
          <div className="panel-overlay" onClick={closeAllPanels} />

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

            {/* 구역 리스트 */}
            <div className="area-list">
              {sortedAreas.map((area) => {
                const color = getCongestionColor(area.congestionLevel);
                const label = getCongestionLabel(area.congestionLevel);

                return (
                  <div
                    key={area.id}
                    className={`area-item ${
                      selectedDestination === area.id ? "selected" : ""
                    }`}
                    onClick={() => {
                      onDestinationChange(area.id);
                      setIsDestinationOpen(false);
                    }}
                  >
                    <div className="area-header">
                      <span className="area-emoji">{area.emoji}</span>
                      <span className="area-name">{area.name}</span>
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
                  </div>
                );
              })}
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
    </div>
  );
}

export default NavigationUI;
