import { useState, useEffect } from "react";
import {
  zooAreas,
  getCongestionColor,
  getCongestionLabel,
} from "../data/mockData";
import "./NavigationUI.css";

function NavigationUI({
  selectedDestination,
  onDestinationChange,
  currentPath,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [sortBy, setSortBy] = useState("name"); // name, congestion

  // 정렬된 구역 목록
  const sortedAreas = [...zooAreas]
    .filter((area) => area.id !== "entrance")
    .sort((a, b) => {
      if (sortBy === "congestion") {
        return a.congestionLevel - b.congestionLevel;
      }
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="navigation-ui">
      {/* 상단 정보 바 */}
      <div className="info-bar">
        <div className="info-item">
          <span className="info-label">현재 위치</span>
          <span className="info-value">📍 입구</span>
        </div>
        {currentPath && (
          <>
            <div className="info-item">
              <span className="info-label">예상 시간</span>
              <span className="info-value">
                ⏱️ {currentPath.estimatedTime}분
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">거리</span>
              <span className="info-value">
                📏 {currentPath.totalDistance.toFixed(1)}m
              </span>
            </div>
          </>
        )}
      </div>

      {/* 목적지 선택 버튼 */}
      <button className="destination-toggle" onClick={() => setIsOpen(!isOpen)}>
        {selectedDestination
          ? `🎯 ${
              zooAreas.find((a) => a.id === selectedDestination)?.name ||
              "목적지"
            }`
          : "🗺️ 목적지 선택"}
        <span className="toggle-icon">{isOpen ? "▼" : "▶"}</span>
      </button>

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

      {/* 경로 정보 */}
      {currentPath && (
        <div className="path-info">
          <h3>📍 경로 안내</h3>
          <div className="path-steps">
            {currentPath.areas.map((area, index) => (
              <div key={area.id} className="path-step">
                <div className="step-number">{index + 1}</div>
                <div className="step-content">
                  <span className="step-emoji">{area.emoji}</span>
                  <span className="step-name">{area.name}</span>
                  <span
                    className="step-congestion"
                    style={{
                      color: getCongestionColor(area.congestionLevel),
                    }}
                  >
                    {getCongestionLabel(area.congestionLevel)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button
            className="clear-path-btn"
            onClick={() => onDestinationChange(null)}
          >
            경로 지우기
          </button>
        </div>
      )}

      {/* 범례 */}
      <div className="legend">
        <h4>혼잡도 범례</h4>
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
  );
}

export default NavigationUI;
