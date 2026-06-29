const homepageQuery = `
query {
  recommended: Page(page: 1, perPage: 15) {
    media(type: ANIME, sort: SCORE_DESC) {
      id
      title { english romaji }
      coverImage { large }
      episodes
      format
      nextAiringEpisode { episode }
    }
  }
  trending: Page(page: 1, perPage: 45) {
    media(type: ANIME, sort: TRENDING_DESC) {
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
  Page(page: 1, perPage: 30) {
    media(type: ANIME, search: $search) {
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
  Page(page: 1, perPage: 50) {
    media(type: ANIME, format: $format, sort: TRENDING_DESC) {
      id
      title { english romaji }
      coverImage { large }
      episodes
      format
      nextAiringEpisode { episode }
    }
  }
}`;

const watchQuery = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    idMal
    title { english romaji }
    episodes
    status
    nextAiringEpisode { episode }
    streamingEpisodes { title }
  }
}`;

function generateCardHtml(anime) {
    const mainTitle = anime.title.english || anime.title.romaji;
    const posterUrl = anime.coverImage.large;
    const animeFormat = anime.format || "TV";

    let totalEpisodes = "?";
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
                    <span class="badge" style="background-color: #0066cc; color: white; font-size: 10px; font-weight: bold; padding: 2px 4px; border-radius: 2px; white-space: nowrap;">CC ${totalEpisodes}</span>
                    <span class="badge" style="background-color: #8b1e1e; color: white; font-size: 10px; font-weight: bold; padding: 2px 4px; border-radius: 2px; white-space: nowrap;">🎙️ ${totalEpisodes}</span>
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

async function loadHomepageDatabase() {
    const recommendedContainer = document.getElementById("recommended-container");
    const trendingContainer = document.getElementById("trending-container");

    if (!recommendedContainer || !trendingContainer) return;

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
        const recommendedList = jsonResponse.data.recommended.media || [];
        const trendingList = jsonResponse.data.trending.media || [];

        recommendedContainer.innerHTML = "";
        trendingContainer.innerHTML = "";

        const recommendedMarkup = recommendedList.map(anime => generateCardHtml(anime)).join("");
        recommendedContainer.insertAdjacentHTML("beforeend", recommendedMarkup + recommendedMarkup);

        trendingList.forEach(anime => {
            trendingContainer.insertAdjacentHTML("beforeend", generateCardHtml(anime));
        });
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

    if (!searchSection || !mainContent || !searchContainer || !searchTitle) return;

    const trimmedKeyword = (keyword || "").trim();

    if (!trimmedKeyword) {
        searchSection.style.display = "none";
        mainContent.style.display = "block";
        return;
    }

    mainContent.style.display = "none";
    searchSection.style.display = "block";
    searchTitle.textContent = `🔍 Searching for "${trimmedKeyword}"...`;
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
                variables: { search: trimmedKeyword }
            })
        });

        if (!response.ok) throw new Error("Search network pipelines broke down");

        const jsonResult = await response.json();
        const resultsList = jsonResult.data.Page.media || [];

        searchContainer.innerHTML = "";
        searchTitle.textContent = `🔍 Search Results for "${trimmedKeyword}"`;

        if (resultsList.length === 0) {
            searchContainer.innerHTML = "<p style='padding-left: 5px; color: #ff3e6c; width: 100%; grid-column: 1 / -1;'>❌ No anime found matching your query terms.</p>";
            return;
        }

        resultsList.forEach(anime => {
            searchContainer.insertAdjacentHTML("beforeend", generateCardHtml(anime));
        });
    } catch (error) {
        searchContainer.innerHTML = `<p style="color: #ff3e6c; padding-left: 20px; grid-column: 1 / -1;">Search failure: ${error.message}</p>`;
    }
}

const searchInput = document.getElementById("animeSearchBox");
const searchButton = document.getElementById("animeSearchBtn");

if (searchButton && searchInput) {
    searchButton.addEventListener("click", () => {
        executeAnimeSearch(searchInput.value);
    });

    searchInput.addEventListener("keyup", (event) => {
        if (event.key === "Enter") {
            executeAnimeSearch(searchInput.value);
        }
        if (searchInput.value === "") {
            executeAnimeSearch("");
        }
    });
}


const genreLinks = document.querySelectorAll(".genre-link");
genreLinks.forEach(link => {
    link.addEventListener("click", (e) => {
        const genre = e.target.dataset.genre;
        console.log("Selected genre:", genre);
        
    });
});


const typeLinks = document.querySelectorAll(".types-link");
typeLinks.forEach(link => {
    link.addEventListener("click", async (e) => {
        e.preventDefault();
        const type = e.target.dataset.type;
        await filterByType(type);
    });
});

async function filterByType(format) {
    const searchSection = document.getElementById("search-results-section");
    const mainContent = document.getElementById("main-homepage-content");
    const searchContainer = document.getElementById("search-container");
    const searchTitle = document.getElementById("search-title");

    if (!searchSection || !mainContent || !searchContainer || !searchTitle) return;

    mainContent.style.display = "none";
    searchSection.style.display = "block";
    searchTitle.textContent = `📺 Filtering by format: ${format}...`;
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

        if (!response.ok) throw new Error("Failed to fetch");

        const jsonResult = await response.json();
        const resultsList = jsonResult.data.Page.media || [];

        searchContainer.innerHTML = "";
        
        const formatNames = {
            "TV": "TV Series",
            "MOVIE": "Movies",
            "OVA": "OVAs",
            "ONA": "ONAs",
            "SPECIAL": "Specials",
            "MUSIC": "Music"
        };

        searchTitle.textContent = `📺 ${formatNames[format] || format}`;

        if (resultsList.length === 0) {
            searchContainer.innerHTML = "<p style='padding-left: 5px; color: #ff3e6c; width: 100%; grid-column: 1 / -1;'>❌ No anime found for this type.</p>";
            return;
        }

        resultsList.forEach(anime => {
            searchContainer.insertAdjacentHTML("beforeend", generateCardHtml(anime));
        });
    } catch (error) {
        searchContainer.innerHTML = `<p style="color: #ff3e6c; padding-left: 20px; grid-column: 1 / -1;">Error: ${error.message}</p>`;
    }
}

loadHomepageDatabase();