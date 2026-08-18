import React from "react";
import "./DroneLoader.css";

const DroneLoader = () => {
  return (
    <div className="drone-loader">
      <div className="drone-scene">

        {/* Scanning beam */}
        <div className="scan-beam"></div>

        {/* Drone */}
        <div className="drone">
          {/* Left propeller */}
          <div className="propeller left-propeller">
            <span></span>
            <span></span>
          </div>

          {/* Right propeller */}
          <div className="propeller right-propeller">
            <span></span>
            <span></span>
          </div>

          {/* Drone arms */}
          <div className="drone-arm left-arm"></div>
          <div className="drone-arm right-arm"></div>

          {/* Drone body */}
          <div className="drone-body">
            <div className="drone-camera"></div>
            <div className="drone-light"></div>
          </div>
        </div>

        {/* Ground shadow */}
        <div className="drone-shadow"></div>
      </div>

      <div className="loader-text">
        <span>Preparing Flight To Nepal's Drone Store</span>
        <div className="loading-dots">
          <span>.</span>
          <span>.</span>
          <span>.</span>
        </div>
      </div>
    </div>
  );
};

export default DroneLoader;
