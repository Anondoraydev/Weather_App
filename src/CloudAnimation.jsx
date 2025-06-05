import React from "react";
import Lottie from "lottie-react";
import cloudAnimation from "./cloud.json"; // Ensure this path is correct

const CloudAnimation = () => {
  return (
    <div className="absolute w-7xl left-84 z-10 opacity-3 pointer-events-none">
      <Lottie animationData={cloudAnimation} loop={true} />
    </div>
  );
};

export default CloudAnimation;
