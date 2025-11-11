import React, { useState } from "react";
import "./IntroScreen.css";
import rinniImage from "../image/rinni.png";

function IntroScreen({ onStart }) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="intro-screen">
      <div className="intro-content">
        <div className="intro-header">
          <div className="location-badge">
            🗺️ 어린이대공원 정문 사진을 이 레이어에 넣으세요
          </div>
        </div>

        {!showOptions ? (
          <div className="intro-buttons">
            <button
              className="intro-btn main-btn"
              onClick={() => setShowOptions(true)}
            >
              목적지 선택
            </button>
          </div>
        ) : (
          <div className="intro-buttons">
            <button
              className="intro-btn map-btn"
              onClick={() => onStart("map")}
            >
              지도보기
            </button>
            <button
              className="intro-btn list-btn"
              onClick={() => onStart("list")}
            >
              목록보기
            </button>
          </div>
        )}

        <div className="intro-character">
          <img src={rinniImage} alt="Rinni" className="character-image" />
        </div>
      </div>
    </div>
  );
}

export default IntroScreen;
