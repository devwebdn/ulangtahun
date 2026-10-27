/* ============================================================
   script.js — Birthday Website Logic, Polyphonic Synthesizer,
   Interactive Candle Blowing Simulation & Button Navigation
   ============================================================ */

'use strict';

// ===================================================================
// GLOBAL STATE & DATA
// ===================================================================
let currentPage = 0;
const totalPages = 5;
let isTransitioning = false;

const pageTitles = [
  'Pembuka Istimewa 🌸',
  'Tiup Lilin & HBD 🎂',
  'Harapan & Doa 🌙',
  'Kenangan Indah 📸',
  'Surat Cinta & Bunga 💌'
];

// Audio State
let audioCtx = null;
let currentTrackIndex = 0;
let isMusicPlaying = false;
let activeOscillators = [];
let songTimeoutId = null;
let masterGainNode = null;

// Microphone Blow Detection State
let micStream = null;
let micAudioCtx = null;
let micAnalyser = null;
let micRafId = null;
let isMicListening = false;

// Candle State (3 candles: 0, 1, 2)
let candleStates = [true, true, true];
let holdBlowInterval = null;
let holdProgress = 0;

// Particle & animation intervals
let petalInterval = null;
let heartInterval = null;
let sparkleAnimations = [];

// ===================================================================
// NOTE FREQUENCIES FOR WEB AUDIO
// ===================================================================
const N = {
  REST: 0,
  C3: 130.81, CS3: 138.59, D3: 146.83, DS3: 155.56, E3: 164.81, F3: 174.61, FS3: 185.00, G3: 196.00, GS3: 207.65, A3: 220.00, AS3: 233.08, B3: 246.94,
  C4: 261.63, CS4: 277.18, D4: 293.66, DS4: 311.13, E4: 329.63, F4: 349.23, FS4: 369.99, G4: 392.00, GS4: 415.30, A4: 440.00, AS4: 466.16, B4: 493.88,
  C5: 523.25, CS5: 554.37, D5: 587.33, DS5: 622.25, E5: 659.25, F5: 698.46, FS5: 739.99, G5: 783.99, GS5: 830.61, A5: 880.00, AS5: 932.33, B5: 987.77,
  C6: 1046.50
};

// ===================================================================
// PLAYLIST SONGS CATALOG
// ===================================================================
const PLAYLIST = [
  {
    id: 0,
    title: 'Happy Birthday To You 🎂',
    artist: 'Lagu Ulang Tahun Ceria',
    desc: 'Melodi klasik ulang tahun dengan aransemen ceria, hangat, dan bersemangat',
    icon: '🎂',
    bpm: 108,
    // [melodyNote, beats, chordNotes[]]
    notes: [
      [N.C4, 0.75, [N.C3, N.G3, N.C4]],
      [N.C4, 0.25, []],
      [N.D4, 1.0, [N.C3, N.G3]],
      [N.C4, 1.0, [N.E3, N.G3]],
      [N.F4, 1.0, [N.F3, N.A3, N.C4]],
      [N.E4, 2.0, [N.C3, N.E3, N.G3]],

      [N.C4, 0.75, [N.C3, N.G3]],
      [N.C4, 0.25, []],
      [N.D4, 1.0, [N.G3, N.B3, N.D4]],
      [N.C4, 1.0, [N.G3, N.B3]],
      [N.G4, 1.0, [N.G3, N.B3, N.D4]],
      [N.F4, 2.0, [N.F3, N.A3, N.C4]],

      [N.C4, 0.75, [N.F3, N.A3]],
      [N.C4, 0.25, []],
      [N.C5, 1.0, [N.F3, N.C4, N.F4]],
      [N.A4, 1.0, [N.D3, N.F3, N.A3]],
      [N.F4, 1.0, [N.AS3, N.D4, N.F4]],
      [N.E4, 1.0, [N.C3, N.G3, N.C4]],
      [N.D4, 1.0, [N.AS3, N.D4]],

      [N.AS4, 0.75, [N.AS3, N.D4, N.F4]],
      [N.AS4, 0.25, []],
      [N.A4, 1.0, [N.F3, N.A3, N.C4]],
      [N.F4, 1.0, [N.C3, N.E3, N.G3]],
      [N.G4, 1.0, [N.C3, N.G3, N.C4]],
      [N.F4, 2.5, [N.F3, N.A3, N.C4, N.F4]]
    ]
  },
  {
    id: 1,
    title: "Can't Help Falling in Love 💖",
    artist: 'Balada Romantis Lembut',
    desc: 'Alunan piano lembut nan puitis, mengiringi suasana hati yang penuh rasa sayang',
    icon: '💖',
    bpm: 76,
    notes: [
      // "Wise men say..."
      [N.C4, 1.5, [N.C3, N.G3, N.E4]],
      [N.G4, 1.5, [N.E3, N.G3]],
      [N.A4, 2.0, [N.A3, N.C4, N.E4]],
      [N.REST, 0.5, []],
      // "Only fools rush in..."
      [N.F4, 1.0, [N.F3, N.A3, N.C4]],
      [N.E4, 1.0, [N.C3, N.E3]],
      [N.D4, 1.5, [N.G3, N.B3, N.D4]],
      [N.C4, 2.0, [N.C3, N.G3, N.E4]],
      [N.REST, 0.5, []],
      // "But I can't help..."
      [N.E4, 1.0, [N.E3, N.G3, N.B3]],
      [N.G4, 1.0, [N.A3, N.C4, N.E4]],
      [N.C5, 2.0, [N.F3, N.A3, N.C4]],
      [N.B4, 1.0, [N.G3, N.B3, N.D4]],
      // "Falling in love with you..."
      [N.A4, 1.0, [N.A3, N.C4, N.E4]],
      [N.G4, 1.0, [N.E3, N.G3, N.B3]],
      [N.F4, 1.5, [N.F3, N.A3, N.C4]],
      [N.E4, 1.0, [N.C3, N.E3]],
      [N.D4, 1.5, [N.G3, N.B3, N.D4]],
      [N.C4, 3.0, [N.C3, N.G3, N.C4, N.E4]]
    ]
  },
  {
    id: 2,
    title: 'A Thousand Years ✨',
    artist: 'Melodi Cinta Abadi',
    desc: 'Melodi haru yang menggambarkan rasa syukur dan cinta tanpa henti untukmu',
    icon: '✨',
    bpm: 82,
    notes: [
      // "Heart beats fast..."
      [N.AS4, 1.0, [N.AS3, N.F3, N.D4]],
      [N.A4, 1.0, [N.F3, N.C4]],
      [N.F4, 2.0, [N.D3, N.A3, N.F4]],
      [N.REST, 0.5, []],
      // "Colors and promises..."
      [N.F4, 1.0, [N.AS3, N.D4]],
      [N.G4, 1.0, [N.F3, N.C4]],
      [N.A4, 1.5, [N.D3, N.A3, N.F4]],
      [N.F4, 2.0, [N.AS3, N.F4]],
      [N.REST, 0.5, []],
      // "How to be brave..."
      [N.F4, 1.0, [N.C3, N.G3, N.E4]],
      [N.G4, 1.0, [N.D3, N.A3, N.F4]],
      [N.A4, 1.5, [N.AS3, N.D4, N.F4]],
      [N.F4, 2.0, [N.F3, N.C4, N.A4]],
      // "I have loved you for a thousand years..."
      [N.F4, 0.75, [N.AS3, N.D4]],
      [N.G4, 0.75, [N.F3, N.C4]],
      [N.A4, 1.5, [N.D3, N.A3, N.F4]],
      [N.C5, 1.5, [N.C3, N.G3, N.E4]],
      [N.A4, 1.0, [N.AS3, N.D4, N.F4]],
      [N.G4, 1.0, [N.C3, N.G3, N.E4]],
      [N.F4, 3.0, [N.F3, N.C4, N.F4, N.A4]]
    ]
  },
  {
    id: 3,
    title: 'Kotak Musik Gemintang 🔔',
    artist: 'Melodi Lullaby & Harapan',
    desc: 'Dentingan manis seperti kotak musik dongeng, penuh ketenangan dan kedamaian',
    icon: '🔔',
    bpm: 96,
    notes: [
      [N.C5, 1.0, [N.C4, N.G4]],
      [N.C5, 1.0, []],
      [N.G5, 1.0, [N.E4, N.B4]],
      [N.G5, 1.0, []],
      [N.A5, 1.0, [N.F4, N.C5]],
      [N.A5, 1.0, []],
      [N.G5, 2.0, [N.C4, N.E4, N.G4]],

      [N.F5, 1.0, [N.D4, N.A4]],
      [N.F5, 1.0, []],
      [N.E5, 1.0, [N.C4, N.G4]],
      [N.E5, 1.0, []],
      [N.D5, 1.0, [N.G3, N.D4, N.B4]],
      [N.D5, 1.0, []],
      [N.C5, 2.0, [N.C4, N.E4, N.G4, N.C5]],

      [N.G5, 1.0, [N.E4, N.C5]],
      [N.G5, 1.0, []],
      [N.F5, 1.0, [N.D4, N.B4]],
      [N.F5, 1.0, []],
      [N.E5, 1.0, [N.C4, N.A4]],
      [N.E5, 1.0, []],
      [N.D5, 2.0, [N.G3, N.D4, N.B4]],

      [N.C5, 1.0, [N.C4, N.G4]],
      [N.C5, 1.0, []],
      [N.G5, 1.0, [N.E4, N.B4]],
      [N.G5, 1.0, []],
      [N.A5, 1.0, [N.F4, N.C5]],
      [N.A5, 1.0, []],
      [N.G5, 2.0, [N.C4, N.E4, N.G4, N.C5]]
    ]
  },
  {
    id: 4,
    title: 'Panjang Umurnya 🎉',
    artist: 'Lagu Tradisi Ulang Tahun',
    desc: 'Lagu selamat ulang tahun penuh doa kesehatan, berkah, dan umur yang panjang',
    icon: '🎉',
    bpm: 114,
    notes: [
      // "Pan-jang u-mur-nya..."
      [N.C4, 0.75, [N.C3, N.G3]],
      [N.C4, 0.75, []],
      [N.C4, 0.75, [N.E3, N.C4]],
      [N.E4, 1.0, [N.C3, N.G3, N.C4]],
      [N.G4, 2.0, [N.C3, N.E3, N.G3]],

      // "Pan-jang u-mur-nya..."
      [N.G4, 0.75, [N.G3, N.B3]],
      [N.G4, 0.75, []],
      [N.G4, 0.75, [N.G3, N.D4]],
      [N.F4, 0.75, [N.G3, N.B3]],
      [N.E4, 0.75, [N.C3, N.G3]],
      [N.D4, 2.0, [N.G3, N.B3, N.D4]],

      // "Pan-jang u-mur-nya ser-ta mu-li-a..."
      [N.D4, 0.75, [N.G3, N.D4]],
      [N.D4, 0.75, []],
      [N.D4, 0.75, [N.G3, N.B3]],
      [N.F4, 1.0, [N.D3, N.A3, N.F4]],
      [N.A4, 1.5, [N.F3, N.C4, N.A4]],
      [N.G4, 1.0, [N.C3, N.E3, N.G3]],
      [N.F4, 1.0, [N.D3, N.F3]],
      [N.E4, 2.0, [N.C3, N.G3, N.C4]],

      // "Ser-ta mu-li-a... ser-ta mu-li-a..."
      [N.E4, 0.75, [N.C3, N.G3]],
      [N.F4, 0.75, [N.F3, N.A3, N.C4]],
      [N.G4, 2.0, [N.C3, N.E3, N.G3]],
      [N.A4, 1.0, [N.F3, N.A3, N.C4]],
      [N.G4, 1.0, [N.C3, N.E3, N.G3]],
      [N.F4, 1.0, [N.G3, N.B3, N.D4]],
      [N.E4, 1.0, [N.C3, N.E3, N.G3]],
      [N.D4, 1.5, [N.G3, N.B3, N.D4]],
      [N.C4, 2.5, [N.C3, N.G3, N.C4, N.E4]]
    ]
  }
];

// ===================================================================
// APPLICATION INIT & LOADING SCREEN
// ===================================================================
window.addEventListener('DOMContentLoaded', () => {
  const fill = document.getElementById('loadingFill');
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 20 + 8;
    if (progress >= 100) {
      progress = 100;
      clearInterval(interval);
      setTimeout(() => {
        const screen = document.getElementById('loadingScreen');
        if (screen) screen.classList.add('hidden');
        initApp();
      }, 400);
    }
    if (fill) fill.style.width = progress + '%';
  }, 100);
});

function initApp() {
  setupPageNavigation();
  setupFloatingParticles();
  setupSparkleCanvases();
  setupAudioEngine();
  setupCandleSimulation();
  setupLoveMeter();
  setupMemoryCards();

  // Set initial page view
  activatePage(0, 'next');

  // Start music automatically on first user interaction anywhere
  const startMusicOnFirstInteraction = () => {
    try {
      if (isMusicEnabled && !isMusicPlaying) {
        playPageSong(currentPage);
      }
    } catch (e) {
      console.warn('Audio note:', e);
    }
    document.removeEventListener('click', startMusicOnFirstInteraction);
    document.removeEventListener('keydown', startMusicOnFirstInteraction);
  };

  document.addEventListener('click', startMusicOnFirstInteraction, { once: true });
  document.addEventListener('keydown', startMusicOnFirstInteraction, { once: true });
}

// ===================================================================
// PAGE NAVIGATION VIA BUTTONS (NO SCROLLING PAGE TRANSITIONS)
// ===================================================================
function setupPageNavigation() {
  // Bottom Bar Navigation Buttons
  const prevBtn = document.getElementById('bottomPrevBtn');
  const nextBtn = document.getElementById('bottomNextBtn');

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentPage > 0) prevPage();
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (currentPage < totalPages - 1) {
        nextPage();
      } else {
        // If on the last page, restart to page 0
        goToPage(0);
      }
    });
  }

  // In-Page CTA Navigation Buttons
  const p1Btn = document.getElementById('page1NextBtn');
  const p2Btn = document.getElementById('page2NextBtn');
  const p3Btn = document.getElementById('page3NextBtn');
  const p4Btn = document.getElementById('page4NextBtn');
  const restartBtn = document.getElementById('restartBtn');

  if (p1Btn) p1Btn.addEventListener('click', () => nextPage());
  if (p2Btn) p2Btn.addEventListener('click', () => nextPage());
  if (p3Btn) p3Btn.addEventListener('click', () => nextPage());
  if (p4Btn) p4Btn.addEventListener('click', () => nextPage());
  if (restartBtn) restartBtn.addEventListener('click', () => goToPage(0));

  // Side Navigation Dots
  const dots = document.querySelectorAll('.dot');
  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const targetPage = parseInt(dot.getAttribute('data-page'), 10);
      if (!isNaN(targetPage)) goToPage(targetPage);
    });
  });

  // Keyboard navigation (Left / Right arrow keys only)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      nextPage();
    } else if (e.key === 'ArrowLeft') {
      prevPage();
    }
  });

  // NOTE: Wheel scroll listener for page switching has been completely
  // removed per the user's explicit request:
  // "ketika pindah halaman itu bukan scrol melainkan tombol pindah halaman"
}

function activatePage(index, direction = 'next') {
  if (isTransitioning) return;
  if (index < 0 || index >= totalPages) return;

  isTransitioning = true;
  const pages = document.querySelectorAll('.page');
  const prevPageEl = pages[currentPage];
  const nextPageEl = pages[index];

  if (prevPageEl && prevPageEl !== nextPageEl) {
    prevPageEl.classList.remove('active');
    prevPageEl.classList.add(direction === 'next' ? 'exit-left' : 'exit-right');
    setTimeout(() => {
      prevPageEl.classList.remove('exit-left', 'exit-right');
    }, 650);
  }

  if (nextPageEl) {
    nextPageEl.classList.add('active');
    nextPageEl.scrollTop = 0; // Scroll back to top inside the page
  }

  currentPage = index;
  updateBottomNavBar();
  updateNavDots();

  // >>> PUTAR MUSIK OTOMATIS SESUAI HALAMAN <<<
  if (isMusicEnabled) {
    playPageSong(currentPage);
  } else {
    updateMusicUIState(false);
  }

  // Page specific celebrations
  if (index === 1) {
    triggerConfetti(50);
  } else if (index === 4) {
    animateHeartBurst();
  }

  setTimeout(() => {
    isTransitioning = false;
  }, 650);
}

function goToPage(index) {
  if (index === currentPage) return;
  const direction = index > currentPage ? 'next' : 'prev';
  activatePage(index, direction);
}

function nextPage() {
  if (currentPage < totalPages - 1) {
    activatePage(currentPage + 1, 'next');
  }
}

function prevPage() {
  if (currentPage > 0) {
    activatePage(currentPage - 1, 'prev');
  }
}

function updateBottomNavBar() {
  const prevBtn = document.getElementById('bottomPrevBtn');
  const nextBtn = document.getElementById('bottomNextBtn');
  const numDisplay = document.getElementById('pageNumDisplay');
  const titleDisplay = document.getElementById('pageTitleDisplay');

  if (prevBtn) {
    prevBtn.disabled = currentPage === 0;
  }

  if (nextBtn) {
    const btnText = nextBtn.querySelector('.btn-text');
    const btnArrow = nextBtn.querySelector('.btn-arrow');
    if (currentPage === totalPages - 1) {
      if (btnText) btnText.textContent = 'Mulai Ulang';
      if (btnArrow) btnArrow.textContent = '🔄';
    } else {
      if (btnText) btnText.textContent = 'Selanjutnya';
      if (btnArrow) btnArrow.textContent = '➡️';
    }
  }

  if (numDisplay) {
    numDisplay.textContent = `Halaman ${currentPage + 1} dari ${totalPages}`;
  }

  if (titleDisplay) {
    titleDisplay.textContent = pageTitles[currentPage];
  }
}

function updateNavDots() {
  const dots = document.querySelectorAll('.dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === currentPage);
  });
}

// ===================================================================
// AUDIO ENGINE (Polyphonic Web Audio Synthesizer)
// ===================================================================
function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// ===================================================================
// AUDIO ENGINE (Per-Page Automatic Polyphonic Synthesizer)
// ===================================================================
let isMusicEnabled = true;

// Page to Song Mapping:
// Halaman 1 (Page 0): Can't Help Falling in Love (PLAYLIST[1]) - Sweet gentle romantic intro
// Halaman 2 (Page 1): Happy Birthday To You (PLAYLIST[0]) - Joyful birthday song & candle blow
// Halaman 3 (Page 2): Kotak Musik Gemintang (PLAYLIST[3]) - Peaceful music box for wishes
// Halaman 4 (Page 3): Panjang Umurnya (PLAYLIST[4]) - Classic celebration for memories
// Halaman 5 (Page 4): A Thousand Years (PLAYLIST[2]) - Heartfelt love ballad for love letter
const PAGE_TO_SONG_INDEX = [1, 0, 3, 4, 2];

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function setupAudioEngine() {
  const toggleBtn = document.getElementById('musicToggle');
  const scPlayBtn = document.getElementById('showcasePlayBtn');

  const toggleHandler = () => {
    if (isMusicPlaying) {
      isMusicEnabled = false;
      stopMusic();
    } else {
      isMusicEnabled = true;
      playPageSong(currentPage);
    }
  };

  if (toggleBtn) toggleBtn.addEventListener('click', toggleHandler);
  if (scPlayBtn) scPlayBtn.addEventListener('click', toggleHandler);
}

function playPageSong(pageIdx) {
  if (!isMusicEnabled) {
    updateMusicUIState(false);
    return;
  }
  const songIdx = PAGE_TO_SONG_INDEX[pageIdx] !== undefined ? PAGE_TO_SONG_INDEX[pageIdx] : 0;
  playTrack(songIdx);
}

function playTrack(index) {
  stopMusic();

  if (index < 0) index = 0;
  if (index >= PLAYLIST.length) index = 0;
  currentTrackIndex = index;

  const track = PLAYLIST[currentTrackIndex];
  const ctx = getAudioContext();

  isMusicPlaying = true;
  updateMusicUIState(true);

  // Master Gain for smooth volume
  masterGainNode = ctx.createGain();
  masterGainNode.gain.setValueAtTime(0, ctx.currentTime);
  masterGainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.3);
  masterGainNode.connect(ctx.destination);

  // Play the note sequence
  const beatSec = 60 / track.bpm;
  let startTime = ctx.currentTime + 0.1;

  track.notes.forEach(([melodyFreq, beats, chordFreqs]) => {
    const dur = beats * beatSec;
    const noteEnd = startTime + dur;

    // 1. Lead Melody Voice
    if (melodyFreq && Number.isFinite(melodyFreq) && melodyFreq > 0) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Soft tone selection per track
      if (track.id === 3) {
        osc.type = 'sine'; // Music box pure bell
      } else if (track.id === 1) {
        osc.type = 'triangle'; // Warm electric piano
      } else {
        osc.type = 'sine';
      }

      osc.frequency.setValueAtTime(melodyFreq, startTime);

      // Attack - Decay - Sustain - Release Envelope
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.04);
      gain.gain.setValueAtTime(0.25, noteEnd - 0.05);
      gain.gain.linearRampToValueAtTime(0, noteEnd);

      osc.connect(gain);
      gain.connect(masterGainNode);

      osc.start(startTime);
      osc.stop(noteEnd);
      activeOscillators.push(osc);

      // Subtle sparkle chime harmonic (octave higher, gentle)
      if ((track.id === 3 || track.id === 0) && Number.isFinite(melodyFreq * 2)) {
        const chimeOsc = ctx.createOscillator();
        const chimeGain = ctx.createGain();
        chimeOsc.type = 'triangle';
        chimeOsc.frequency.setValueAtTime(melodyFreq * 2, startTime);

        chimeGain.gain.setValueAtTime(0, startTime);
        chimeGain.gain.linearRampToValueAtTime(0.04, startTime + 0.02);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, noteEnd);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(masterGainNode);
        chimeOsc.start(startTime);
        chimeOsc.stop(noteEnd);
        activeOscillators.push(chimeOsc);
      }
    }

    // 2. Chords & Bass accompaniment
    if (chordFreqs && Array.isArray(chordFreqs) && chordFreqs.length > 0) {
      chordFreqs.forEach((freq) => {
        if (!freq || !Number.isFinite(freq) || freq <= 0) return;
        const cOsc = ctx.createOscillator();
        const cGain = ctx.createGain();

        cOsc.type = 'triangle';
        cOsc.frequency.setValueAtTime(freq, startTime);

        cGain.gain.setValueAtTime(0, startTime);
        cGain.gain.linearRampToValueAtTime(0.09, startTime + 0.08);
        cGain.gain.linearRampToValueAtTime(0, noteEnd);

        cOsc.connect(cGain);
        cGain.connect(masterGainNode);

        cOsc.start(startTime);
        cOsc.stop(noteEnd);
        activeOscillators.push(cOsc);
      });
    }

    startTime += dur;
  });

  // Calculate total song length and schedule auto-loop on the current page
  const totalDuration = track.notes.reduce((acc, [, beats]) => acc + beats * beatSec, 0);
  songTimeoutId = setTimeout(() => {
    if (isMusicPlaying && isMusicEnabled) {
      // Loop the current page's song
      playPageSong(currentPage);
    }
  }, (totalDuration + 0.5) * 1000);
}

function stopMusic() {
  isMusicPlaying = false;
  if (songTimeoutId) {
    clearTimeout(songTimeoutId);
    songTimeoutId = null;
  }

  if (masterGainNode && audioCtx) {
    try {
      masterGainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.1);
    } catch (e) {}
  }

  activeOscillators.forEach(osc => {
    try { osc.stop(); } catch (e) {}
  });
  activeOscillators = [];

  updateMusicUIState(false);
}

function updateMusicUIState(playing) {
  const songIdx = PAGE_TO_SONG_INDEX[currentPage] !== undefined ? PAGE_TO_SONG_INDEX[currentPage] : 0;
  const currentTrack = PLAYLIST[songIdx];

  // Top Bar Controller
  const toggleBtn = document.getElementById('musicToggle');
  const label = document.getElementById('musicLabel');
  const artistLabel = document.getElementById('musicArtistLabel');

  if (toggleBtn) {
    toggleBtn.classList.toggle('playing', playing);
    toggleBtn.title = playing ? 'Jeda Musik' : 'Putar Musik Halaman Ini';
  }

  if (label && currentTrack) label.textContent = currentTrack.title;
  if (artistLabel) artistLabel.textContent = `🎵 Musik Otomatis Halaman ${currentPage + 1}`;

  // Page 2 Showcase Player
  const scVinyl = document.getElementById('showcaseVinyl');
  const scTitle = document.getElementById('showcaseSongTitle');
  const scArtist = document.getElementById('showcaseSongArtist');
  const scPlayIcon = document.getElementById('showcasePlayIcon');
  const scPlayText = document.getElementById('showcasePlayText');
  const scWaveBars = document.querySelectorAll('.s-bar');

  if (scVinyl) scVinyl.classList.toggle('spinning', playing);
  if (scTitle && currentTrack) scTitle.textContent = currentTrack.title;
  if (scArtist) scArtist.textContent = `Lagu Ulang Tahun & Tiup Lilin`;
  if (scPlayIcon) scPlayIcon.textContent = playing ? '⏸' : '▶';
  if (scPlayText) scPlayText.textContent = playing ? 'Jeda Musik Halaman' : 'Putar Musik Halaman';

  scWaveBars.forEach(bar => {
    bar.classList.toggle('animating', playing);
  });
}

// ===================================================================
// CANDLE BLOWING SIMULATION
// ===================================================================
function setupCandleSimulation() {
  const blowBtn = document.getElementById('blowButton');
  const holdBtn = document.getElementById('holdBlowButton');
  const micBtn = document.getElementById('micBlowButton');
  const relightBtn = document.getElementById('relightCandlesBtn');
  const holdBar = document.getElementById('holdProgressBar');

  // 1. Direct click on individual candles
  for (let i = 0; i < 3; i++) {
    const candleEl = document.getElementById(`candle-${i}`);
    if (candleEl) {
      candleEl.addEventListener('click', () => {
        extinguishCandle(i);
      });
    }
  }

  // 2. Click button "Tiup Lilin Sekarang"
  if (blowBtn) {
    blowBtn.addEventListener('click', () => {
      extinguishAllCandles();
    });
  }

  // 3. Press & Hold to blow
  if (holdBtn) {
    const startHold = (e) => {
      e.preventDefault();
      holdProgress = 0;
      if (holdBar) holdBar.style.width = '0%';

      // Wild flicker while holding
      tiltCandleFlames(true);

      clearInterval(holdBlowInterval);
      holdBlowInterval = setInterval(() => {
        holdProgress += 8;
        if (holdBar) holdBar.style.width = holdProgress + '%';

        if (holdProgress >= 100) {
          clearInterval(holdBlowInterval);
          tiltCandleFlames(false);
          extinguishAllCandles();
        }
      }, 70);
    };

    const cancelHold = () => {
      clearInterval(holdBlowInterval);
      holdProgress = 0;
      if (holdBar) holdBar.style.width = '0%';
      tiltCandleFlames(false);
    };

    holdBtn.addEventListener('mousedown', startHold);
    holdBtn.addEventListener('touchstart', startHold, { passive: false });
    window.addEventListener('mouseup', cancelHold);
    window.addEventListener('touchend', cancelHold);
  }

  // 4. Microphone Blow Detection
  if (micBtn) {
    micBtn.addEventListener('click', () => {
      toggleMicDetection();
    });
  }

  // 5. Relight candles
  if (relightBtn) {
    relightBtn.addEventListener('click', () => {
      relightAllCandles();
    });
  }
}

function extinguishCandle(index) {
  if (!candleStates[index]) return; // already extinguished

  candleStates[index] = false;
  const candleEl = document.getElementById(`candle-${index}`);
  if (candleEl) {
    candleEl.classList.add('extinguished');
  }

  playWhooshSound();

  // Check if all are blown out
  const allBlown = candleStates.every(state => !state);
  if (allBlown) {
    onAllCandlesExtinguished();
  } else {
    const remaining = candleStates.filter(s => s).length;
    const msg = document.getElementById('blowStatusMessage');
    if (msg) msg.textContent = `💨 Lilin ditiup! Tersisa ${remaining} lilin lagi... Tiup semuanya yuk! ✨`;
  }
}

function extinguishAllCandles() {
  candleStates.forEach((_, idx) => {
    setTimeout(() => {
      extinguishCandle(idx);
    }, idx * 160);
  });
}

function tiltCandleFlames(isBlowing) {
  const flames = document.querySelectorAll('.flame-wrap');
  flames.forEach(f => {
    if (isBlowing) {
      f.style.transform = 'skewX(25deg) scale(0.85, 1.15)';
    } else {
      f.style.transform = '';
    }
  });
}

function onAllCandlesExtinguished() {
  // Stop mic if running
  stopMicDetection();

  // Sound effects
  setTimeout(() => {
    playCheerFanfare();
  }, 350);

  // Confetti explosion
  triggerConfetti(90);

  // Update status and show celebration card
  const msg = document.getElementById('blowStatusMessage');
  const successCard = document.getElementById('blowSuccessCard');
  if (msg) msg.textContent = '🎉 Semua lilin berhasil ditiup! Permohonanmu telah melayang ke langit bintang! ✨';
  if (successCard) successCard.style.display = 'block';
}

function relightAllCandles() {
  candleStates = [true, true, true];
  for (let i = 0; i < 3; i++) {
    const candleEl = document.getElementById(`candle-${i}`);
    if (candleEl) {
      candleEl.classList.remove('extinguished');
    }
  }

  playRelightSound();

  const msg = document.getElementById('blowStatusMessage');
  const successCard = document.getElementById('blowSuccessCard');
  if (msg) msg.textContent = '✨ Lilin telah dinyalakan kembali! Buat permohonan baru lalu tiup lagi 💖';
  if (successCard) successCard.style.display = 'none';
}

// ===================================================================
// MICROPHONE BLOW DETECTION
// ===================================================================
async function toggleMicDetection() {
  if (isMicListening) {
    stopMicDetection();
  } else {
    await startMicDetection();
  }
}

async function startMicDetection() {
  const micBtn = document.getElementById('micBlowButton');
  const micLabel = document.getElementById('micBtnLabel');
  const meterContainer = document.getElementById('micMeterContainer');
  const meterFill = document.getElementById('micMeterFill');
  const meterStatus = document.getElementById('micMeterStatus');

  try {
    micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    micAudioCtx = new AudioContextClass();
    const source = micAudioCtx.createMediaStreamSource(micStream);
    micAnalyser = micAudioCtx.createAnalyser();
    micAnalyser.fftSize = 256;
    source.connect(micAnalyser);

    isMicListening = true;
    if (micBtn) micBtn.classList.add('listening');
    if (micLabel) micLabel.textContent = 'Mendengarkan Tiupan...';
    if (meterContainer) meterContainer.style.display = 'block';

    const dataArray = new Uint8Array(micAnalyser.frequencyBinCount);

    function checkBlowVolume() {
      if (!isMicListening) return;

      micAnalyser.getByteFrequencyData(dataArray);

      // Blowing creates turbulence sound across frequency bins
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const percent = Math.min(100, Math.round((average / 128) * 100));

      if (meterFill) meterFill.style.width = percent + '%';

      // Live candle tilt as breath hits mic
      if (percent > 25) {
        tiltCandleFlames(true);
      } else {
        tiltCandleFlames(false);
      }

      // Threshold to extinguish
      if (percent >= 55) {
        if (meterStatus) meterStatus.textContent = 'Tiupan terdeteksi! 💨';
        extinguishAllCandles();
        stopMicDetection();
        return;
      }

      micRafId = requestAnimationFrame(checkBlowVolume);
    }

    checkBlowVolume();

  } catch (err) {
    console.warn('Microphone access denied or unsupported:', err);
    alert('Izin mikrofon diperlukan untuk mendeteksi tiupan langsung. Kamu juga bisa menggunakan tombol "Tiup Lilin Sekarang" di samping!');
    stopMicDetection();
  }
}

function stopMicDetection() {
  isMicListening = false;
  if (micRafId) {
    cancelAnimationFrame(micRafId);
    micRafId = null;
  }
  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }
  if (micAudioCtx) {
    try { micAudioCtx.close(); } catch (e) {}
    micAudioCtx = null;
  }

  const micBtn = document.getElementById('micBlowButton');
  const micLabel = document.getElementById('micBtnLabel');
  const meterContainer = document.getElementById('micMeterContainer');

  if (micBtn) micBtn.classList.remove('listening');
  if (micLabel) micLabel.textContent = 'Tiup Pakai Mic';
  if (meterContainer) meterContainer.style.display = 'none';
  tiltCandleFlames(false);
}

// ===================================================================
// SOUND EFFECTS SYNTHESIZER
// ===================================================================
function playWhooshSound() {
  try {
    const ctx = getAudioContext();
    // Wind whoosh created with filtered noise
    const bufferSize = ctx.sampleRate * 0.4;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.4);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  } catch (e) {}
}

function playCheerFanfare() {
  try {
    const ctx = getAudioContext();
    const fanfareNotes = [
      { f: N.C4, t: 0, d: 0.15 },
      { f: N.E4, t: 0.15, d: 0.15 },
      { f: N.G4, t: 0.3, d: 0.15 },
      { f: N.C5, t: 0.45, d: 0.6 },
      { f: N.E5, t: 0.45, d: 0.6 },
      { f: N.G5, t: 0.45, d: 0.6 }
    ];

    fanfareNotes.forEach(({ f, t, d }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, ctx.currentTime + t);

      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + t + 0.04);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t + d);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + d);
    });
  } catch (e) {}
}

function playRelightSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {}
}

// ===================================================================
// FLOATING PETALS & HEARTS
// ===================================================================
function setupFloatingParticles() {
  const petalContainer = document.getElementById('petalContainer');
  const heartContainer = document.getElementById('heartContainer');

  const PETALS = ['🌸', '🌺', '🌷', '💐', '🌹', '🪷'];
  const HEARTS = ['💕', '💖', '💗', '💝', '💓', '❤️'];

  function createPetal() {
    if (!petalContainer) return;
    const p = document.createElement('div');
    p.className = 'petal';
    p.textContent = PETALS[Math.floor(Math.random() * PETALS.length)];
    p.style.left = Math.random() * 100 + 'vw';
    p.style.fontSize = (0.9 + Math.random() * 1.1) + 'rem';
    p.style.animationDuration = (7 + Math.random() * 8) + 's';
    p.style.animationDelay = (Math.random() * 2) + 's';
    petalContainer.appendChild(p);

    setTimeout(() => p.remove(), 16000);
  }

  function createHeart() {
    if (!heartContainer) return;
    const h = document.createElement('div');
    h.className = 'heart-float';
    h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
    h.style.left = Math.random() * 100 + 'vw';
    h.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
    h.style.animationDuration = (6 + Math.random() * 7) + 's';
    heartContainer.appendChild(h);

    setTimeout(() => h.remove(), 14000);
  }

  // Initial batch
  for (let i = 0; i < 10; i++) {
    setTimeout(createPetal, i * 250);
  }

  petalInterval = setInterval(createPetal, 1400);
  heartInterval = setInterval(createHeart, 2200);
}

function animateHeartBurst() {
  const container = document.getElementById('heartContainer');
  if (!container) return;
  const HEARTS = ['💕', '💖', '💗', '💝', '💓'];

  for (let i = 0; i < 16; i++) {
    setTimeout(() => {
      const h = document.createElement('div');
      h.className = 'heart-float';
      h.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
      h.style.left = (15 + Math.random() * 70) + 'vw';
      h.style.fontSize = (1.4 + Math.random() * 1.8) + 'rem';
      h.style.animationDuration = (3.5 + Math.random() * 3) + 's';
      container.appendChild(h);
      setTimeout(() => h.remove(), 7000);
    }, i * 150);
  }
}

// ===================================================================
// SPARKLE CANVAS PARTICLES
// ===================================================================
function setupSparkleCanvases() {
  const canvases = document.querySelectorAll('.sparkle-canvas');
  canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function createParticle() {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2 - 0.3,
        alpha: Math.random(),
        fade: Math.random() * 0.02 + 0.005,
        color: `hsl(${Math.random() * 50 + 320}, 85%, 75%)`
      };
    }

    resize();
    particles = Array.from({ length: 45 }, () => createParticle());

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.25) particles.push(createParticle());
      if (particles.length > 80) particles.shift();

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.fade;

        if (p.alpha <= 0 || p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
          particles[i] = createParticle();
          return;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 6;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
          const angle = (j * Math.PI) / 2;
          const x1 = p.x + Math.cos(angle) * p.r * 2.8;
          const y1 = p.y + Math.sin(angle) * p.r * 2.8;
          if (j === 0) ctx.moveTo(x1, y1);
          else ctx.lineTo(x1, y1);
          const midAngle = angle + Math.PI / 4;
          ctx.lineTo(p.x + Math.cos(midAngle) * p.r, p.y + Math.sin(midAngle) * p.r);
        }
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      requestAnimationFrame(draw);
    }

    draw();
    window.addEventListener('resize', resize);
  });
}

// ===================================================================
// CONFETTI GENERATOR
// ===================================================================
function triggerConfetti(count = 70) {
  const container = document.getElementById('confettiContainer');
  if (!container) return;

  const colors = ['#ff4d88', '#c084fc', '#fcd34d', '#34d399', '#60a5fa', '#fb7185', '#a78bfa'];
  const shapes = ['●', '■', '▲', '★', '♥', '🎉', '🌸'];

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.textContent = shapes[Math.floor(Math.random() * shapes.length)];
    piece.style.left = Math.random() * 100 + 'vw';
    piece.style.color = colors[Math.floor(Math.random() * colors.length)];
    piece.style.fontSize = (10 + Math.random() * 14) + 'px';
    piece.style.animationDuration = (2.5 + Math.random() * 3.5) + 's';
    piece.style.animationDelay = (Math.random() * 1.5) + 's';
    container.appendChild(piece);

    setTimeout(() => piece.remove(), 7000);
  }
}

// ===================================================================
// LOVE METER (Page 5)
// ===================================================================
function setupLoveMeter() {
  const stars = document.querySelectorAll('.star');
  const result = document.getElementById('meterResult');
  const responses = [
    '😊 Kamu orang yang baik dan berharga!',
    '🌷 Senyumanmu membawa kebahagiaan untuk sekelilingmu!',
    '✨ Luar biasa istimewa dan selalu mengagumkan!',
    '💖 Sangat, sangat spesial dan berarti di dalam hidupku!',
    '👑 SEGALANYA! Kamu adalah permata paling berharga dan tiada duanya di dunia ini! 🌟💖'
  ];

  let selected = 5; // Default 5 stars

  stars.forEach(star => {
    star.addEventListener('mouseenter', () => {
      const val = parseInt(star.dataset.val, 10);
      stars.forEach((s, i) => {
        s.textContent = i < val ? '⭐' : '☆';
        s.style.transform = i < val ? 'scale(1.3)' : 'scale(1)';
      });
    });

    star.addEventListener('mouseleave', () => {
      stars.forEach((s, i) => {
        s.textContent = i < selected ? '⭐' : '☆';
        s.style.transform = i < selected ? 'scale(1.25)' : 'scale(1)';
      });
    });

    star.addEventListener('click', () => {
      selected = parseInt(star.dataset.val, 10);
      if (result) {
        result.textContent = responses[selected - 1];
        result.style.color = selected === 5 ? '#fcd34d' : '#ffd1e4';
      }

      if (selected === 5) {
        animateHeartBurst();
        triggerConfetti(60);
      }
    });
  });
}

// ===================================================================
// MEMORY CARDS (Page 4)
// ===================================================================
function setupMemoryCards() {
  const cards = document.querySelectorAll('.memory-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      card.style.transform = 'scale(1.08) rotate(2deg)';
      setTimeout(() => {
        card.style.transform = '';
      }, 350);
    });
  });
}
