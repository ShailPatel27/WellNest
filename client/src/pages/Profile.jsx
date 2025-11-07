// src/pages/Profile.jsx
import { useEffect, useState } from "react";
import API from "../utils/api";
import { useAuth } from "../context/AuthContext";
import Chart from "../components/Chart";
import React from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Profile() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("month");
  const [error, setError] = useState(null);

  const resolveUserId = () => {
    if (user) return user._id || user.id || user.userId || null;
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const p = JSON.parse(stored);
        return p._id || p.id || p.userId || null;
      }
    } catch {}
    return null;
  };

  useEffect(() => {
    async function fetchHistory() {
      setLoading(true);
      setError(null);
      const userId = resolveUserId();
      if (!userId) {
        setError("No user ID available. Please log in.");
        setLoading(false);
        return;
      }
      try {
        const { data } = await API.get(`/results/history/${userId}`);
        const normalized = (data || []).map((r) => ({
          _id: r._id,
          category: r.category,
          score: typeof r.scoreOutOf10 === "number" ? r.scoreOutOf10 : r.score ?? 0,
          createdAt: r.createdAt || r.created_at,
        }));
        setHistory(normalized);
      } catch (err) {
        console.error(err);
        setError("Could not load history.");
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

  const filterData = (items = []) => {
    const now = new Date();
    if (range === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return items.filter((d) => new Date(d.createdAt) >= weekAgo);
    }
    if (range === "month") {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      return items.filter((d) => new Date(d.createdAt) >= monthAgo);
    }
    return items;
  };

  const getChartData = (category) => {
    const items = filterData(history).filter(
      (h) => (h.category || "").toLowerCase() === category.toLowerCase()
    );
    return items
      .map((d) => ({ date: new Date(d.createdAt).toISOString(), score: d.score ?? 0 }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const exportPDF = async () => {
    const element = document.getElementById("graphs");
    if (!element) return;

    // Force safe colors to avoid html2canvas parsing errors
    const forceSafeColors = (el) => {
      el.querySelectorAll("*").forEach((child) => {
        const cs = getComputedStyle(child);
        const safeColor = (val, fallback) =>
          val && /oklch|lab|lch|color/i.test(val) ? fallback : val;
        child.style.backgroundColor = safeColor(cs.backgroundColor, "#fff");
        child.style.color = safeColor(cs.color, "#111");
        child.style.borderColor = safeColor(cs.borderColor, "#000");
        if (cs.boxShadow && /oklch|lab|lch|color/i.test(cs.boxShadow)) child.style.boxShadow = "none";
      });
    };

    forceSafeColors(element);

    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#fff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 10;

      pdf.setFontSize(18);
      pdf.text(`${user?.name || "User"}'s Progress Report`, pageWidth / 2, 15, { align: "center" });

      const imgWidth = pageWidth - margin * 2;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", margin, 25, imgWidth, imgHeight);

      const today = new Date().toISOString().slice(0, 10);
      pdf.save(`${user?.name || "user"}-progress-${today}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      setError("PDF export failed. See console.");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">{user?.name ? `${user.name}'s Profile` : "Profile"}</h2>

      <div className="mb-4 flex gap-2">
        <button onClick={() => setRange("week")} className={`btn btn-sm ${range === "week" ? "btn-primary" : ""}`}>
          1 Week
        </button>
        <button onClick={() => setRange("month")} className={`btn btn-sm ${range === "month" ? "btn-primary" : ""}`}>
          1 Month
        </button>
        <button onClick={() => setRange("lifetime")} className={`btn btn-sm ${range === "lifetime" ? "btn-primary" : ""}`}>
          Lifetime
        </button>
      </div>

      {loading ? (
        <p>Loading history...</p>
      ) : error ? (
        <p className="text-red-600">{error}</p>
      ) : history.length === 0 ? (
        <p>No history yet. Take a test to get started!</p>
      ) : (
        <>
          <div id="graphs" className="space-y-4" style={{padding: 16, borderRadius: 8}}>
            <Chart dataPoints={getChartData("mental")} dataKey="score" label="Mental Health" />
            <Chart dataPoints={getChartData("physical")} dataKey="score" label="Physical Health" />
            <Chart dataPoints={getChartData("general")} dataKey="score" label="General Test" />
            <Chart dataPoints={getChartData("wellness")} dataKey="score" label="Wellness" />
          </div>

          <div className="mt-6">
            <button onClick={exportPDF} className="btn btn-primary">
              Export to PDF
            </button>
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
