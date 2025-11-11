import React, { useState, useEffect } from "react";
import "./SplashScreen.css";
import splashImage from "../image/splash.png";
import splashMobileImage from "../image/splash-mobile.png";

function SplashScreen() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="splash-screen">
      <img
        src={isMobile ? splashMobileImage : splashImage}
        alt="AR Zoo Lens"
        className="splash-image"
      />
    </div>
  );
}

export default SplashScreen;
