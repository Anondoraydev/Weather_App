
import CloudAnimation from "./CloudAnimation";
import WeatherApp from "./WeatherApp";

function App() {
  return (
    <div className="relative min-h-screen bg-blue-500 overflow-hidden">
      <CloudAnimation/>
      <WeatherApp />
    </div>
  );
}
export default App;
