import React, { useEffect, useState, useRef } from "react";
import Lottie from "lottie-react";
import cloudAnim from "./cloud.json"; // মেঘলা বা সূর্যের অ্যানিমেশন (আপনি প্রয়োজনমতো পরিবর্তন করবেন)
import sunAnim from "./sun.json";     // সূর্য ওঠার অ্যানিমেশন
import rainAnim from "./rain.json";   // বৃষ্টির অ্যানিমেশন
import { FiSearch } from "react-icons/fi";

const weatherIconMap = {
  sunrise: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
  sunset: "https://cdn-icons-png.flaticon.com/512/869/869865.png",
  sun: "https://cdn-icons-png.flaticon.com/512/869/869869.png",
  cloud: "https://cdn-icons-png.flaticon.com/512/414/414825.png",
  rain: "https://cdn-icons-png.flaticon.com/512/414/414974.png",
  fog: "https://cdn-icons-png.flaticon.com/512/1197/1197102.png",
  wind: "https://cdn-icons-png.flaticon.com/512/3050/3050480.png",
  humidity: "https://cdn-icons-png.flaticon.com/512/728/728093.png",
  pressure: "https://cdn-icons-png.flaticon.com/512/2930/2930031.png",
  tempHigh: "https://cdn-icons-png.flaticon.com/512/1146/1146869.png",
  tempLow: "https://cdn-icons-png.flaticon.com/512/3094/3094151.png",
  airQuality: "https://cdn-icons-png.flaticon.com/512/3039/3039434.png",
  rainForecast: "https://cdn-icons-png.flaticon.com/512/1163/1163624.png",
};

const API_KEY = "b166075e698538027f121388cfc59743";
const AIR_QUALITY_API = "https://api.openaq.org/v2/latest";

const WeatherApp = () => {
  const [temp, setTemp] = useState(null);
  const [windSpeed, setWindSpeed] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [rainfall, setRainfall] = useState(null);
  const [pressure, setPressure] = useState(null);
  const [windDir, setWindDir] = useState(null);
  const [tempHigh, setTempHigh] = useState(null);
  const [tempLow, setTempLow] = useState(null);

  const [locationLabel, setLocationLabel] = useState("আপনার লোকেশন");
  const [error, setError] = useState("");
  const [forecastData, setForecastData] = useState(null);
  const [dailyForecast, setDailyForecast] = useState([]);
  const [airQuality, setAirQuality] = useState(null);
  const [currentWeatherMain, setCurrentWeatherMain] = useState("sun");
  const [searchText, setSearchText] = useState("");
  const [countdown, setCountdown] = useState(null);

  const countdownInterval = useRef(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        fetchWeather({ lat: latitude, lon: longitude });
        fetchForecast({ lat: latitude, lon: longitude });
        fetchAirQuality(latitude, longitude);
      },
      () => {
        setError("লোকেশন পাওয়া যায়নি। শহরের নাম দিয়ে সার্চ করুন।");
      }
    );

    return () => {
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  const fetchWeather = async ({ city, lat, lon }) => {
    try {
      let url = city
        ? `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`
        : `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.cod !== 200) {
        setError("শহর খুঁজে পাওয়া যায়নি।");
        return;
      }
      setError("");
      setTemp(data.main.temp);
      setTempHigh(data.main.temp_max);
      setTempLow(data.main.temp_min);
      setWindSpeed(data.wind.speed);
      setHumidity(data.main.humidity);
      setPressure(data.main.pressure);
      setLocationLabel(`${data.name}, ${data.sys.country}`);

      const deg = data.wind.deg;
      setWindDir(getWindDirection(deg));

      const rainAmount = data.rain ? data.rain["1h"] || data.rain["3h"] || 0 : 0;
      setRainfall(rainAmount);

      const main = data.weather[0].main.toLowerCase();
      if (main.includes("rain")) setCurrentWeatherMain("rain");
      else if (main.includes("cloud")) setCurrentWeatherMain("cloud");
      else if (main.includes("fog") || main.includes("mist")) setCurrentWeatherMain("fog");
      else setCurrentWeatherMain("sun");
    } catch {
      setError("আবহাওয়ার তথ্য লোড করতে সমস্যা হয়েছে।");
    }
  };

  const fetchForecast = async ({ city, lat, lon }) => {
    try {
      let url = city
        ? `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`
        : `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;

      const res = await fetch(url);
      const data = await res.json();

      if (data.cod !== "200") {
        setError("ফোরকাস্ট তথ্য পাওয়া যায়নি।");
        return;
      }
      setError("");
      setForecastData(data);

      const daily = groupByDate(data.list);
      setDailyForecast(daily);

      setRainCountdown(data.list);
    } catch {
      setError("ফোরকাস্ট তথ্য লোড করতে সমস্যা হয়েছে।");
    }
  };

  const fetchAirQuality = async (lat, lon) => {
    try {
      const res = await fetch(
        `${AIR_QUALITY_API}?coordinates=${lat},${lon}&radius=10000&limit=1&order_by=datetime&sort=desc`
      );
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const measurements = data.results[0].measurements;
        setAirQuality(measurements[0]?.value || null);
      }
    } catch {
      // silent fail
    }
  };

  const setRainCountdown = (list) => {
    if (countdownInterval.current) clearInterval(countdownInterval.current);

    const now = new Date();

    const rainForecast = list.find(
      (item) =>
        item.rain && item.rain["3h"] && new Date(item.dt * 1000) > now
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
  };

  const startCountdown = (targetTime) => {
    countdownInterval.current = setInterval(() => {
      const now = new Date();
      const diff = targetTime - now;
      if (diff <= 0) {
        clearInterval(countdownInterval.current);
        setCountdown("এখনই বৃষ্টি হতে পারে");
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${hours} ঘন্টা ${minutes} মিনিট ${seconds} সেকেন্ড`);
      }
    }, 1000);
  };

  const groupByDate = (list) => {
    const daysMap = {};
    list.forEach((item) => {
      const date = new Date(item.dt * 1000);
      const dateStr = date.toISOString().split("T")[0];
      if (!daysMap[dateStr]) daysMap[dateStr] = [];
      daysMap[dateStr].push(item);
    });
    const dailyData = Object.entries(daysMap)
      .slice(0, 7)
      .map(([date, entries]) => {
        const temps = entries.map((e) => e.main.temp);
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        const main = entries[0].weather[0].main.toLowerCase();
        return { date, maxTemp, minTemp, main };
      });
    return dailyData;
  };

  const getWindDirection = (degree) => {
    const directions = [
      "উত্তর",
      "উত্তর-পূর্ব",
      "পূর্ব",
      "দক্ষিণ-পূর্ব",
      "দক্ষিণ",
      "দক্ষিণ-পশ্চিম",
      "পশ্চিম",
      "উত্তর-পশ্চিম",
    ];
    const index = Math.round(degree / 45) % 8;
    return directions[index];
  };

  const handleSearch = () => {
    if (searchText.trim() === "") return;
    fetchWeather({ city: searchText.trim() });
    fetchForecast({ city: searchText.trim() });
    setSearchText("");
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-blue-300 to-blue-800 p-6 flex flex-col items-center justify-start text-white"
      style={{ fontFamily: "Kalimati, sans-serif" }}
    >
      <h1 className="text-4xl font-extrabold mb-4">আবহাওয়া অ্যাপ</h1>

      {/* সার্চ বক্স */}
      <div className="mb-6 w-full max-w-md flex">
        <input
          type="text"
          className="flex-grow rounded-l-md p-2 text-black focus:outline-none"
          placeholder="শহর নাম লিখুন..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSearch();
          }}
        />
        <button
          onClick={handleSearch}
          className="bg-yellow-400 text-black px-4 rounded-r-md hover:bg-yellow-500 flex items-center justify-center"
          aria-label="Search"
        >
          <FiSearch size={20} />
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {temp !== null && (
        <>
          {/* প্রধান তথ্য */}
          <div className="bg-white/30 rounded-xl p-6 w-full max-w-3xl backdrop-blur-md shadow-lg mb-6 text-black">
            <h2 className="text-3xl font-bold mb-1">{locationLabel}</h2>
            <p className="text-xl mb-4">
              বর্তমান তাপমাত্রা:{" "}
              <span className="text-red-600 font-bold">{temp.toFixed(1)}°C</span>
            </p>

            {/* অ্যানিমেশন */}
            <div className="w-40 h-40 mx-auto mb-4">
              {currentWeatherMain === "rain" && <Lottie animationData={rainAnim} loop />}
              {currentWeatherMain === "cloud" && <Lottie animationData={cloudAnim} loop />}
              {(currentWeatherMain === "sun" || currentWeatherMain === "fog") && (
                <Lottie animationData={sunAnim} loop />
              )}
            </div>

            {/* অন্যান্য তথ্য */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm md:text-base">
              <div>
                <img
                  src={weatherIconMap.wind}
                  alt="বাতাস"
                  className="w-8 h-8 mx-auto mb-1"
                />
                <p>বাতাস: {windSpeed} m/s</p>
                <p>দিক: {windDir}</p>
              </div>
              <div>
                <img
                  src={weatherIconMap.humidity}
                  alt="আর্দ্রতা"
                  className="w-8 h-8 mx-auto mb-1"
                />
                <p>আর্দ্রতা: {humidity}%</p>
              </div>
              <div>
                <img
                  src={weatherIconMap.pressure}
                  alt="বায়ু চাপ"
                  className="w-8 h-8 mx-auto mb-1"
                />
                <p>বায়ু চাপ: {pressure} hPa</p>
              </div>
              <div>
                <img
                  src={weatherIconMap.rainForecast}
                  alt="বৃষ্টি"
                  className="w-8 h-8 mx-auto mb-1"
                />
                <p>বৃষ্টি: {rainfall || 0} mm</p>
              </div>
            </div>

            {/* তাপমাত্রার উচ্চ-নিম্ন */}
            <div className="mt-4 flex justify-center gap-8 text-lg font-semibold">
              <div className="flex items-center gap-2 text-red-700">
                <img src={weatherIconMap.tempHigh} alt="সর্বোচ্চ তাপ" className="w-6 h-6" />
                <span>সর্বোচ্চ: {tempHigh?.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center gap-2 text-blue-700">
                <img src={weatherIconMap.tempLow} alt="সর্বনিম্ন তাপ" className="w-6 h-6" />
                <span>সর্বনিম্ন: {tempLow?.toFixed(1)}°C</span>
              </div>
            </div>
          </div>

          {/* বৃষ্টি কন্টাউন্টডাউন */}
          {countdown && (
            <div className="bg-yellow-200 text-black rounded-lg p-3 mb-6 max-w-md text-center font-semibold shadow-md">
              বৃষ্টি শুরু হতে আর: {countdown}
            </div>
          )}

          {/* এয়ার কোয়ালিটি */}
          {airQuality !== null && (
            <div className="bg-green-200 text-black rounded-lg p-3 mb-6 max-w-md text-center font-semibold shadow-md flex items-center justify-center gap-2">
              <img
                src={weatherIconMap.airQuality}
                alt="বায়ুর মান"
                className="w-6 h-6"
              />
              বায়ুর মান (PM2.5): {airQuality} µg/m³
            </div>
          )}

          {/* ৭ দিনের ফোরকাস্ট */}
          {dailyForecast.length > 0 && (
            <div className="max-w-6xl mx-auto mt-6 p-4 bg-white/20 rounded-xl backdrop-blur-md text-black text-center text-sm md:text-base">
              <h2 className="text-white font-bold text-2xl mb-4">৭ দিনের পূর্বাভাস</h2>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                {dailyForecast.map(({ date, maxTemp, minTemp, main }) => (
                  <div
                    key={date}
                    className="bg-white/30 rounded-lg p-2 flex flex-col items-center justify-center shadow-md"
                  >
                    <p className="font-semibold">
                      {new Date(date).toLocaleDateString("bn-BD", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <img
                      src={weatherIconMap[main] || weatherIconMap.sun}
                      alt={main}
                      className="w-10 h-10 my-2"
                    />
                    <p>
                      <span className="text-red-600 font-bold">{maxTemp.toFixed(1)}°C</span> /{" "}
                      <span className="text-blue-600 font-bold">{minTemp.toFixed(1)}°C</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WeatherApp;
