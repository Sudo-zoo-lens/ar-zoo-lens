import React, { useState, useEffect } from "react";
import "./SplashScreen.css";

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
        src={isMobile ? "/image/splash-mobile.png" : "/image/splash.png"}
        alt="AR Zoo Lens"
        className="splash-image"
      />
    </div>
  );
}

export default SplashScreen;
