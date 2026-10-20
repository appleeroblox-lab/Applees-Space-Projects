"use strict";

(() => {
  // Deploy the optional Worker below and paste its HTTPS /stats URL here.
  const STATS_ENDPOINT = "https://applee-roblox-stats.appleeroblox.workers.dev/";
  const REFRESH_MS = 45000;

  const projects = [
    {
      placeId: "135329454168418",
      name: "The Zero Gravity 2",
      image: "images/TZG2_Page.png",
      status: "development",
      description: "The next chapter in space exploration. New worlds, new possibilities, a bigger universe.",
      url: "https://www.roblox.com/games/135329454168418/The-Zero-Gravity-2"
    },
    {
      placeId: "103215463627191",
      name: "The Zero Gravity",
      image: "images/TZG_Page.png",
      status: "public",
      description: "Head into space and discover the universe in the original The Zero Gravity experience.",
      url: "https://www.roblox.com/games/103215463627191/The-Zero-Gravity"
    },
    {
      placeId: "132650472829217",
      name: "Text To Speech Test",
      image: "images/TTS_Test.png",
      status: "public",
      description: "An experimental playground for text to speech. Turn your words into something you can hear.",
      url: "https://www.roblox.com/games/132650472829217/Text-To-Speech-Test"
    }
  ];

  const grid = document.querySelector("#game-grid");
  const search = document.querySelector("#search");
  const filter = document.querySelector("#filter");
  const sort = document.querySelector("#sort");
  const statsStatus = document.querySelector("#stats-status");
  const totalPlaying = document.querySelector("#total-playing");

  const stats = new Map();
  const cards = new Map();

  const numberFormat = new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1
  });

  let firstNavigation = true;
  let refreshing = false;

  function isCount(value) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
  }

  function formatCount(value) {
    return isCount(value) ? numberFormat.format(value) : "Unavailable";
  }

  function navigate() {
    const routes = ["home", "games", "about"];
    let route = location.hash.replace(/^#\/?/, "");

    if (route === "content") {
      route = document.body.dataset.page || "home";
    }

    if (!routes.includes(route)) route = "home";

    routes.forEach(name => {
      document.getElementById(name).hidden = name !== route;
    });

    document.querySelectorAll("[data-route]").forEach(link => {
      if (link.dataset.route === route) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    document.body.dataset.page = route;

    const prefix = route === "home" ? "" : `${route[0].toUpperCase()}${route.slice(1)} — `;
    document.title = `${prefix}Applee's Space Projects`;

    if (!firstNavigation) {
      window.scrollTo(0, 0);

      const heading = document.querySelector(`#${route} h1`);
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }

    firstNavigation = false;
  }

  function createCard(project) {
    const card = document.createElement("article");
    const development = project.status === "development";

    card.className = "game-card glass";

    // All interpolated content here comes from the fixed project list above.
    card.innerHTML = `
      <img class="thumbnail" src="${project.image}" alt="${project.name} game artwork" loading="lazy" width="640" height="360">

      <div class="game-body">
        <span class="badge ${development ? "development" : ""}">
          ${development ? "In Development" : "Public"}
        </span>

        <h2>${project.name}</h2>
        <p class="byline">By <span class="pink">Applee</span></p>
        <p class="description">${project.description}</p>

        <dl class="stats">
          <div>
            <dt>Playing now</dt>
            <dd data-stat="playing" class="unavailable">Unavailable</dd>
          </div>

          <div>
            <dt>Visits</dt>
            <dd data-stat="visits" class="unavailable">Unavailable</dd>
          </div>

          <div>
            <dt>Approval</dt>
            <dd data-stat="approval" class="unavailable">Unavailable</dd>
          </div>
        </dl>

        <div class="card-bottom">
          <span class="votes">Likes: unavailable</span>

          <a class="play ${development ? "view" : ""}" href="${project.url}" target="_blank" rel="noopener noreferrer" aria-label="${development ? "View" : "Play"} ${project.name} on Roblox">
            ${development ? "View ↗" : "▶ Play"}
          </a>
        </div>
      </div>
    `;

    cards.set(project.placeId, card);
    return card;
  }

  projects.forEach(project => grid.append(createCard(project)));

  function renderCollection() {
    const term = search.value.trim().toLowerCase();

    const ordered = projects
      .map((project, index) => ({ ...project, index }))
      .sort((a, b) => {
        if (sort.value === "name") {
          return a.name.localeCompare(b.name);
        }

        if (sort.value === "playing" || sort.value === "visits") {
          const av = stats.get(a.placeId)?.[sort.value];
          const bv = stats.get(b.placeId)?.[sort.value];

          const difference = (isCount(bv) ? bv : -1) - (isCount(av) ? av : -1);
          if (difference) return difference;
        }

        return a.index - b.index;
      });

    let visible = 0;

    ordered.forEach(project => {
      const card = cards.get(project.placeId);
      const matchesSearch = project.name.toLowerCase().includes(term);
      const matchesStatus = filter.value === "all" || filter.value === project.status;

      card.hidden = !matchesSearch || !matchesStatus;

      if (!card.hidden) visible++;
      grid.append(card);
    });

    document.querySelector("#empty").hidden = visible !== 0;
    document.querySelector("#result-count").textContent = `${visible} ${visible === 1 ? "project" : "projects"}`;
  }

  function renderStats() {
    let total = 0;
    let allAvailable = true;
    let anyAvailable = false;

    projects.forEach(project => {
      const card = cards.get(project.placeId);
      const data = stats.get(project.placeId) || {};

      const validVotes = isCount(data.upVotes) && isCount(data.downVotes);
      const voteCount = validVotes ? data.upVotes + data.downVotes : 0;

      const approval = validVotes
        ? voteCount > 0
          ? `${Math.round(data.upVotes / voteCount * 100)}%`
          : "No votes"
        : "Unavailable";

      const values = {
        playing: formatCount(data.playing),
        visits: formatCount(data.visits),
        approval
      };

      card.querySelectorAll("[data-stat]").forEach(element => {
        const key = element.dataset.stat;

        element.textContent = values[key];
        element.classList.remove("loading");
        element.classList.toggle("unavailable", values[key] === "Unavailable");

        element.title = isCount(data[key])
          ? data[key].toLocaleString("en")
          : values[key];
      });

      card.querySelector(".votes").textContent = validVotes
        ? `${formatCount(data.upVotes)} likes · ${formatCount(data.downVotes)} dislikes`
        : "Likes: unavailable";

      if (isCount(data.playing)) {
        total += data.playing;
      } else {
        allAvailable = false;
      }

      if (isCount(data.playing) || isCount(data.visits) || validVotes) {
        anyAvailable = true;
      }
    });

    totalPlaying.textContent = allAvailable ? formatCount(total) : "Unavailable";

    if (anyAvailable) {
      const time = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
      });

      statsStatus.textContent = `Roblox statistics updated ${time} · Refreshes every 45 seconds${allAvailable ? "" : " · Some data unavailable"}`;
    } else {
      statsStatus.textContent = "Live Roblox statistics are currently unavailable. Game links still work.";
    }

    renderCollection();
  }

  async function refreshStats() {
    if (!STATS_ENDPOINT || refreshing || document.hidden) return;

    refreshing = true;

    if (!stats.size) {
      cards.forEach(card => {
        card.querySelectorAll("[data-stat]").forEach(element => {
          element.textContent = "Loading…";
          element.classList.add("loading");
        });
      });
    }

    try {
      const response = await fetch(STATS_ENDPOINT, {
        credentials: "omit",
        cache: "no-store",
        signal: AbortSignal.timeout(12000)
      });

      if (!response.ok) throw new Error("Statistics unavailable");

      const result = await response.json();
      if (!Array.isArray(result.games)) throw new Error("Invalid response");

      stats.clear();

      result.games.forEach(game => {
        if (game && projects.some(project => project.placeId === String(game.placeId))) {
          stats.set(String(game.placeId), game);
        }
      });
    } catch {
      stats.clear();
    } finally {
      refreshing = false;
      renderStats();
    }
  }

  search.addEventListener("input", renderCollection);
  filter.addEventListener("change", renderCollection);
  sort.addEventListener("change", renderCollection);

  document.querySelector("#reset").addEventListener("click", () => {
    search.value = "";
    filter.value = "all";
    renderCollection();
    search.focus();
  });

  document.querySelector("#year").textContent = new Date().getFullYear();

  window.addEventListener("hashchange", navigate);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshStats();
  });

  navigate();
  renderCollection();
  refreshStats();

  setInterval(refreshStats, REFRESH_MS);
})();
