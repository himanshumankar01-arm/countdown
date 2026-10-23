import { useCallback } from "react";
import Countdown from "./components/Countdown";

export default function App() {
  const handleFinish = useCallback(() => {
    console.log("Countdown finished!");
  }, []);

  return <Countdown initialSeconds={300} onFinish={handleFinish} />;
}
