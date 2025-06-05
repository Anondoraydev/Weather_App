import React from "react";
import Lottie from "lottie-react";
import cloudAnimation from "./cloud.json"; // Ensure this path is correct

const CloudAnimation = () => {
  return (
    <div className="absolute inset-11 flex justify-center z-10 opacity-3 pointer-events-none">
      <Lottie animationData={cloudAnimation} loop={true} />
    </div>
  );
};

export default CloudAnimation;
