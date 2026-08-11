// main.js


let player;
let isPlaying = false;
let progressInterval;

// DOM Elements
const btnPlayPause = document.getElementById('btn-play-pause');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');
const albumArtImg = document.getElementById('album-art-img');
const albumArtWrapper = document.getElementById('album-art-wrapper');
const timeCurrent = document.getElementById('time-current');
const timeTotal = document.getElementById('time-total');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressContainer = document.getElementById('progress-container');
const busListContainer = document.getElementById('bus-list');
const mainTitle = document.getElementById('main-title');
const routeStart = document.getElementById('route-start');
const routeEnd = document.getElementById('route-end');
const btnFullscreen = document.getElementById('btn-fullscreen');
const iconFsEnter = document.getElementById('icon-fs-enter');
const iconFsExit = document.getElementById('icon-fs-exit');
const btnHonk = document.getElementById('btn-honk');
const btnBell = document.getElementById('btn-bell');

const hornAudio = new Audio('/Bus_Horn.mp3');
btnHonk.addEventListener('click', () => {
  hornAudio.currentTime = 0;
  hornAudio.play().catch(e => console.log('Horn play failed:', e));
});

const startAudio = new Audio('/start.mp3');
const stopAudio = new Audio('/stop.mp3');
let bellClickTimer = null;

function handleBellPress() {
  if (bellClickTimer) {
    clearTimeout(bellClickTimer);
    bellClickTimer = null;
    startAudio.currentTime = 0;
    startAudio.play().catch(e => console.log('Start play failed:', e));
  } else {
    bellClickTimer = setTimeout(() => {
      bellClickTimer = null;
      stopAudio.currentTime = 0;
      stopAudio.play().catch(e => console.log('Stop play failed:', e));
    }, 250);
  }
}

btnBell.addEventListener('click', handleBellPress);

// Fullscreen Logic
btnFullscreen.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.log(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    document.exitFullscreen();
  }
});

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    iconFsEnter.style.display = 'none';
    iconFsExit.style.display = 'block';
  } else {
    iconFsEnter.style.display = 'block';
    iconFsExit.style.display = 'none';
  }
});

const busData = [
  // Malabar Region
  { id: "MAYILVAHANAM", name: "മയിൽവാഹനം", start: "പാലക്കാട്", end: "ഷൊർണൂർ" },
  { id: "RAJADHANI", name: "രാജധാനി", start: "കോഴിക്കോട്", end: "കണ്ണൂർ" },
  { id: "ASMA", name: "അസ്മ", start: "മലപ്പുറം", end: "കോഴിക്കോട്" },
  { id: "KAVITHA", name: "കവിത", start: "വടകര", end: "കോഴിക്കോട്" },
  { id: "GHAT_RIDER", name: "ഘട്ട് റൈഡർ", start: "കോഴിക്കോട്", end: "സുൽത്താൻ ബത്തേരി" },
  { id: "CHIRAYATH", name: "ചിറയത്ത്", start: "ഗുരുവായൂർ", end: "കുന്നംകുളം" },
  // Central Kerala
  { id: "KALAPPURACKAL", name: "കളപ്പുരയ്ക്കൽ", start: "കോട്ടയം", end: "കട്ടപ്പന" },
  { id: "SREE KRISHNA", name: "ശ്രീകൃഷ്ണ", start: "തൃശൂർ", end: "ഗുരുവായൂർ" },
  { id: "KCT", name: "കെ.സി.ടി", start: "കോട്ടയം", end: "എറണാകുളം" },
  { id: "PUTHENKANDATHIL", name: "പുത്തൻകണ്ടത്തിൽ", start: "ചങ്ങനാശ്ശേരി", end: "ഗുരുവായൂർ" },
  { id: "CHOTTANIKKARA_AMMA", name: "ചോറ്റാനിക്കര അമ്മ", start: "ചോറ്റാനിക്കര", end: "ആലുവ" },
  { id: "KK_MENON", name: "കെ.കെ മേനോൻ", start: "തൃശൂർ", end: "കൊടുങ്ങല്ലൂർ" },
  // South Kerala
  { id: "SARANYA", name: "ശരണ്യ", start: "കടയ്ക്കൽ", end: "എറണാകുളം" },
  { id: "VALIYAPARAMBIL", name: "വലിയപറമ്പിൽ", start: "ആലപ്പുഴ", end: "ചങ്ങങ്കരി" },
  { id: "EVERGREEN", name: "എവർഗ്രീൻ", start: "പത്തനംതിട്ട", end: "കൊല്ലം" }
];

// Set initial bus info immediately on load
const savedBusId = localStorage.getItem('selectedBus') || busData[0].id;
const savedBus = busData.find(b => b.id === savedBusId) || busData[0];
mainTitle.textContent = savedBus.name;
routeStart.textContent = savedBus.start;
routeEnd.textContent = savedBus.end;

let songsData = {};

Promise.all([
  fetch('/songs.json').then(res => res.json()),
  new Promise(resolve => {
    if (window.YT && window.YT.Player) {
      resolve();
    } else {
      window.onYouTubeIframeAPIReady = resolve;
    }
  })
]).then(([data]) => {
  songsData = data;
  
  const savedBusId = localStorage.getItem('selectedBus') || busData[0].id;
  const savedSong = localStorage.getItem('lastPlayedSong');
  const playlist = songsData[savedBusId] || [];
  
  let initialVideoId = playlist.length > 0 ? playlist[0].id : '';
  if (savedSong && playlist.some(s => s.id === savedSong)) {
    initialVideoId = savedSong;
  }
  
  player = new YT.Player('youtube-player', {
    height: '10',
    width: '10',
    videoId: initialVideoId,
    playerVars: {
      'playsinline': 1,
      'controls': 0,
      'disablekb': 1,
      'fs': 0,
      'rel': 0
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}).catch(e => console.error("Initialization error:", e));

function onPlayerReady(event) {
  // Enable UI controls
  btnPlayPause.disabled = false;
  
  // Set initial info
  updateTrackInfo();
  
  // Event listeners
  btnPlayPause.addEventListener('click', togglePlayPause);
  btnPrev.addEventListener('click', () => player.previousVideo());
  btnNext.addEventListener('click', () => player.nextVideo());
  
  // Basic seeking
  progressContainer.addEventListener('click', (e) => {
    if(!player || !player.getDuration) return;
    const rect = progressContainer.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTo = percent * player.getDuration();
    player.seekTo(seekTo, true);
  });
  
  // Populate bus list dynamically
  busData.forEach(bus => {
    const btn = document.createElement('button');
    btn.className = 'bus-option';
    btn.textContent = `${bus.name} (${bus.start} - ${bus.end})`;
    
    btn.addEventListener('click', () => {
      mainTitle.textContent = bus.name;
      routeStart.textContent = bus.start;
      routeEnd.textContent = bus.end;
      
      localStorage.setItem('selectedBus', bus.id);
      
      const playlist = songsData[bus.id] || [];
      const playlistIds = playlist.map(s => s.id);
      if (playlistIds.length > 0) {
        player.loadPlaylist(playlistIds, 0, 0);
      }
    });
    
    busListContainer.appendChild(btn);
  });
  
  // Restore state
  setTimeout(() => {
    const savedBusId = localStorage.getItem('selectedBus');
    const savedSong = localStorage.getItem('lastPlayedSong');
    
    if (savedBusId && songsData[savedBusId]) {
      const bus = busData.find(b => b.id === savedBusId);
      if (bus) {
        mainTitle.textContent = bus.name;
        routeStart.textContent = bus.start;
        routeEnd.textContent = bus.end;
      }
      
      const playlist = songsData[savedBusId];
      let index = 0;
      if (savedSong) {
        index = playlist.findIndex(s => s.id === savedSong);
        if (index === -1) index = 0;
      }
      const playlistIds = playlist.map(s => s.id);
      player.cuePlaylist(playlistIds, index, 0);
    }
  }, 200);
}

function onPlayerStateChange(event) {
  if (event.data === YT.PlayerState.PLAYING) {
    isPlaying = true;
    iconPlay.style.display = 'none';
    iconPause.style.display = 'block';
    
    updateTrackInfo(); // In case video changed
    
    const data = player.getVideoData();
    if (data && data.video_id) {
      localStorage.setItem('lastPlayedSong', data.video_id);
    }
    
    startProgressTracking();
  } else if (event.data === YT.PlayerState.PAUSED || event.data === YT.PlayerState.ENDED) {
    isPlaying = false;
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
    
    stopProgressTracking();
  }
}

function togglePlayPause() {
  if (!player) return;
  if (isPlaying) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

function updateTrackInfo() {
  if (!player || !player.getPlaylistIndex) return;
  const index = player.getPlaylistIndex();
  const currentBus = localStorage.getItem('selectedBus') || 'MAYILVAHANAM';
  
  if (songsData[currentBus] && songsData[currentBus][index]) {
    const songMeta = songsData[currentBus][index];
    trackTitle.textContent = songMeta.title;
    trackArtist.textContent = songMeta.artist;
    
    // Check if thumbnail is a valid image (not the empty gif from data.html)
    if (songMeta.thumbnail && !songMeta.thumbnail.startsWith('data:image/gif')) {
      // It's a low res thumb from the HTML, replace with high res if possible
      // Actually YouTube Music thumbnails are decent, let's just use maxres fallback for better quality
      albumArtImg.src = `https://img.youtube.com/vi/${songMeta.id}/maxresdefault.jpg`;
      albumArtImg.onerror = function() {
        albumArtImg.src = songMeta.thumbnail || `https://img.youtube.com/vi/${songMeta.id}/hqdefault.jpg`;
      };
    } else {
      albumArtImg.src = `https://img.youtube.com/vi/${songMeta.id}/maxresdefault.jpg`;
      albumArtImg.onerror = function() {
        albumArtImg.src = `https://img.youtube.com/vi/${songMeta.id}/hqdefault.jpg`;
      };
    }
  } else {
    // Fallback if data is missing
    const data = player.getVideoData && player.getVideoData();
    if (data && data.title) {
      trackTitle.textContent = data.title;
      trackArtist.textContent = data.author || 'Kerala Private Bus Mix';
      albumArtImg.src = `https://img.youtube.com/vi/${data.video_id}/maxresdefault.jpg`;
      albumArtImg.onerror = function() {
        albumArtImg.src = `https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`;
      };
    }
  }
}

function startProgressTracking() {
  progressInterval = setInterval(() => {
    if (!player || !player.getCurrentTime) return;
    const current = player.getCurrentTime();
    const duration = player.getDuration();
    
    timeCurrent.textContent = formatTime(current);
    timeTotal.textContent = formatTime(duration);
    
    const percent = (current / duration) * 100;
    progressBarFill.style.width = `${percent}%`;
  }, 1000);
}

function stopProgressTracking() {
  clearInterval(progressInterval);
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60);
  return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

// Key bindings
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  const key = e.key.toLowerCase();
  
  if (key === 'x') {
    btnHonk.click();
  } else if (key === 'b') {
    btnBell.click();
  } else if (key === 'p') {
    document.getElementById('btn-play-pause').click();
  } else if (key === 'f') {
    btnFullscreen.click();
  } else if (key === 'j') {
    document.getElementById('btn-next').click();
  } else if (key === 'k') {
    document.getElementById('btn-prev').click();
  } else if (key === 'n') {
    const currentId = localStorage.getItem('selectedBus') || busData[0].id;
    const currentIndex = busData.findIndex(b => b.id === currentId);
    let nextIndex = (currentIndex + 1) % busData.length;
    if (nextIndex < 0) nextIndex = 0;
    
    const nextBus = busData[nextIndex];
    
    mainTitle.textContent = nextBus.name;
    routeStart.textContent = nextBus.start;
    routeEnd.textContent = nextBus.end;
    
    localStorage.setItem('selectedBus', nextBus.id);
    
    const playlist = songsData[nextBus.id] || [];
    const playlistIds = playlist.map(s => s.id);
    if (playlistIds.length > 0 && player && player.loadPlaylist) {
      player.loadPlaylist(playlistIds, 0, 0);
    }
  }
});
