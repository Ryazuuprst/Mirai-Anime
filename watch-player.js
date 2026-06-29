const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
let currentEpisode = parseInt(urlParams.get('ep')) || 1;

// Load the previously selected server from localStorage
let activeServerSelectionCode = parseInt(localStorage.getItem('selectedServer')) || 1;
let anikotoEmbedUrl = ""; 

const watchQuery = `
query ($id: Int) {
  Media (id: $id, type: ANIME) {
    title { english romaji }
    episodes
    nextAiringEpisode { episode }
  }
}`;

function executePlayerUrlRefresh() {
    const videoIframe = document.getElementById("video-iframe");
    document.getElementById("watch-episode-indicator").textContent = "Now Playing: Episode " + currentEpisode;

    const finalAnimeId = animeId ? animeId : "1";
    const finalEpisode = currentEpisode ? currentEpisode : "1";

    if (activeServerSelectionCode === 1) {
        // Server 1 (Sub) with sound enabled parameters added correctly
        videoIframe.src = "https://megaplay.buzz/stream/ani/" + finalAnimeId + "/" + finalEpisode + "/sub?autoplay=1&muted=0";
    } else if (activeServerSelectionCode === 2) {
        // Server 2 (Dub) with sound enabled parameters added correctly
        videoIframe.src = "https://megaplay.buzz/stream/ani/" + finalAnimeId + "/" + finalEpisode + "/dub?autoplay=1&muted=0";
    } else if (activeServerSelectionCode === 3) {
        if (anikotoEmbedUrl) {
            videoIframe.src = anikotoEmbedUrl;
        } else {
            videoIframe.src = "https://anikotoapi.site" + finalAnimeId;
        }
    }
}

async function checkServerAvailability(serverCode, episodeNum) {
    const finalAnimeId = animeId ? animeId : "1";
    
    try {
        if (serverCode === 1) {
            // Check Sub server
            const response = await fetch("https://megaplay.buzz/stream/ani/" + finalAnimeId + "/" + episodeNum + "/sub?autoplay=1&muted=0", { method: "HEAD" });
            return response.ok;
        } else if (serverCode === 2) {
            // Check Dub server
            const response = await fetch("https://megaplay.buzz/stream/ani/" + finalAnimeId + "/" + episodeNum + "/dub?autoplay=1&muted=0", { method: "HEAD" });
            return response.ok;
        } else if (serverCode === 3) {
            // Anikoto is available if we have the URL
            return anikotoEmbedUrl ? true : false;
        }
    } catch (error) {
        return false;
    }
    return false;
}

async function ensureServerAvailability() {
    // Check if the currently selected server has the episode
    const isAvailable = await checkServerAvailability(activeServerSelectionCode, currentEpisode);
    
    if (!isAvailable) {
        // Try to find an available server
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

    btn1.classList.remove("active");
    btn2.classList.remove("active");
    btn3.classList.remove("active");

    if (activeServerSelectionCode === 1) btn1.classList.add("active");
    else if (activeServerSelectionCode === 2) btn2.classList.add("active");
    else if (activeServerSelectionCode === 3) btn3.classList.add("active");
}

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
            body: JSON.stringify({
                query: watchQuery,
                variables: { id: parseInt(animeId) }
            })
        });

        const jsonResult = await response.json();
        const anime = jsonResult.data.Media;
        const mainTitle = anime.title.english || anime.title.romaji;

        let totalEpisodesCount = 1;
        if (anime.episodes) {
            totalEpisodesCount = anime.episodes;
        } else if (anime.nextAiringEpisode) {
            totalEpisodesCount = anime.nextAiringEpisode.episode - 1;
        }

        document.getElementById("watch-page-title").textContent = "Watching " + mainTitle + " Ep " + currentEpisode + " - Miraianime";
        animeTitleHeader.textContent = mainTitle;
        document.getElementById("episodes-count-header").textContent = "Episodes List (" + totalEpisodesCount + " available)";

        try {
            const anikotoResponse = await fetch("https://anikotoapi.site" + animeId);
            if (anikotoResponse.ok) {
                const anikotoData = await anikotoResponse.json();
                const targetEpObj = anikotoData.episodes.find(e => parseInt(e.number) === currentEpisode);
                if (targetEpObj && targetEpObj.embed_url) {
                    anikotoEmbedUrl = targetEpObj.embed_url.sub || targetEpObj.embed_url.dub;
                }
            }
        } catch (anikotoErr) {
            console.log("Anikoto data bridge tracker statement:", anikotoErr.message);
        }

        await ensureServerAvailability();
        updateServerButtons();
        executePlayerUrlRefresh();

        episodeGrid.innerHTML = ""; 
        for (let i = 1; i <= totalEpisodesCount; i++) {
            const epBtn = document.createElement("a");
            epBtn.className = "ep-btn";
            if (i === currentEpisode) epBtn.classList.add("active");
            epBtn.textContent = i;
            
            epBtn.href = "watch.html?id=" + animeId + "&ep=" + i;
            
            episodeGrid.appendChild(epBtn);
        }

    } catch (error) {
        animeTitleHeader.textContent = "Failed to connect to video streaming lines channels";
        console.error("Critical execution mapping exceptions errors logs trace statement:", error.message);
    }
}

initializeWatchPlayer();