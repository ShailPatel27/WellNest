// components/Chart.jsx
import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

export default function Chart({ dataPoints, dataKey, label }) {
  return (
    <div className="bg-base-200 p-4 rounded-xl shadow mb-6">
      <h2 className="text-lg font-semibold mb-2">{label}</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={dataPoints}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(str) => new Date(str).toLocaleDateString()}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(label) =>
              new Date(label).toLocaleDateString()
            }
          />
          <Legend />
          <Line type="monotone" dataKey={dataKey} stroke="#8884d8" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
