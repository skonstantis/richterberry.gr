import { useWebSocket } from "./WebSocketProvider";

function Health() {
  const { connected } = useWebSocket();
  return (
    <div>
      <p>Pipeline Health Status:</p>
      <p>Client connection: {connected ? "good" : "disconnected"}</p>
      <p>Station connection: good</p>
      <p>Station last online: 16m ago</p>
      <p>GPS synced timestamps: yes</p>
    </div>
  );
}

export default Health;