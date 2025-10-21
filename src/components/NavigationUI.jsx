import { useState, useEffect } from "react";
import {
  zooAreas,
  getCongestionColor,
  getCongestionLabel,
  categoryColors,
} from "../data/mockData";
import "./NavigationUI.css";

function NavigationUI({
  selectedDestination,
  onDestinationChange,
  currentPath,
  firstPersonMode,
  onModeChange,
  congestionUpdate,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name"); // name, congestion, category
  const [showLegend, setShowLegend] = useState(false);
  const [, forceUpdate] = useState(0);

  // 혼잡도 업데이트 시 강제 리렌더링
  useEffect(() => {
    if (congestionUpdate !== undefined) {
      forceUpdate((prev) => prev + 1);
    }
  }, [congestionUpdate]);

  // 정렬된 구역 목록
  const sortedAreas = [...zooAreas]
    .filter((area) => area.id !== "main-gate")
    .sort((a, b) => {
      if (sortBy === "congestion") {
        return a.congestionLevel - b.congestionLevel;
      } else if (sortBy === "category") {
        return (a.category || "").localeCompare(b.category || "");
      }
      return a.name.localeCompare(b.name);
    });

  // 카메라 모드일 때는 아무것도 렌더링하지 않음
  if (firstPersonMode) {
    return null;
  }

  return (
    <div className="navigation-ui">
      {/* 뷰 모드 전환 버튼 */}
      <button
        className="mode-toggle"
        onClick={() => onModeChange(!firstPersonMode)}
      >
        📷 카메라 모드
      </button>

      {/* 목적지 선택과 범례 버튼을 한 줄로 */}
      <div className="toggle-buttons-row">
        {/* 목적지 선택 버튼 */}
        <button
          className="destination-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>
            {selectedDestination
              ? `🎯 ${
                  zooAreas.find((a) => a.id === selectedDestination)?.name ||
                  "목적지"
                }`
              : "🗺️ 목적지 선택"}
          </span>
          <span className="toggle-icon">{isOpen ? "▼" : "▶"}</span>
        </button>

        {/* 범례 토글 버튼 */}
        <button
          className="legend-toggle"
          onClick={() => setShowLegend(!showLegend)}
        >
          <span>🎨 범례</span>
          <span className="toggle-icon">{showLegend ? "▼" : "▶"}</span>
        </button>
      </div>

      {/* 목적지 선택 패널 */}
      {isOpen && (
        <div className="destination-panel">
          {/* 정렬 옵션 */}
          <div className="sort-options">
            <button
              className={sortBy === "name" ? "active" : ""}
              onClick={() => setSortBy("name")}
            >
              이름순
            </button>
            <button
              className={sortBy === "category" ? "active" : ""}
              onClick={() => setSortBy("category")}
            >
              카테고리순
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
                    setIsOpen(false);
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
      )}

      {/* 범례 */}
      {showLegend && (
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
      )}
    </div>
  );
}

export default NavigationUI;
