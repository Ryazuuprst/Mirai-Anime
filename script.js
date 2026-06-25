// ==========================================
// JOB 1: COMMITTING ENTRIES TO LOCALSTORAGE
// ==========================================
function saveWatchProgress(animeId, animeTitle, epNum, posterUrl) {
    let history = JSON.parse(localStorage.getItem('anime_watch_history')) || [];
    history = history.filter(item => item.id !== animeId);

    // Dynamically captures the exact file name the user is on (e.g., "watch.html" or "horimiya.html")
    const currentFileName = window.location.pathname.split("/").pop() || "watch.html";

    const watchEntry = {
        id: animeId,
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
// JOB 2: PRINTING GENERATED CARDS ON HOMEPAGE
// ==========================================
function displayContinueWatching() {
    const scrollerContainer = document.getElementById('scroller-rowContinueWatching');
    if (!scrollerContainer) return; 

    const history = JSON.parse(localStorage.getItem('anime_watch_history')) || [];
    scrollerContainer.innerHTML = '';

    if (history.length === 0) {
        scrollerContainer.innerHTML = '<p style="color:#71717a; padding:10px;">No recently watched shows found.</p>';
        return;
    }

    history.forEach(item => {
        // Generates completely unique links routing back to specific custom pages dynamically
        const cardHtml = `
            <a href="${item.page}?id=${item.id}&ep=${item.episode}" class="cw-card" style="text-decoration: none; display: block;">
                <button class="cw-remove-btn" onclick="event.preventDefault(); event.stopPropagation(); cwRemoveEntry('${item.id}', event)" title="Remove">X</button>
                <div class="cw-thumb-wrapper">
                    <img class="cw-card-thumb" src="${item.poster}" alt="${item.title}" loading="lazy" onerror="this.src='https://anilist.co'">
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
function cwRemoveEntry(animeId, event) {
    const card = event.target.closest('.cw-card');
    if (card) {
        card.style.transition = "all 0.3s ease";
        card.style.opacity = "0";
        card.style.transform = "scale(0.9)";
        
        setTimeout(() => {
            card.remove();
            let history = JSON.parse(localStorage.getItem('anime_watch_history')) || [];
            history = history.filter(item => item.id !== animeId);
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




const slider = document.querySelector('.scroller-container');
let isDown = false;
let startX;
let scrollLeft;

slider.addEventListener('mousedown', (e) => {
    isDown = true;
    slider.classList.add('active');
    // Get exact mouse position relative to container
    startX = e.pageX - slider.offsetLeft;
    scrollLeft = slider.scrollLeft;
});

slider.addEventListener('mouseleave', () => {
    isDown = false;
});

slider.addEventListener('mouseup', () => {
    isDown = false;
});

slider.addEventListener('mousemove', (e) => {
    if (!isDown) return; // Stop the function from running if mouse isn't clicked
    e.preventDefault();
    const x = e.pageX - slider.offsetLeft;
    // Multiplied by 2 for faster, smoother scrolling
    const walk = (x - startX) * 2; 
    slider.scrollLeft = scrollLeft - walk;
});
