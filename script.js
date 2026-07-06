const homepageQuery = `
query {
  recommended: Page (page: 1, perPage: 15) { 
    media (type: ANIME, sort: SCORE_DESC) {
      id
      title { english romaji }
      coverImage { large }
      episodes
      format
      nextAiringEpisode { episode }
    }
  }
  trending: Page (page: 1, perPage: 500) { 
    media (type: ANIME, sort: TRENDING_DESC) {
      id
      title { english romaji }
      coverImage { large }
      episodes
      format
      nextAiringEpisode { episode }
    }
  }
}`;

const searchQuery = `
query ($search: String) {
  Page (page: 1, perPage: 30) {
    media (type: ANIME, search: $search) {
      id
      title { english romaji }
      coverImage { large }
      episodes
      format
      nextAiringEpisode { episode }
    }
  }
}`;

const genreQuery = `
query ($genre: String) {
  Page (page: 1, perPage: 30) {
    media (type: ANIME, genre: $genre, sort: TRENDING_DESC) {
      id
      title { english romaji }
      coverImage { large }
      episodes
      format
      nextAiringEpisode { episode }
    }
  }
}`;

const typeQuery = `
query ($format: MediaFormat) {
  Page (page: 1, perPage: 50) {
    media (type: ANIME, format: $format, sort: TRENDING_DESC) {
      id
      title { english romaji }
      coverImage { large }
      episodes
      format
      nextAiringEpisode { episode }
    }
  }
}`;


function generateCardHtml(anime) {
    const mainTitle = anime.title.english || anime.title.romaji;
    const posterUrl = anime.coverImage.large;
    const animeFormat = anime.format || "TV";
    
    
    let totalEpisodes = "1";
    if (anime.episodes) {
        totalEpisodes = anime.episodes;
    } else if (anime.nextAiringEpisode) {
        totalEpisodes = anime.nextAiringEpisode.episode - 1;
    }

    return `
    <div class="card-item-wrapper" style="width: 100%; display: flex; flex-direction: column; box-sizing: border-box;">
        <div class="card-wrapper" style="width: 100%; background-color: #0b111e; border-radius: 4px; overflow: hidden; display: flex; flex-direction: column;">
            <a href="anime-details.html?id=${anime.id}" style="display: block; width: 100%;"> 
                <img src="${posterUrl}" alt="${mainTitle}" style="width: 100%; aspect-ratio: 2 / 3; object-fit: cover; display: block;">
            </a>
            <div class="info-bar" style="display: flex; justify-content: space-between; align-items: center; padding: 8px 6px; background-color: #0b111e; gap: 4px; flex-wrap: wrap;">
                <div class="badge-group" style="display: flex; gap: 3px; flex-wrap: wrap; min-width: 0;">
                    <span class="badge" style="background-color: #0066cc; color: white; font-size: 10px; font-weight: bold; padding: 2px 4px; border-radius: 2px; white-space: nowrap;"><i class="fas fa-closed-captioning"></i> ${totalEpisodes}</span>
                    <span class="badge" style="background-color: #8b1e1e; color: white; font-size: 10px; font-weight: bold; padding: 2px 4px; border-radius: 2px; white-space: nowrap;"><i class="fas fa-microphone"></i> ${totalEpisodes}</span>
                    <span class="badge" style="background-color: #334155; color: white; font-size: 10px; font-weight: bold; padding: 2px 4px; border-radius: 2px; white-space: nowrap;">${totalEpisodes}</span>
                </div>
                <span class="type-label" style="font-size: 10px; font-weight: bold; color: #475569; white-space: nowrap; margin-left: auto;">${animeFormat}</span>
            </div>
        </div>
        <h4 style="margin: 8px 0 4px 0; font-size: 12px; font-weight: bold; color: #ffffff; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%;">
            <a href="anime-details.html?id=${anime.id}" style="color: inherit; text-decoration: none;" title="${mainTitle}">
                ${mainTitle}
            </a>
        </h4>
    </div>`;
}

let trendingAnimeList = [];
let trendingPage = 1;
const trendingPageSize = 16;

function renderTrendingPage(page = 1) {
    const trendingContainer = document.getElementById("trending-container");
    const prevBtn = document.getElementById("trending-prev-btn");
    const nextBtn = document.getElementById("trending-next-btn");
    const pageIndicator = document.getElementById("trending-page-indicator");
    if (!trendingContainer || !prevBtn || !nextBtn || !pageIndicator) return;

    const pageCount = Math.max(1, Math.ceil(trendingAnimeList.length / trendingPageSize));
    trendingPage = Math.min(Math.max(page, 1), pageCount);
    const startIndex = (trendingPage - 1) * trendingPageSize;
    const pageItems = trendingAnimeList.slice(startIndex, startIndex + trendingPageSize);

    trendingContainer.innerHTML = "";
    if (pageItems.length === 0) {
        trendingContainer.innerHTML = "<p style='padding-left: 5px; color: #4ed9ff; width: 100%; grid-column: 1 / -1;'>No trending anime available.</p>";
    } else {
        trendingContainer.insertAdjacentHTML("beforeend", pageItems.map(anime => generateCardHtml(anime)).join(""));
    }

    pageIndicator.textContent = `Page ${trendingPage} of ${pageCount}`;
    prevBtn.disabled = trendingPage <= 1;
    nextBtn.disabled = trendingPage >= pageCount;
}

async function loadHomepageDatabase() {
    const recommendedContainer = document.getElementById("recommended-container");
    const trendingContainer = document.getElementById("trending-container");
    
    recommendedContainer.innerHTML = "<p style='padding-left: 5px; color: #4ed9ff; width: 100%; grid-column: 1 / -1;'>⏳ Loading recommendations...</p>";
    trendingContainer.innerHTML = "<p style='padding-left: 5px; color: #4ed9ff; width: 100%; grid-column: 1 / -1;'>⏳ Loading trending database...</p>";

    try {
        const response = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ query: homepageQuery })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const jsonResponse = await response.json();
        
        const recommendedList = jsonResponse.data.recommended.media;
        const trendingList = jsonResponse.data.trending.media;

        recommendedContainer.innerHTML = "";
        trendingContainer.innerHTML = "";

        const recommendedMarkup = recommendedList.map(anime => generateCardHtml(anime)).join("");
        recommendedContainer.insertAdjacentHTML("beforeend", recommendedMarkup + recommendedMarkup);

        trendingAnimeList = trendingList;
        renderTrendingPage(1);

    } catch (error) {
        const errorTemplate = `<p style="color: #ff3e6c; padding-left: 5px; grid-column: 1 / -1;">Error loading row contents: ${error.message}</p>`;
        recommendedContainer.innerHTML = errorTemplate;
        trendingContainer.innerHTML = errorTemplate;
    }
}


async function executeAnimeSearch(keyword) {
    const searchSection = document.getElementById("search-results-section");
    const mainContent = document.getElementById("main-homepage-content");
    const searchContainer = document.getElementById("search-container");
    const searchTitle = document.getElementById("search-title");

    
    if (!keyword || !keyword.trim()) {
        searchSection.style.display = "none";
        mainContent.style.display = "block";
        return;
    }

    
    mainContent.style.display = "none";
    searchSection.style.display = "block";
    searchTitle.textContent = `🔍 Searching for "${keyword}"...`;
    searchContainer.innerHTML = "<p style='padding-left: 5px; color: #4ed9ff; width: 100%; grid-column: 1 / -1;'>⏳ Scanning anime universe database...</p>";

    try {
        const response = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                query: searchQuery,
                variables: { search: keyword }
            })
        });

        if (!response.ok) throw new Error("Search network pipelines broke down");

        const jsonResult = await response.json();
        const resultsList = jsonResult.data.Page.media;

        searchContainer.innerHTML = "";
        searchTitle.textContent = ` Search Results for "${keyword}"`;

        if (!resultsList || resultsList.length === 0) {
            searchContainer.innerHTML = "<p style='padding-left: 5px; color: #ff3e6c; width: 100%; grid-column: 1 / -1;'>❌ No anime found matching your query terms.</p>";
            return;
        }

        resultsList.forEach(anime => {
            searchContainer.insertAdjacentHTML("beforeend", generateCardHtml(anime));
        });

    } catch (error) {
        searchContainer.innerHTML = `<p style="color: #ff3e6c; padding-left: 5px; grid-column: 1 / -1;">Search failure: ${error.message}</p>`;
    }
}

async function executeGenreSearch(genre) {
    const searchSection = document.getElementById("search-results-section");
    const mainContent = document.getElementById("main-homepage-content");
    const searchContainer = document.getElementById("search-container");
    const searchTitle = document.getElementById("search-title");

    if (!searchSection || !mainContent || !searchContainer || !searchTitle) return;

    const selectedGenre = (genre || "").trim();

    if (!selectedGenre) {
        searchSection.style.display = "none";
        mainContent.style.display = "block";
        return;
    }

    mainContent.style.display = "none";
    searchSection.style.display = "block";
    searchTitle.textContent = `🎞️ ${selectedGenre} anime`;
    searchContainer.innerHTML = "<p style='padding-left: 5px; color: #4ed9ff; width: 100%; grid-column: 1 / -1;'>⏳ Loading genre collection...</p>";

    try {
        const response = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                query: genreQuery,
                variables: { genre: selectedGenre }
            })
        });

        if (!response.ok) throw new Error("Genre request failed");

        const jsonResult = await response.json();
        const resultsList = jsonResult.data.Page.media || [];

        searchContainer.innerHTML = "";
        searchTitle.textContent = `🎞️ ${selectedGenre} anime`;

        if (resultsList.length === 0) {
            searchContainer.innerHTML = "<p style='padding-left: 5px; color: #ff3e6c; width: 100%; grid-column: 1 / -1;'>❌ No anime found for this genre yet.</p>";
            return;
        }

        resultsList.forEach(anime => {
            searchContainer.insertAdjacentHTML("beforeend", generateCardHtml(anime));
        });
    } catch (error) {
        searchContainer.innerHTML = `<p style="color: #ff3e6c; padding-left: 5px; grid-column: 1 / -1;">Genre load failed: ${error.message}</p>`;
    }
}

const searchInput = document.getElementById("animeSearchBox");
const searchButton = document.getElementById("animeSearchBtn");

if (searchButton) {
    searchButton.addEventListener("click", () => {
        executeAnimeSearch(searchInput.value);
    });
}

if (searchInput) {
    searchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            executeAnimeSearch(searchInput.value);
        }
        if (searchInput.value === "") {
            executeAnimeSearch("");
        }
    });
}

document.querySelectorAll(".genre-link").forEach(button => {
    button.addEventListener("click", () => {
        executeGenreSearch(button.dataset.genre);
        document.querySelectorAll(".nav-dropdown.open").forEach(dropdown => dropdown.classList.remove("open"));
    });
});

async function executeTypeSearch(format) {
    const searchSection = document.getElementById("search-results-section");
    const mainContent = document.getElementById("main-homepage-content");
    const searchContainer = document.getElementById("search-container");
    const searchTitle = document.getElementById("search-title");

    if (!searchSection || !mainContent || !searchContainer || !searchTitle) return;

    mainContent.style.display = "none";
    searchSection.style.display = "block";
    
    const formatNames = {
        "TV": "TV Series",
        "MOVIE": "Movies",
        "OVA": "OVAs",
        "ONA": "ONAs",
        "SPECIAL": "Specials",
        "MUSIC": "Music"
    };
    
    searchTitle.textContent = `📺 ${formatNames[format] || format}`;
    searchContainer.innerHTML = "<p style='padding-left: 5px; color: #4ed9ff; width: 100%; grid-column: 1 / -1;'>⏳ Loading anime by type...</p>";

    try {
        const response = await fetch("https://graphql.anilist.co", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({
                query: typeQuery,
                variables: { format: format }
            })
        });

        if (!response.ok) throw new Error("Type request failed");

        const jsonResult = await response.json();
        const resultsList = jsonResult.data.Page.media || [];

        searchContainer.innerHTML = "";
        searchTitle.textContent = `📺 ${formatNames[format] || format}`;

        if (resultsList.length === 0) {
            searchContainer.innerHTML = "<p style='padding-left: 5px; color: #ff3e6c; width: 100%; grid-column: 1 / -1;'>❌ No anime found for this type.</p>";
            return;
        }

        resultsList.forEach(anime => {
            searchContainer.insertAdjacentHTML("beforeend", generateCardHtml(anime));
        });
    } catch (error) {
        searchContainer.innerHTML = `<p style="color: #ff3e6c; padding-left: 5px; grid-column: 1 / -1;">Type load failed: ${error.message}</p>`;
    }
}

document.querySelectorAll(".types-link").forEach(button => {
    button.addEventListener("click", () => {
        executeTypeSearch(button.dataset.type);
        document.querySelectorAll(".nav-dropdown.open").forEach(dropdown => dropdown.classList.remove("open"));
    });
});

document.querySelectorAll(".dropdown-toggle").forEach(toggle => {
    toggle.addEventListener("click", (event) => {
        event.preventDefault();
        const parentDropdown = toggle.closest(".nav-dropdown");
        if (!parentDropdown) return;
        parentDropdown.classList.toggle("open");
    });
});

document.addEventListener("click", (event) => {
    document.querySelectorAll(".nav-dropdown.open").forEach(dropdown => {
        if (!dropdown.contains(event.target)) {
            dropdown.classList.remove("open");
        }
    });
});

const trendingPrevButton = document.getElementById("trending-prev-btn");
const trendingNextButton = document.getElementById("trending-next-btn");
if (trendingPrevButton && trendingNextButton) {
    trendingPrevButton.addEventListener("click", () => renderTrendingPage(trendingPage - 1));
    trendingNextButton.addEventListener("click", () => renderTrendingPage(trendingPage + 1));
}

loadHomepageDatabase();

const video = document.getElementById('hero-video');
const image = document.getElementById('hero-image');

video.addEventListener('ended', function() {
  image.classList.remove('fade-out');
  image.classList.add('fade-in');
  
  
  video.pause(); 
});

    