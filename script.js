async function loadData() {
  const currentEl = document.getElementById("current-count");
  const updatedEl = document.getElementById("last-updated");
  const historyBody = document.getElementById("history-body");

  try {
    const res = await fetch("download-data.json", {
      cache: "no-cache",
    });

    if (!res.ok) {
      throw new Error("Failed to load download-data.json");
    }

    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      currentEl.textContent = "No data yet";
      updatedEl.textContent =
        "Waiting for the first GitHub Action run to populate data.";
      historyBody.innerHTML =
        '<tr><td colspan="4" style="text-align:center;">No entries yet</td></tr>';
      return;
    }

    // Sort by timestamp just in case
    data.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const latest = data[data.length - 1];
    currentEl.textContent = latest.downloadCount.toLocaleString();

    const lastUpdated = new Date(latest.timestamp);
    updatedEl.textContent = `Last updated: ${lastUpdated.toLocaleString()}`;

    // Build history rows (newest first)
    const rows = [];
    for (let i = data.length - 1; i >= 0; i--) {
      const entry = data[i];
      const prev = i > 0 ? data[i - 1] : null;
      const delta =
        prev && typeof prev.downloadCount === "number"
          ? entry.downloadCount - prev.downloadCount
          : 0;

      const localTime = new Date(entry.timestamp).toLocaleString();

      rows.push(`
        <tr>
          <td>${data.length - i}</td>
          <td>${localTime}</td>
          <td>${entry.downloadCount.toLocaleString()}</td>
          <td>${delta > 0 ? "+" + delta.toLocaleString() : "—"}</td>
        </tr>
      `);
    }

    historyBody.innerHTML = rows.join("");
  } catch (err) {
    console.error(err);
    currentEl.textContent = "Error";
    updatedEl.textContent =
      "Could not load data. Check the browser console for details.";
    historyBody.innerHTML =
      '<tr><td colspan="4" style="text-align:center;">Error loading data</td></tr>';
  }
}

loadData();
