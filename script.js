
const MY_ANIME_DATABASE = [
    {
        id: "kamisama kiss",
        title: "Kamisama Kiss",
        poster: "https://tmdb.org",
        page: "Kamisama kiss.html", 
        cc: "CC 13", mic: "🎙️ 13", ep: "13", type: "TV"
    },
    {
        id: "solo leveling", 
        title: "Solo Leveling Season 2 -Arise from the Shadow-",
        poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx176496-9BDMjAZGEbq4.png",
        page: "watch.html", 
        cc: "CC 13", mic: "🎙️ 13", ep: "13", type: "TV",
        year: "2021", rating: "8.5 / 10", runtime: "24 mins per ep",
        genresText: "Action, Adventure, Fantasy, System",
        synopsis: "Season 2 of Solo Leveling. The second season of Solo Leveling. Mastering his new abilities in secret, Jin-U must battle humanity's toughest foes to save his mother."
    },
    {
        id: "solo leveling", 
        title: "Solo Leveling -ReAwakening-",
        poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx184694-EmVoCuV4uAGv.png",
        page: "TTRS.html", 
        cc: "CC 1", mic: "", ep: "1", type: "Movie"
    },
    {
        id: "solo leveling", 
        title: "Solo Leveling",
        poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-it355ZgzquUd.png", 
        page: "solo-leveling.html", 
        cc: "CC 12", mic: "🎙️ 12", ep: "12", type: "TV",
        year: "2024", rating: "8.1 / 10", runtime: "24 mins per ep",
        genresText: "Action, Adventure, Fantasy, System",
        synopsis: "In a world where hunters must battle deadly monsters to protect mankind, Sung Jinwoo, notoriously known as the weakest hunter of all mankind, finds himself in a struggle for survival within a deadly double dungeon. After surviving, he awakens with a unique system overlay interface that allows him to level up without limits."
    },
    {
        id: "jujutsu kaisen", 
        title: "Jujutsu Kaisen",
        poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg",
        page: "jjk.html", 
        cc: "CC 24", mic: "🎙️ 24", ep: "24", type: "TV"
    },
    {
        id: "jujutsu kaisen", 
        title: "Jujutsu Kaisen 0",
        poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx131573-rpl82vDEDRm6.jpg",
        page: "jjk0.html", 
        cc: "CC 1", mic: "🎙️ 1", ep: "1", type: "Movie"
    },
    {
        id: "jujutsu kaisen", 
        title: "Jujutsu Kaisen Season 2",
        poster: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145064-hSNRJM03pvv1.jpg",
        page: "jjk0.html", 
        cc: "CC 1", mic: "🎙️ 23", ep: "23", type: "TV"
    },
];



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
}


async function displayContinueWatching() {
    const scrollerContainer = document.getElementById('scroller-rowContinueWatching');
    if (!scrollerContainer) return; 

    const history = JSON.parse(localStorage.getItem('anime_watch_history')) || [];
    scrollerContainer.innerHTML = '';

    if (history.length === 0) {
        scrollerContainer.innerHTML = '<p style="color:#71717a; padding:10px;">No recently watched shows found.</p>';
        return;
    }

    history.forEach(item => {
        let correctPosterImage = item.poster;
        const matchedAnime = MY_ANIME_DATABASE.find(a => String(a.id) === String(item.id) || a.title.toLowerCase() === item.title.toLowerCase());
        if (matchedAnime) correctPosterImage = matchedAnime.poster;

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


// JOB 4: SEARCH BAR LOGIC WITH AUTO-INJECTION
function initAnimeSearch() {
    const searchBar = document.getElementById('animeSearchBox');
    if (!searchBar) return;

    const gridContainer = document.getElementById('animeMainGrid');

    searchBar.addEventListener('input', (event) => {
        
        const searchRawText = event.target.value.toLowerCase().trim();
        const searchWords = searchRawText.split(/\s+/).filter(word => word.length > 0);
        
        const allAnimeCards = document.querySelectorAll('.anime-card');

        
        const printedTitlesInThisPass = new Set();

        
        allAnimeCards.forEach(card => {
            const parentBlock = card.parentElement;
            if (parentBlock) {
                if (parentBlock.classList.contains('injected-hidden-card-wrapper')) return;

                const titleElement = parentBlock.querySelector('h4');
                if (titleElement) {
                    const animeTitle = titleElement.textContent.toLowerCase().trim();
                    
                    
                    const matchesAllWords = searchWords.every(word => animeTitle.includes(word));

                    if (searchWords.length === 0 || matchesAllWords) {
                        parentBlock.classList.remove('cw-hide-card');
                        printedTitlesInThisPass.add(animeTitle); 
                    } else {
                        parentBlock.classList.add('cw-hide-card');
                    }
                }
            }
        });

        
        document.querySelectorAll('.injected-hidden-card-wrapper').forEach(el => el.remove());

        
        if (searchWords.length > 0 && gridContainer) {
            MY_ANIME_DATABASE.forEach(anime => {
                const animeTitle = anime.title.toLowerCase().trim();
                
                
                const matchFound = searchWords.every(word => animeTitle.includes(word));
                
                
                const isAlreadyOnScreen = printedTitlesInThisPass.has(animeTitle);

                if (matchFound && !isAlreadyOnScreen) {
                    printedTitlesInThisPass.add(animeTitle); 

                    const dubBadgeHtml = anime.mic 
                        ? `<span style="background-color: #9d2a2a; color: white; padding: 2px 3px; border-radius: 2px; flex-shrink: 0;">${anime.mic}</span>` 
                        : '';

                    const dynamicCardHtml = `
                        <div class="injected-hidden-card-wrapper" style="width: 160px; flex-shrink: 0; text-align: left; box-sizing: border-box;">
                            <div class="anime-card" style="position: relative; overflow: hidden; border-radius: 4px; background-color: #122038; padding: 0 0 8px 0;">
                                <a href="${anime.page}?id=${anime.id}"> 
                                    <img src="${anime.poster}" style="width: 100%; height: 220px; object-fit: cover; display: block;">
                                </a>
                                <div style="display: flex; gap: 3px; margin: 10px 4px 0 4px; font-size: 10px; font-weight: bold; color: #a0aec0; align-items: center; justify-content: flex-start;">
                                    <span style="background-color: #0a749d; color: white; padding: 2px 3px; border-radius: 2px; flex-shrink: 0;">${anime.cc || ""}</span>
                                    ${dubBadgeHtml}
                                    <span style="background-color: #2d3748; color: white; padding: 2px 3px; border-radius: 2px; flex-shrink: 0;">${anime.ep || ""}</span>
                                    <span style="margin-left: auto; color:#7f8fa4; flex-shrink: 0; font-size: 10px;">${anime.type || ""}</span>
                                </div>
                            </div> 
                            <h4 style="margin: 6px 0 0 0; font-size: 11px; font-weight: bold; color: white; font-family: sans-serif; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                <a href="${anime.page}?id=${anime.id}" style="color: inherit; text-decoration: none;">${anime.title}</a>
                            </h4>
                        </div>
                    `;
                    gridContainer.insertAdjacentHTML('beforeend', dynamicCardHtml);
                }
            });
        }
    });
}













// ==========================================
// AUTOMATION BOOTLOADER MANAGER
// ==========================================
function startAllFeatures() {
    displayContinueWatching();
    initAnimeSearch();
    loadWatchPageMetadata();

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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAllFeatures);
} else {
    startAllFeatures();
}
