import styles from "./panel.module.css";
import { useWebSocket } from "./WebSocketProvider";

export function Panel() {
  const { stations, stationsMax } = useWebSocket();
  console.log(stations, stationsMax);
  return (<></>
  );
}

export default Panel;