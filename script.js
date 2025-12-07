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

async function loadProjects() {
  const grid = document.getElementById("projects-grid");
  const globalUpdatedEl = document.getElementById("global-last-updated");

  try {
    const res = await fetch("download-data.json", { cache: "no-cache" });
    if (!res.ok) {
      throw new Error("Failed to load download-data.json");
    }

    const data = await res.json();

    const projects = Array.isArray(data.projects) ? data.projects : [];
    if (!projects.length) {
      grid.innerHTML =
        '<div class="project-card"><h3>No projects yet</h3><p class="muted">Waiting for the GitHub Action to populate data.</p></div>';
      if (globalUpdatedEl) {
        globalUpdatedEl.textContent =
          "No data yet. Check that the workflow has run successfully.";
      }
      return;
    }

    // Optional: sort by name
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

      return `
        <article class="project-card">
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

    if (globalUpdatedEl) {
      const last = data.lastUpdated
        ? new Date(data.lastUpdated)
        : new Date();
      globalUpdatedEl.textContent = `Last updated: ${last.toLocaleString()}`;
    }
  } catch (err) {
    console.error(err);
    if (grid) {
      grid.innerHTML =
        '<div class="project-card"><h3>Error loading data</h3><p class="muted">Check the browser console and the GitHub Actions logs.</p></div>';
    }
    if (globalUpdatedEl) {
      globalUpdatedEl.textContent =
        "Error loading data. See console / workflow logs.";
    }
  }
}

setCurrentYear();
loadProjects();
