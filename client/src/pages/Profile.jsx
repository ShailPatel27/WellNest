import { useEffect, useState } from "react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Chart from "../components/Chart";
import React from "react";

export default function Profile() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const { data } = await API.get("/results/history");
        setHistory(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchHistory();
  }, []);

  return (
    <div>
      <h2 className="text-2xl mb-4">{user?.name}'s Profile</h2>
      <h3 className="text-xl mb-2">Test History</h3>
      {history.length > 0 ? (
        <Chart dataPoints={history} label="Overall Health" />
      ) : (
        <p>No history yet. Take a test to get started!</p>
      )}
    </div>
  );
}
