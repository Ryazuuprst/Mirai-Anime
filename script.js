// ==========================================
// JOB 1: COMMITTING ENTRIES TO LOCALSTORAGE (UPDATED)
// ==========================================
function saveWatchProgress(animeId, animeTitle, epNum, posterUrl) {
    let history = JSON.parse(localStorage.getItem('anime_watch_history')) || [];
    
    // REPLACED: Filters out old entries matching either the ID OR the Title to prevent duplicates
    history = history.filter(item => {
        const isSameId = String(item.id) === String(animeId);
        const isSameTitle = item.title.trim().toLowerCase() === animeTitle.trim().toLowerCase();
        return !isSameId && !isSameTitle; // Returns false if either matches, removing it from history
    });

    // Dynamically captures the exact file name the user is on (e.g., "watch.html" or "horimiya.html")
    const currentFileName = window.location.pathname.split("/").pop() || "watch.html";

    const watchEntry = {
        id: String(animeId), // Always save as a string for perfect data consistency
        title: animeTitle,
        episode: epNum,
        poster: posterUrl,
        page: currentFileName, // Remembers exactly which page to route back to
        time: "Just now"
    };

    history.unshift(watchEntry);
    localStorage.setItem('anime_watch_history', JSON.stringify(history));
    console.log(`Database Log: Tracked progress for ${animeTitle} (ID: ${animeId}) on file ${currentFileName}`);
}

// ==========================================
// JOB 2: PRINTING GENERATED CARDS ON HOMEPAGE (UPDATED WITH INDEX.HTML IMAGE LOOKUP)
// ==========================================
async function displayContinueWatching() {
    const scrollerContainer = document.getElementById('scroller-rowContinueWatching');
    if (!scrollerContainer) return; 

    const history = JSON.parse(localStorage.getItem('anime_watch_history')) || [];
    scrollerContainer.innerHTML = '';

    if (history.length === 0) {
        scrollerContainer.innerHTML = '<p style="color:#71717a; padding:10px;">No recently watched shows found.</p>';
        return;
    }

    // 1. Fetch index.html in the background and turn it into a searchable document object
    let indexDoc = null;
    try {
        const response = await fetch('index.html');
        const htmlText = await response.text();
        const parser = new DOMParser();
        indexDoc = parser.parseFromString(htmlText, 'text/html');
    } catch (error) {
        console.error("Database Log: Could not read index.html for matching poster images.", error);
    }

    history.forEach(item => {
        // 2. Default to the stored poster url
        let correctPosterImage = item.poster;

        // 3. Scan the fetched index.html data to match the image via the anime title alternative text
        if (indexDoc) {
            const cleanTitle = item.title.trim().toLowerCase();
            // Look for any image tag whose 'alt' or attribute contains the anime's title name
            const foundImg = Array.from(indexDoc.querySelectorAll('img')).find(img => {
                const altText = img.getAttribute('alt') || '';
                const titleText = img.getAttribute('title') || '';
                return altText.trim().toLowerCase().includes(cleanTitle) || titleText.trim().toLowerCase().includes(cleanTitle);
            });

            if (foundImg) {
                correctPosterImage = foundImg.getAttribute('src'); // Grab the correct local image path!
            }
        }

        // 4. Print card using the correctly matched poster image
        const cardHtml = `
            <a href="${item.page}?id=${item.id}&ep=${item.episode}" class="cw-card" style="text-decoration: none; display: block;">
                <button class="cw-remove-btn" onclick="event.preventDefault(); event.stopPropagation(); cwRemoveEntry('${item.id}', '${item.title.replace(/'/g, "\\'")}', event)" title="Remove">X</button>
                <div class="cw-thumb-wrapper">
                    <img class="cw-card-thumb" src="${correctPosterImage}" alt="${item.title}" loading="lazy" onerror="this.src='https://anilist.co'">
                    <div class="cw-progress-bar">
                        <div class="cw-progress-fill" style="width: 45%"></div>
                    </div>
                </div>
                <div class="cw-card-body">
                    <div class="cw-card-title">${item.title}</div>
                    <div class="cw-card-ep">
                        <span class="ep-text">EP ${item.episode}</span>
                        <span class="cw-card-time">${item.time}</span>
                    </div>
                </div>
            </a>
        `;
        scrollerContainer.innerHTML += cardHtml;
    });
}

// ==========================================
// JOB 3: REMOVING TRACK TRACE DATA (X KEY)
// ==========================================
function cwRemoveEntry(animeId, animeTitle, event) {
    const card = event.target.closest('.cw-card');
    if (card) {
        card.style.transition = "all 0.3s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.9)";
        
        setTimeout(() => {
            card.remove();
            let history = JSON.parse(localStorage.getItem('anime_watch_history')) || [];
            
            // REPLACED: Clears the item matching either ID or Title on deletion click
            history = history.filter(item => {
                const isSameId = String(item.id) === String(animeId);
                const isSameTitle = item.title.trim().toLowerCase() === animeTitle.trim().toLowerCase();
                return !isSameId && !isSameTitle;
            });
            
            localStorage.setItem('anime_watch_history', JSON.stringify(history));
            if (history.length === 0) displayContinueWatching();
        }, 300);
    }
}

// ==========================================
// AUTOMATION BOOTLOADER MANAGER
// ==========================================
window.addEventListener('load', () => {
    displayContinueWatching();

    const urlParams = new URLSearchParams(window.location.search);
    let targetEpisode = urlParams.get('ep');
    
    if (targetEpisode) {
        const epButtons = document.querySelectorAll('.ep-selector-btn');
        let targetButton = null;
        
        epButtons.forEach(btn => {
            const btnText = btn.textContent.trim();
            const btnNumber = btnText.replace('Ep ', ''); 
            if (btnNumber === targetEpisode) targetButton = btn;
        });

        if (targetButton) {
            setTimeout(() => {
                targetButton.click();
            }, 250);
        }
    }
});
