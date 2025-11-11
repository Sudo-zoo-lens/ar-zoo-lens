import React, { useState } from "react";
import "./IntroScreen.css";
import rinniImage from "../image/rinni.png";
import homeImage from "../image/home.png";

function IntroScreen({ onStart }) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div
      className="intro-screen"
      style={{ backgroundImage: `url(${homeImage})` }}
    >
      <div className="intro-content">
        <div className="intro-header">
          <div className="location-badge">📍 어린이대공원</div>
        </div>

        <div className="intro-buttons">
          {showOptions && (
            <>
              <button className="intro-btn" onClick={() => onStart("map")}>
                지도보기
              </button>
              <button className="intro-btn" onClick={() => onStart("list")}>
                목록보기
              </button>
            </>
          )}
          <button
            className="intro-btn main-btn"
            onClick={() => setShowOptions(!showOptions)}
          >
            목적지 선택
          </button>
        </div>
        <div className="intro-character">
          <img src={rinniImage} alt="Rinni" className="character-image" />
        </div>
      </div>
    </div>
  );
}

export default IntroScreen;
