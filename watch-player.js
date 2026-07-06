const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
let currentEpisode = parseInt(urlParams.get('ep')) || 1;

let activeServerSelectionCode = parseInt(localStorage.getItem('selectedServer')) || 1;

const watchQuery = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    title { english romaji }
    episodes
    nextAiringEpisode { episode }
  }
}`;

const searchQuery = `
query ($search: String) {
  Page(page: 1, perPage: 10) {
    media(type: ANIME, search: $search) {
      id
      title { english romaji }
      coverImage { large }
    }
  }
}`;


function executePlayerUrlRefresh() {
  const videoIframe = document.getElementById("video-iframe");
  document.getElementById("watch-episode-indicator").textContent = "Now Playing: Episode " + currentEpisode;

  const finalAnimeId = animeId ? animeId : "1";
  const finalEpisode = currentEpisode ? currentEpisode : "1";

  if (activeServerSelectionCode === 1) {
    videoIframe.src = `https://megaplay.buzz/stream/ani/${finalAnimeId}/${finalEpisode}/sub?autoplay=1&muted=0`;
  } else if (activeServerSelectionCode === 2) {
    videoIframe.src = `https://megaplay.buzz/stream/ani/${finalAnimeId}/${finalEpisode}/dub?autoplay=1&muted=0`;
  } else if (activeServerSelectionCode === 3) {
    videoIframe.src = `https://nanobyte.bigdreamsmalldih.site/${finalAnimeId}/${finalEpisode}.m3u8`;
  }
}

async function checkServerAvailability(serverCode, episodeNum) {
  const finalAnimeId = animeId ? animeId : "1";
  let url;
  if (serverCode === 1) {
    url = `https://megaplay.buzz/stream/ani/${finalAnimeId}/${episodeNum}/sub`;
  } else if (serverCode === 2) {
    url = `https://megaplay.buzz/stream/ani/${finalAnimeId}/${episodeNum}/dub`;
  } else if (serverCode === 3) {
    url = `https://nanobyte.bigdreamsmalldih.site/${finalAnimeId}/${episodeNum}.m3u8`;
  }
  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

async function ensureServerAvailability() {
  const isAvailable = await checkServerAvailability(activeServerSelectionCode, currentEpisode);
  if (!isAvailable) {
    const serversToTry = [1, 2, 3].filter(s => s !== activeServerSelectionCode);
    for (const serverCode of serversToTry) {
      const available = await checkServerAvailability(serverCode, currentEpisode);
      if (available) {
        activeServerSelectionCode = serverCode;
        localStorage.setItem('selectedServer', serverCode);
        updateServerButtons();
        break;
      }
    }
  }
}

function changeActiveServer(serverNumberCode) {
  if (activeServerSelectionCode === serverNumberCode) return;
  activeServerSelectionCode = serverNumberCode;
  localStorage.setItem('selectedServer', serverNumberCode);
  updateServerButtons();
  executePlayerUrlRefresh();
}

function updateServerButtons() {
  const btn1 = document.getElementById("btn-server1");
  const btn2 = document.getElementById("btn-server2");
  const btn3 = document.getElementById("btn-server3");
  [btn1, btn2, btn3].forEach(btn => btn && btn.classList.remove("active"));
  if (activeServerSelectionCode === 1 && btn1) btn1.classList.add("active");
  else if (activeServerSelectionCode === 2 && btn2) btn2.classList.add("active");
  else if (activeServerSelectionCode === 3 && btn3) btn3.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  const btn1 = document.getElementById("btn-server1");
  const btn2 = document.getElementById("btn-server2");
  const btn3 = document.getElementById("btn-server3");
  if (btn1) btn1.addEventListener("click", () => changeActiveServer(1));
  if (btn2) btn2.addEventListener("click", () => changeActiveServer(2));
  if (btn3) btn3.addEventListener("click", () => changeActiveServer(3));
});

// -------------------- Initialization --------------------

async function initializeWatchPlayer() {
  const animeTitleHeader = document.getElementById("watch-anime-title");
  const episodeGrid = document.getElementById("episode-buttons-grid");

  if (!animeId) {
    animeTitleHeader.textContent = "Error: No Anime Selected";
    return;
  }

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: watchQuery, variables: { id: parseInt(animeId) } })
    });

    const jsonResult = await response.json();
    const anime = jsonResult.data.Media;
    const mainTitle = anime.title.english || anime.title.romaji;

    let totalEpisodesCount = anime.episodes || (anime.nextAiringEpisode ? anime.nextAiringEpisode.episode - 1 : 1);

    document.getElementById("watch-page-title").textContent = `Watching ${mainTitle} Ep ${currentEpisode} - Miraianime`;
    animeTitleHeader.textContent = mainTitle;
    document.getElementById("episodes-count-header").textContent = `Episodes List (${totalEpisodesCount} available)`;

    await ensureServerAvailability();
    updateServerButtons();
    executePlayerUrlRefresh();

    episodeGrid.innerHTML = "";
    for (let i = 1; i <= totalEpisodesCount; i++) {
      const epBtn = document.createElement("a");
      epBtn.className = "ep-btn";
      if (i === currentEpisode) epBtn.classList.add("active");
      epBtn.textContent = i;
      epBtn.href = "#";
      epBtn.addEventListener("click", (e) => {
        e.preventDefault();
        currentEpisode = i;
        ensureServerAvailability();
        executePlayerUrlRefresh();
        document.querySelectorAll(".ep-btn").forEach(btn => btn.classList.remove("active"));
        epBtn.classList.add("active");
      });
      episodeGrid.appendChild(epBtn);
    }
  } catch (error) {
    animeTitleHeader.textContent = "Failed to connect to AniList";
    console.error("Error:", error.message);
  }
}

initializeWatchPlayer();

// -------------------- Nav Dropdown Search --------------------

async function executeAnimeSearch(keyword) {
  const dropdown = document.getElementById("nav-search-dropdown");
  if (!dropdown) return;

  const trimmedKeyword = (keyword || "").trim();
  if (!trimmedKeyword) {
    dropdown.innerHTML = "";
    dropdown.style.display = "none";
    return;
  }

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ query: searchQuery, variables: { search: trimmedKeyword } })
    });

    const jsonResult = await response.json();
    const resultsList = jsonResult.data.Page.media || [];

    dropdown.innerHTML = "";
    if (resultsList.length === 0) {
      dropdown.innerHTML = "<div class='dropdown-item'>❌ No anime found</div>";
      dropdown.style.display = "block";
      return;
    }

    resultsList.forEach(anime => {
      const mainTitle = anime.title.english || anime.title.romaji;
      dropdown.insertAdjacentHTML("beforeend", `
        <div class="dropdown-item" 
             style="padding:6px; cursor:pointer; border-bottom:1px solid #334155;"
             onclick="window.location.href='watch.html?id=${anime.id}'">
          ${mainTitle}
        </div>
      `);
    });

    dropdown.style.display = "block";
  } catch (err) {
    dropdown.innerHTML = `<div class='dropdown-item'>Error: ${err.message}</div>`;
    dropdown.style.display = "block";
  }
}

const navSearchInput = document.getElementById("animeSearchBox");
const navSearchButton = document.getElementById("animeSearchBtn");

if (navSearchButton && navSearchInput) {
  navSearchButton.addEventListener("click", () => {
    executeAnimeSearch(navSearchInput.value);
  });
  navSearchInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      executeAnimeSearch(navSearchInput.value);
    } else {
      executeAnimeSearch(navSearchInput.value);
    }
  });
}
