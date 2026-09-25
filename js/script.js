console.log('Lets write JavaScript');
let currentSong = new Audio();
let songs;
let currFolder;

const defaultAlbums = {
    "cs": {
        title: "Copyright Songs",
        description: "Cover Songs for you",
        songs: ["Tera_Hone_Laga_Hoon_.m4a"]
    },
    "Dark_(mood)": {
        title: "Dark Horse",
        description: "Dark Songs for you",
        songs: []
    },
    "Diljit": {
        title: "Diljit Dosanjh",
        description: "Diljit Dosanjh hits",
        songs: []
    },
    "Funky_(mood)": {
        title: "Go Funky",
        description: "Lets go Funky",
        songs: []
    },
    "karan aujla": {
        title: "Karan Aujla",
        description: "Karan Aujla for you",
        songs: []
    },
    "Love_(mood)": {
        title: "I Love You",
        description: "Love is in the air",
        songs: []
    },
    "ncs": {
        title: "Sleep Songs",
        description: "Songs for you",
        songs: ["teri_meri_kahani.mp3"]
    },
    "Uplifting_(mood)": {
        title: "Get up",
        description: "You can do it!",
        songs: []
    }
};

function secondsToMinutesSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    songs = [];

    // 1. Try to fetch songs from info.json
    try {
        let res = await fetch(`${folder}/info.json`);
        if (res.ok) {
            let info = await res.json();
            if (Array.isArray(info.songs) && info.songs.length > 0) {
                songs = info.songs;
            }
        }
    } catch (e) {
        console.warn("Could not read songs from info.json", e);
    }

    // 2. If info.json didn't provide songs, try directory listing (Apache / server indexing)
    if (songs.length === 0) {
        try {
            let a = await fetch(`${folder}/`);
            if (a.ok) {
                let response = await a.text();
                let div = document.createElement("div");
                div.innerHTML = response;
                let as = div.getElementsByTagName("a");
                for (let index = 0; index < as.length; index++) {
                    const element = as[index];
                    let href = element.href;
                    if (href.endsWith(".mp3") || href.endsWith(".m4a") || href.endsWith(".wav") || href.endsWith(".ogg")) {
                        let parts = href.split(`${folder}/`);
                        let songName = parts.length > 1 ? parts[1] : href.split("/").pop();
                        songName = decodeURIComponent(songName.split("?")[0]);
                        if (songName && !songs.includes(songName)) {
                            songs.push(songName);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn("Directory listing fetch failed", e);
        }
    }

    // 3. Fallback to defaultAlbums if available
    if (songs.length === 0) {
        let folderKey = folder.replace(/^songs\//, "");
        if (defaultAlbums[folderKey] && defaultAlbums[folderKey].songs) {
            songs = [...defaultAlbums[folderKey].songs];
        }
    }

    // Show all the songs in the playlist
    let songUL = document.querySelector(".songList").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";

    if (songs.length === 0) {
        songUL.innerHTML = `<li style="justify-content:center; color:#888;">No songs found in this album</li>`;
        return songs;
    }

    for (const song of songs) {
        let cleanName = decodeURIComponent(song).replace(/\.(mp3|m4a|wav|ogg)$/i, "").replaceAll("_", " ");
        songUL.innerHTML += `<li><img class="invert" width="34" src="img/music.svg" alt="">
                            <div class="info">
                                <div>${cleanName}</div>
                                <div>Song</div>
                            </div>
                            <div class="playnow">
                                <span>Play Now</span>
                                <img class="invert" src="img/play.svg" alt="">
                            </div> </li>`;
    }

    // Attach an event listener to each song
    Array.from(document.querySelector(".songList").getElementsByTagName("li")).forEach((e, idx) => {
        e.addEventListener("click", () => {
            if (songs[idx]) {
                playMusic(songs[idx]);
            }
        });
    });

    return songs;
}

const playMusic = (track, pause = false) => {
    if (!track) return;
    currentSong.src = `${currFolder}/` + track;
    let playBtn = document.getElementById("play");
    if (!pause) {
        currentSong.play();
        if (playBtn) playBtn.src = "img/pause.svg";
    }
    let displayName = decodeURIComponent(track).replace(/\.(mp3|m4a|wav|ogg)$/i, "").replaceAll("_", " ");
    document.querySelector(".songinfo").innerHTML = displayName;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
}

async function displayAlbums() {
    console.log("displaying albums");
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    let folders = [];

    // 1. Try to fetch albums list from songs/albums.json
    try {
        let res = await fetch("songs/albums.json");
        if (res.ok) {
            folders = await res.json();
        }
    } catch (e) {
        console.log("albums.json not found, attempting directory scraping...");
    }

    // 2. If albums.json not available, try Apache-style directory scraping
    if (!folders || folders.length === 0) {
        try {
            let a = await fetch("songs/");
            if (a.ok) {
                let response = await a.text();
                let div = document.createElement("div");
                div.innerHTML = response;
                let anchors = div.getElementsByTagName("a");
                for (let index = 0; index < anchors.length; index++) {
                    const e = anchors[index];
                    let href = e.getAttribute("href") || e.href;
                    if (
                        href &&
                        !href.includes(".htaccess") &&
                        !href.startsWith("?") &&
                        !href.startsWith("#") &&
                        !href.includes("Parent Directory")
                    ) {
                        let cleanHref = href.replace(/\/$/, "");
                        let folderName = cleanHref.split("/").pop();
                        folderName = decodeURIComponent(folderName);
                        if (folderName && folderName !== "songs" && !folders.includes(folderName)) {
                            folders.push(folderName);
                        }
                    }
                }
            }
        } catch (e) {
            console.log("Directory scraping failed:", e);
        }
    }

    // 3. Fallback list so albums always render even without server indexing
    if (!folders || folders.length === 0) {
        folders = [
            "cs",
            "Dark_(mood)",
            "Diljit",
            "Funky_(mood)",
            "karan aujla",
            "Love_(mood)",
            "ncs",
            "Uplifting_(mood)"
        ];
    }

    // Render cards for each album
    for (let index = 0; index < folders.length; index++) {
        const folder = decodeURIComponent(folders[index]);
        let albumTitle = defaultAlbums[folder] ? defaultAlbums[folder].title : folder.replaceAll("_", " ");
        let albumDesc = defaultAlbums[folder] ? defaultAlbums[folder].description : "Spotify Playlist";

        try {
            let a = await fetch(`songs/${encodeURIComponent(folder)}/info.json`);
            if (a.ok) {
                let info = await a.json();
                albumTitle = info.title || albumTitle;
                albumDesc = info.description || albumDesc;
            }
        } catch (err) {
            console.warn(`Could not load info.json for ${folder}:`, err);
        }

        cardContainer.innerHTML += `
        <div data-folder="${folder}" class="card">
            <div class="play">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                    xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 20V4L19 12L5 20Z" stroke="#141B34" fill="#000" stroke-width="1.5"
                        stroke-linejoin="round" />
                </svg>
            </div>
            <img src="songs/${encodeURIComponent(folder)}/cover.jpg" onerror="this.onerror=null; this.src='img/cover.jpg';" alt="${albumTitle}">
            <h2>${albumTitle}</h2>
            <p>${albumDesc}</p>
        </div>`;
    }

    // Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            let clickedFolder = item.currentTarget.dataset.folder;
            console.log("Fetching Songs for folder:", clickedFolder);
            songs = await getSongs(`songs/${clickedFolder}`);
            if (songs && songs.length > 0) {
                playMusic(songs[0]);
            }
        });
    });
}

// Helper to find index of currently playing song
function getCurrentSongIndex() {
    if (!currentSong.src || !songs || songs.length === 0) return -1;
    let currentFilename = decodeURIComponent(currentSong.src.split("/").pop());
    return songs.findIndex(s => decodeURIComponent(s) === currentFilename);
}

async function main() {
    let play = document.getElementById("play");
    let previous = document.getElementById("previous");
    let next = document.getElementById("next");

    // 1. Display all albums first so the UI is ready
    await displayAlbums();

    // 2. Load the default album playlist
    await getSongs("songs/ncs");
    if (songs && songs.length > 0) {
        playMusic(songs[0], true);
    }

    // Attach event listener to play/pause button
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Listen for timeupdate event
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinutesSeconds(currentSong.currentTime)} / ${secondsToMinutesSeconds(currentSong.duration)}`;
        if (!isNaN(currentSong.duration) && currentSong.duration > 0) {
            document.querySelector(".circle").style.left = (currentSong.currentTime / currentSong.duration) * 100 + "%";
        }
    });

    // Add event listener to seekbar (fixed jump bug when clicking circle)
    document.querySelector(".seekbar").addEventListener("click", e => {
        let seekbar = document.querySelector(".seekbar");
        let rect = seekbar.getBoundingClientRect();
        let percent = ((e.clientX - rect.left) / rect.width) * 100;
        percent = Math.max(0, Math.min(100, percent));
        document.querySelector(".circle").style.left = percent + "%";
        if (!isNaN(currentSong.duration) && currentSong.duration > 0) {
            currentSong.currentTime = (currentSong.duration * percent) / 100;
        }
    });

    // Hamburger menu toggle
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    // Close button for left drawer
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-120%";
    });

    // Previous song button
    previous.addEventListener("click", () => {
        currentSong.pause();
        let index = getCurrentSongIndex();
        if (index > 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next song button
    next.addEventListener("click", () => {
        currentSong.pause();
        let index = getCurrentSongIndex();
        if (index !== -1 && index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Auto-play next song when current track ends
    currentSong.addEventListener("ended", () => {
        let index = getCurrentSongIndex();
        if (index !== -1 && index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            play.src = "img/play.svg";
        }
    });

    // Volume control slider
    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", e => {
        console.log("Setting volume to", e.target.value, "/ 100");
        currentSong.volume = parseInt(e.target.value) / 100;
        if (currentSong.volume > 0) {
            document.querySelector(".volume>img").src = document.querySelector(".volume>img").src.replace("mute.svg", "volume.svg");
        }
    });

    // Mute/unmute button
    document.querySelector(".volume>img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg");
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        } else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg");
            currentSong.volume = 0.1;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    });
}

main(); 