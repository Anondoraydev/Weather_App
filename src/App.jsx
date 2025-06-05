import React, { useEffect, useState } from "react";
import Lottie from "lottie-react";
import cloudAnim from "./cloud.json";

const weatherIconMap = {
  sunrise: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
  sunset: "https://cdn-icons-png.flaticon.com/512/869/869865.png",
  sun: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
  cloud: "https://cdn-icons-png.flaticon.com/512/414/414825.png",
  rain: "https://cdn-icons-png.flaticon.com/512/414/414974.png",
};

const API_KEY = "b166075e698538027f121388cfc59743";

const WeatherApp = () => {
  const [temp, setTemp] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [locationLabel, setLocationLabel] = useState("আপনার লোকেশন");
  const [error, setError] = useState("");
  const [forecastData, setForecastData] = useState(null);
  const [currentWeatherIcon, setCurrentWeatherIcon] = useState("sun");

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeather(latitude, longitude);
        fetchForecast(latitude, longitude);
      },
      () => {
        setError("লোকেশন পাওয়া যায়নি। শহরের নাম দিয়ে সার্চ করুন।");
      }
    );
  }, []);

  const fetchWeather = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const data = await res.json();

      if (data.cod !== 200) {
        setError("আবহাওয়ার তথ্য পাওয়া যায়নি।");
        return;
      }

      setTemp({
        current: data.main.temp,
        min: data.main.temp_min,
        max: data.main.temp_max,
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        wind: data.wind.speed,
        windDirection: data.wind.deg,
        rain: data.rain ? data.rain["1h"] || data.rain["3h"] : 0,
      });

      setLocationLabel(`${data.name}, ${data.sys.country}`);

      const main = data.weather[0].main.toLowerCase();
      if (main.includes("rain")) setCurrentWeatherIcon("rain");
      else if (main.includes("cloud")) setCurrentWeatherIcon("cloud");
      else setCurrentWeatherIcon("sun");
    } catch (e) {
      setError("আবহাওয়ার তথ্য লোড করতে সমস্যা হয়েছে।");
    }
  };

  const fetchForecast = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
      );
      const data = await res.json();

      if (data.cod !== "200") {
        setError("ফোরকাস্ট তথ্য পাওয়া যায়নি।");
        return;
      }

      setForecastData(data);

      const now = new Date();
      const rainForecast = data.list.find(
        (item) =>
          item.rain && item.rain["3h"] &&
          new Date(item.dt * 1000) > now
      );

      if (rainForecast) {
        const rainTime = new Date(rainForecast.dt * 1000);
        const alertTime = new Date(rainTime.getTime() - 2 * 60 * 60 * 1000);

        if (alertTime > now) {
          startCountdown(alertTime);
        } else {
          setCountdown("এখনই বৃষ্টি হতে পারে");
        }
      } else {
        setCountdown(null);
      }
    } catch (e) {
      setError("ফোরকাস্ট তথ্য লোড করতে সমস্যা হয়েছে।");
    }
  };

  const startCountdown = (targetTime) => {
    const interval = setInterval(() => {
      const now = new Date();
      const diff = targetTime - now;

      if (diff <= 0) {
        clearInterval(interval);
        setCountdown("এখনই বৃষ্টি হতে পারে");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${hours} ঘন্টা ${minutes} মিনিট ${seconds} সেকেন্ড`);
      }
    }, 1000);
  };

  const formatTime = (dt) => {
    const d = new Date(dt * 1000);
    return d.toLocaleTimeString("bn-BD", { hour: "2-digit", minute: "2-digit" });
  };

  const renderSunAndRainInfo = () => {
    if (!forecastData) return null;

    const cityInfo = forecastData.city;
    const sunrise = formatTime(cityInfo.sunrise);
    const sunset = formatTime(cityInfo.sunset);

    const todayWeatherMain = forecastData.list[0].weather[0].main.toLowerCase();
    const tomorrowData = forecastData.list.find((item) => {
      const date = new Date(item.dt * 1000);
      return date.getDate() === new Date().getDate() + 1;
    });

    const todayIcon = todayWeatherMain.includes("rain")
      ? "rain"
      : todayWeatherMain.includes("cloud")
        ? "cloud"
        : "sun";

    const tomorrowIcon = tomorrowData
      ? tomorrowData.weather[0].main.toLowerCase().includes("rain")
        ? "rain"
        : tomorrowData.weather[0].main.toLowerCase().includes("cloud")
          ? "cloud"
          : "sun"
      : null;

    return (
      <div className="bg-white bg-opacity-60 rounded-lg p-6 mt-8 max-w-md shadow-lg backdrop-blur-md text-gray-900 mx-auto">
        <h2 className="font-semibold text-xl mb-4 text-center">আজ ও আগামীকের তথ্য</h2>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <img src={weatherIconMap.sunrise} alt="Sunrise" className="w-10 h-10" />
            <p className="text-lg">সূর্যোদয়: <span className="font-medium">{sunrise}</span></p>
          </div>
          <div className="flex items-center gap-3">
            <img src={weatherIconMap.sunset} alt="Sunset" className="w-10 h-10" />
            <p className="text-lg">সূর্যাস্ত: <span className="font-medium">{sunset}</span></p>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={weatherIconMap[todayIcon]} alt="Today Weather" className="w-12 h-12" />
            <p className="text-lg font-semibold">আজকের আবহাওয়া</p>
          </div>
          {tomorrowIcon && (
            <div className="flex items-center gap-3">
              <img src={weatherIconMap[tomorrowIcon]} alt="Tomorrow Weather" className="w-12 h-12" />
              <p className="text-lg font-semibold">আগামীকের আবহাওয়া</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-tr from-sky-400 to-blue-700 text-gray-900 flex flex-col p-6 font-sans overflow-hidden">
      <div className="absolute inset-0 -z-10 opacity-30">
        <Lottie animationData={cloudAnim} loop={true} />
      </div>

      {temp && typeof temp === "object" && (
        <div className="text-7xl font-bold absolute left-6 top-6 flex items-center gap-4 text-white drop-shadow-lg">
          <span>{temp.current.toFixed(1)}°C</span>
          <img
            src={weatherIconMap[currentWeatherIcon]}
            alt="Weather Icon"
            className="w-20 h-20"
          />
        </div>
      )}

      <div className="mt-48 ml-6 text-3xl font-semibold text-white drop-shadow-md flex items-center gap-2">
        📍 {locationLabel}
      </div>

      {countdown && (
        <div className="ml-6 mt-6 bg-white bg-opacity-40 px-6 py-4 rounded-xl backdrop-blur-sm shadow-lg max-w-sm w-fit text-center text-red-700 font-semibold">
          {countdown === "এখনই বৃষ্টি হতে পারে" ? (
            <p className="animate-pulse text-2xl">☔️ এখনই বৃষ্টি হতে পারে!</p>
          ) : (
            <p>☁️ বৃষ্টি আসবে প্রায় {countdown} পর</p>
          )}
        </div>
      )}

      {error && (
        <p className="text-red-300 mt-4 ml-6 font-medium max-w-sm drop-shadow-md">{error}</p>
      )}

      {renderSunAndRainInfo()}

      {temp && typeof temp === "object" && (
        <div className="bg-white bg-opacity-40 backdrop-blur-md rounded-lg p-6 mt-10 max-w-md shadow-lg mx-auto text-gray-800">
          <h2 className="text-xl font-bold mb-4 text-center">বর্তমান আবহাওয়ার বিস্তারিত</h2>
          <ul className="grid grid-cols-2 gap-4 text-base font-medium">
            <li>🌡️ সর্বোচ্চ তাপমাত্রা: {temp.max}°C</li>
            <li>🌡️ সর্বনিম্ন তাপমাত্রা: {temp.min}°C</li>
            <li>💧 আর্দ্রতা: {temp.humidity}%</li>
            <li>🌬️ বাতাসের গতি: {temp.wind} m/s</li>
            <li>🎯 বাতাসের দিক: {temp.windDirection}°</li>
            <li>☁️ বৃষ্টিপাত: {temp.rain} mm</li>
            <li>⚖️ বাতাসের চাপ: {temp.pressure} hPa</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default WeatherApp;