import "./glowing.css";

export default function Glowing({ glowColor }) {
  return (
    <div
      style={{
        "--glow-color": glowColor,
      }}
      className="glow-container"
    >
      <span className="glow"></span>
      <span className="glow"></span>
      <span className="glow"></span>
      <span className="glow"></span>
    </div>
  );
}
