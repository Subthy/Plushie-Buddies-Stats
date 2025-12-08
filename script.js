function setCurrentYear() {
  const yearEl = document.getElementById("current-year");
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
}

function formatDisplay(entry) {
  if (!entry) return "N/A";

  if (typeof entry.downloadDisplay === "string") {
    return entry.downloadDisplay;
  }
  if (typeof entry.downloadApprox === "number") {
    return entry.downloadApprox.toLocaleString();
  }
  return "N/A";
}

function getDelta(latest, prev) {
  if (!latest || !prev) return null;
  if (
    typeof latest.downloadApprox !== "number" ||
    typeof prev.downloadApprox !== "number"
  ) {
    return null;
  }
  return latest.downloadApprox - prev.downloadApprox;
}

async function loadStats() {
  const grid = document.getElementById("projects-grid");
  const globalUpdatedEl = document.getElementById("global-last-updated");

  // If neither element exists, nothing to do on this page
  if (!grid && !globalUpdatedEl) return;

  try {
    const res = await fetch("download-data.json", { cache: "no-cache" });
    if (!res.ok) {
      throw new Error("Failed to load download-data.json");
    }

    const data = await res.json();
    const projects = Array.isArray(data.projects) ? data.projects : [];

    // Update global "last updated" if element exists
    if (globalUpdatedEl) {
      if (!data.lastUpdated) {
        globalUpdatedEl.textContent =
          "No data yet. Waiting for the GitHub Action to run.";
      } else {
        const last = new Date(data.lastUpdated);
        globalUpdatedEl.textContent = `Last updated: ${last.toLocaleString()}`;
      }
    }

    // If there's no projects grid on this page, we're done
    if (!grid) return;

    if (!projects.length) {
      grid.innerHTML =
        '<div class="project-card"><h3>No projects yet</h3><p class="muted">Waiting for the GitHub Action to populate data.</p></div>';
      return;
    }

    // Sort by name for consistency
    projects.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    const cards = projects.map((proj) => {
      const history = Array.isArray(proj.history) ? proj.history : [];
      const latest = history.length ? history[history.length - 1] : null;
      const prev = history.length > 1 ? history[history.length - 2] : null;

      const display = formatDisplay(latest);
      const delta = getDelta(latest, prev);

      const deltaText =
        delta === null || delta === 0
          ? "No change since last check"
          : `${delta > 0 ? "+" : ""}${delta.toLocaleString()} since last check`;

      const type = proj.type || "Project";
      const url = proj.curseforgeUrl || "#";

      const logoHtml =
        proj.logoUrl && typeof proj.logoUrl === "string"
          ? `<img class="project-logo" src="${proj.logoUrl}" alt="${proj.name || "Project"} logo" loading="lazy" />`
          : "";

      return `
        <article class="project-card">
          ${logoHtml}
          <div class="project-type">${type}</div>
          <h3>${proj.name || "Unnamed project"}</h3>
          <div class="project-count">${display}</div>
          <div class="project-delta">${deltaText}</div>
          <div class="project-links">
            <a href="${url}" target="_blank" rel="noopener noreferrer">
              View on CurseForge
            </a>
          </div>
        </article>
      `;
    });

    grid.innerHTML = cards.join("");
  } catch (err) {
    console.error(err);

    if (globalUpdatedEl) {
      globalUpdatedEl.textContent =
        "Error loading data. Check browser console and GitHub Actions logs.";
    }

    if (grid) {
      grid.innerHTML =
        '<div class="project-card"><h3>Error loading data</h3><p class="muted">Check the browser console and the GitHub Actions logs.</p></div>';
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setCurrentYear();
  loadStats();
});
