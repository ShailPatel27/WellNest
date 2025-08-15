import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Chart({ dataPoints, label }) {
  const labels = dataPoints.map(d => new Date(d.date).toLocaleDateString());
  const scores = dataPoints.map(d => d.score);

  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label,
            data: scores,
            fill: false,
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1
          }
        ]
      }}
    />
  );
}
