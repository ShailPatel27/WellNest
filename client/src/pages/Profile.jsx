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
  const [exporting, setExporting] = useState(false);

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
          score:
            typeof r.scoreOutOf10 === "number"
              ? r.scoreOutOf10
              : r.score ?? 0,
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
      .map((d) => ({
        date: new Date(d.createdAt).toISOString(),
        score: d.score ?? 0,
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const exportPDF = async () => {
    const element = document.getElementById("graphs");
    if (!element) return;

    setExporting(true);
    setError(null);

    // ✅ STEP 1: temporarily switch to light theme (non-destructive)
    const htmlEl = document.documentElement;
    const originalTheme = htmlEl.getAttribute("data-theme");
    const themeWasDark = originalTheme && /dark/i.test(originalTheme);
    if (themeWasDark) {
      htmlEl.setAttribute("data-theme", "light");
    }

    // STEP 2: disable DaisyUI oklch() colors (still needed for safety)
    const originalVars = {};
    const computedStyles = getComputedStyle(htmlEl);
    for (let i = 0; i < computedStyles.length; i++) {
      const prop = computedStyles[i];
      const val = computedStyles.getPropertyValue(prop);
      if (/oklch|lab|lch|color/i.test(val)) {
        originalVars[prop] = val;
        htmlEl.style.setProperty(prop, "#ffffff");
      }
    }

    // STEP 3: create static export container
    const clone = document.createElement("div");
    clone.id = "export-container";
    clone.style.backgroundColor = "#ffffff";
    clone.style.color = "#111111";
    clone.style.padding = "32px";
    clone.style.width = "1000px";
    clone.style.borderRadius = "8px";
    clone.style.position = "absolute";
    clone.style.top = "-9999px";
    clone.style.fontFamily = "sans-serif";
    document.body.appendChild(clone);

    // Add header
    const title = document.createElement("h1");
    title.textContent = `${user?.name || "User"}'s Progress Report`;
    title.style.textAlign = "center";
    title.style.fontSize = "24px";
    title.style.fontWeight = "bold";
    title.style.marginBottom = "30px";
    clone.appendChild(title);

    // STEP 4: render charts in export mode
    const chartContainer = document.createElement("div");
    chartContainer.style.display = "flex";
    chartContainer.style.flexDirection = "column";
    chartContainer.style.gap = "20px";
    chartContainer.style.alignItems = "center";
    chartContainer.style.backgroundColor = "#fff";
    chartContainer.style.padding = "10px";
    chartContainer.style.borderRadius = "8px";
    clone.appendChild(chartContainer);

    const categories = [
      { key: "mental", label: "Mental Health" },
      { key: "physical", label: "Physical Health" },
      { key: "general", label: "General Test" },
      { key: "wellness", label: "Wellness" },
    ];

    for (const cat of categories) {
      const wrapper = document.createElement("div");
      wrapper.style.width = "850px";
      wrapper.style.height = "350px";
      wrapper.style.border = "1px solid #ccc";
      wrapper.style.borderRadius = "10px";
      wrapper.style.padding = "10px";
      wrapper.style.background = "#fff";
      wrapper.style.display = "flex";
      wrapper.style.alignItems = "center";
      wrapper.style.justifyContent = "center";

      const chartDiv = document.createElement("div");
      chartDiv.style.width = "100%";
      chartDiv.style.height = "100%";
      wrapper.appendChild(chartDiv);
      chartContainer.appendChild(wrapper);

      const ReactDOM = await import("react-dom");
      const root = ReactDOM.createRoot(chartDiv);
      root.render(
        <Chart
          dataPoints={getChartData(cat.key)}
          dataKey="score"
          label={cat.label}
          exportMode={true}
        />
      );
    }

    await new Promise((r) => setTimeout(r, 1000));

    try {
      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: 1000,
        windowWidth: 1000,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 10;
      let remainingHeight = imgHeight;
      let sourceY = 0;

      const pageCanvas = document.createElement("canvas");
      const ctx = pageCanvas.getContext("2d");
      pageCanvas.width = canvas.width;
      pageCanvas.height = (canvas.width * pageHeight) / imgWidth;

      while (remainingHeight > 0) {
        ctx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          pageCanvas.height,
          0,
          0,
          canvas.width,
          pageCanvas.height
        );

        const pageData = pageCanvas.toDataURL("image/png");
        pdf.addImage(pageData, "PNG", 10, position, imgWidth, pageHeight - 20);

        remainingHeight -= pageCanvas.height;
        sourceY += pageCanvas.height;

        if (remainingHeight > 0) pdf.addPage();
      }

      const today = new Date().toISOString().slice(0, 10);
      pdf.save(`${user?.name || "user"}-progress-${today}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      setError("PDF export failed. (Formatting issue)");
    } finally {
      // ✅ STEP 5: restore theme safely
      if (themeWasDark && originalTheme) {
        htmlEl.setAttribute("data-theme", originalTheme);
      }

      Object.entries(originalVars).forEach(([key, value]) =>
        htmlEl.style.setProperty(key, value)
      );
      document.body.removeChild(clone);
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">
        {user?.name ? `${user.name}'s Profile` : "Profile"}
      </h2>

      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setRange("week")}
          className={`btn btn-sm ${range === "week" ? "btn-primary" : ""}`}
        >
          1 Week
        </button>
        <button
          onClick={() => setRange("month")}
          className={`btn btn-sm ${range === "month" ? "btn-primary" : ""}`}
        >
          1 Month
        </button>
        <button
          onClick={() => setRange("lifetime")}
          className={`btn btn-sm ${
            range === "lifetime" ? "btn-primary" : ""
          }`}
        >
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
          <div
            id="graphs"
            className="space-y-4"
            style={{
              padding: 16,
              borderRadius: 8,
              backgroundColor: "var(--b1)",
            }}
          >
            <Chart
              dataPoints={getChartData("mental")}
              dataKey="score"
              label="Mental Health"
            />
            <Chart
              dataPoints={getChartData("physical")}
              dataKey="score"
              label="Physical Health"
            />
            <Chart
              dataPoints={getChartData("general")}
              dataKey="score"
              label="General Test"
            />
            <Chart
              dataPoints={getChartData("wellness")}
              dataKey="score"
              label="Wellness"
            />
          </div>

          <div className="mt-6">
            <button
              onClick={exportPDF}
              className={`btn btn-primary ${exporting ? "opacity-60" : ""}`}
              disabled={exporting}
            >
              {exporting ? "Generating PDF..." : "Export to PDF"}
            </button>
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
