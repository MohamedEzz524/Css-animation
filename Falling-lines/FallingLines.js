import "./fallingLines.css";

export default function FallingLines() {
  const delays = [1.2, 0.5, 1.5, 2, 0, 2.5, 2.2, 2.2, 0.8];

  return (
    <div className="lines">
      {delays.map((delay, i) => (
        <div key={i} className="line" style={{ "--delay": `${delay}s` }} />
      ))}
    </div>
  );
}
