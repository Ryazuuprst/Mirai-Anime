// ==========================================
// JOB 1: COMMITTING ENTRIES TO LOCALSTORAGE
// ==========================================
function saveWatchProgress(animeId, animeTitle, epNum, posterUrl) {
    let history = JSON.parse(localStorage.getItem('anime_watch_history')) || [];
    
    history = history.filter(item => {
        const isSameId = String(item.id) === String(animeId);
        const isSameTitle = item.title.trim().toLowerCase() === animeTitle.trim().toLowerCase();
        return !isSameId && !isSameTitle;
    });

    const currentFileName = window.location.pathname.split("/").pop() || "watch.html";

    const watchEntry = {
        id: String(animeId), 
        title: animeTitle,
        episode: epNum,
        poster: posterUrl, 
        page: currentFileName, 
        time: "Just now"
    };

    history.unshift(watchEntry);
    localStorage.setItem('anime_watch_history', JSON.stringify(history));
    console.log(`Database Log: Tracked progress for ${animeTitle}`);
}

// ==========================================
// JOB 2: PRINTING GENERATED CARDS ON HOMEPAGE
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

    let indexDoc = null;
    try {
        const response = await fetch('index.html');
        const htmlText = await response.text();
        const parser = new DOMParser();
        indexDoc = parser.parseFromString(htmlText, 'text/html');
    } catch (error) {
        console.error("Database Log: Fallback activated. Could not fetch index.html over network.", error);
    }

    history.forEach(item => {
        let correctPosterImage = item.poster;

        if (indexDoc) {
            const cleanTargetId = String(item.id).trim();
            const foundAnchor = Array.from(indexDoc.querySelectorAll('a')).find(a => {
                const href = a.getAttribute('href') || '';
                return href.includes(`id=${cleanTargetId}`);
            });

            if (foundAnchor) {
                const foundImg = foundAnchor.querySelector('img') || 
                                 foundAnchor.closest('.anime-card, .card, div')?.querySelector('img') ||
                                 foundAnchor.parentElement?.querySelector('img');

                if (foundImg && foundImg.getAttribute('src')) {
                    correctPosterImage = foundImg.getAttribute('src');
                }
            }
        }

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
// JOB 4: NAVIGATION SEARCH BAR LOGIC (BULLETPROOF PARENT ENGINE)
// ==========================================
function initAnimeSearch() {
    const searchBar = document.getElementById('animeSearchBox');
    if (!searchBar) return;

    searchBar.addEventListener('input', (event) => {
        const searchText = event.target.value.trim().toLowerCase();
        
        // 1. Select cards using the stable layout class string
        const allAnimeCards = document.querySelectorAll('.anime-card');

        allAnimeCards.forEach(card => {
            // 2. Identify the true outer wrapper block (the direct layout parent container)
            const parentBlock = card.parentElement;
            
            if (parentBlock) {
                // 3. Look for the <h4> text tag that sits inside this shared parent block
                const titleElement = parentBlock.querySelector('h4');
                
                if (titleElement) {
                    const animeTitle = titleElement.textContent.toLowerCase();

                    // 4. Cleanly toggle our visibility override helper class
                    if (animeTitle.includes(searchText)) {
                        parentBlock.classList.remove('cw-hide-card'); // Shows item block
                    } else {
                        parentBlock.classList.add('cw-hide-card');    // Hides item block completely
                    }
                }
            }
        });
    });
}



// ==========================================
// AUTOMATION BOOTLOADER MANAGER
// ==========================================
function startAllFeatures() {
    displayContinueWatching();
    initAnimeSearch();

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
}

// Safely initializes features right away on local file schemes
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAllFeatures);
} else {
    startAllFeatures();
}
