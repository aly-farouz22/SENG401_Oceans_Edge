import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div style={{ width: "300px", padding: "10px", background: "#eef" }}>
      <h2>Ocean Dashboard</h2>
      <p>Money: $0</p>
      <p>Fish Population: 100%</p>
      <p>Coral Health: 100%</p>
    </div>
  );
};

export default Dashboard;