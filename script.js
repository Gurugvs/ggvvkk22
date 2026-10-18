// ==========================================================================
// 🎂 BIRTHDAY CELEBRATION APP JAVASCRIPT
// Dedicated to Vijayavishal
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {

  // ------------------------------------------------------------------------
  // AUDIO SYNTHESIZER (Web Audio API - No external mp3 files required!)
  // ------------------------------------------------------------------------
  class SoundController {
    constructor() {
      this.ctx = null;
      this.isPlayingMusic = false;
      this.musicTimer = null;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }

    // Play a single tone
    playTone(freq, type = 'sine', duration = 0.3, gainVal = 0.15) {
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio playback error', e);
      }
    }

    // Sound effect: Balloon Pop
    playPop() {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

      gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    }

    // Sound effect: Candle Extinguish (Puff)
    playPuff() {
      this.init();
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 0.2;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.2);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start();
    }

    // Sound effect: Fanfare / Celebration
    playFanfare() {
      this.init();
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        setTimeout(() => {
          this.playTone(freq, 'triangle', 0.5, 0.25);
        }, index * 120);
      });
    }

    // Sound effect: Glitch / Tech Alarm
    playGlitchBeep() {
      this.init();
      this.playTone(880, 'sawtooth', 0.08, 0.2);
    }

    // Melody: Happy Birthday synth loop
    startBirthdayMelody() {
      this.init();
      this.isPlayingMusic = true;

      // Happy Birthday Melody Frequencies & Beat Durations
      // "Happy Birthday to you, Happy Birthday to you, Happy Birthday dear Vijayavishal, Happy Birthday to you"
      const melody = [
        { f: 261.63, d: 250 }, { f: 261.63, d: 250 }, { f: 293.66, d: 500 }, { f: 261.63, d: 500 }, { f: 349.23, d: 500 }, { f: 329.63, d: 1000 },
        { f: 261.63, d: 250 }, { f: 261.63, d: 250 }, { f: 293.66, d: 500 }, { f: 261.63, d: 500 }, { f: 392.00, d: 500 }, { f: 349.23, d: 1000 },
        { f: 261.63, d: 250 }, { f: 261.63, d: 250 }, { f: 523.25, d: 500 }, { f: 440.00, d: 500 }, { f: 349.23, d: 500 }, { f: 329.63, d: 500 }, { f: 293.66, d: 1000 },
        { f: 466.16, d: 250 }, { f: 466.16, d: 250 }, { f: 440.00, d: 500 }, { f: 349.23, d: 500 }, { f: 392.00, d: 500 }, { f: 349.23, d: 1200 }
      ];

      let noteIndex = 0;

      const playNextNote = () => {
        if (!this.isPlayingMusic) return;
        const current = melody[noteIndex];
        this.playTone(current.f, 'sine', (current.d / 1000) * 0.9, 0.14);

        noteIndex = (noteIndex + 1) % melody.length;
        const nextDelay = current.d + (noteIndex === 0 ? 1500 : 80);
        this.musicTimer = setTimeout(playNextNote, nextDelay);
      };

      playNextNote();
    }

    stopBirthdayMelody() {
      this.isPlayingMusic = false;
      if (this.musicTimer) clearTimeout(this.musicTimer);
    }
  }

  const sound = new SoundController();

  // ------------------------------------------------------------------------
  // CANVAS CONFETTI & FIREWORKS ENGINE
  // ------------------------------------------------------------------------
  const canvas = document.getElementById('fx-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  class Particle {
    constructor(x, y, isExplosion = false) {
      this.x = x;
      this.y = y;
      const colors = ['#ff2a85', '#ff75b5', '#ffcad4', '#ffffff', '#ff4d8d', '#f72585', '#ff85a1', '#ffd1dc'];
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.size = Math.random() * 8 + 4;

      if (isExplosion) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 3;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
      } else {
        this.vx = (Math.random() - 0.5) * 4;
        this.vy = Math.random() * 3 + 2;
      }

      this.gravity = 0.15;
      this.opacity = 1;
      this.rotation = Math.random() * 360;
      this.rotSpeed = (Math.random() - 0.5) * 8;
      this.isExplosion = isExplosion;
      this.life = isExplosion ? 80 : 250;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy += this.gravity;
      this.rotation += this.rotSpeed;
      this.life--;

      if (this.isExplosion) {
        this.opacity = Math.max(0, this.life / 80);
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate((this.rotation * Math.PI) / 180);
      ctx.globalAlpha = this.opacity;
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
      ctx.restore();
    }
  }

  function launchConfettiBlast(originX = window.innerWidth / 2, originY = window.innerHeight / 2, count = 90) {
    for (let i = 0; i < count; i++) {
      particles.push(new Particle(originX, originY, true));
    }
  }

  function addRainConfetti() {
    if (particles.length < 150) {
      particles.push(new Particle(Math.random() * canvas.width, -10, false));
    }
  }

  function renderFX() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.life <= 0 || p.y > canvas.height + 20) {
        particles.splice(i, 1);
      }
    }
    requestAnimationFrame(renderFX);
  }
  renderFX();

  // Screen click triggers mini fireworks
  document.addEventListener('click', (e) => {
    // Only launch fireworks if inside celebration screen
    if (!celebrationScreen.classList.contains('hidden') && e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') {
      launchConfettiBlast(e.clientX, e.clientY, 30);
    }
  });

  // ------------------------------------------------------------------------
  // PHASE 1: 404 PRANK & UNLOCK MECHANISM
  // ------------------------------------------------------------------------
  const prankScreen = document.getElementById('prank-screen');
  const fixBtn = document.getElementById('fix-error-btn');
  const glitchOverlay = document.getElementById('glitch-overlay');
  const countEl = document.getElementById('override-count');
  const celebrationScreen = document.getElementById('celebration-screen');
  const musicToggleBtn = document.getElementById('music-toggle-btn');
  const musicStatusText = document.getElementById('music-status-text');

  let isUnlockTriggered = false;
  let autoUnlockInterval = null;

  function triggerUnlock() {
    if (isUnlockTriggered) return;
    isUnlockTriggered = true;
    if (autoUnlockInterval) clearInterval(autoUnlockInterval);

    sound.init();
    glitchOverlay.classList.add('active');

    let count = 3;
    countEl.textContent = count;
    sound.playGlitchBeep();

    const countInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countEl.textContent = count;
        sound.playGlitchBeep();
      } else {
        clearInterval(countInterval);
        countEl.textContent = '🚀 GO!';
        sound.playFanfare();

        setTimeout(() => {
          // Transition screens
          prankScreen.style.opacity = '0';
          prankScreen.style.transform = 'scale(1.1)';
          
          setTimeout(() => {
            prankScreen.classList.add('hidden');
            celebrationScreen.classList.remove('hidden');
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Launch huge celebratory confetti explosions!
            launchConfettiBlast(window.innerWidth * 0.2, window.innerHeight * 0.4, 80);
            launchConfettiBlast(window.innerWidth * 0.5, window.innerHeight * 0.3, 100);
            launchConfettiBlast(window.innerWidth * 0.8, window.innerHeight * 0.4, 80);

            document.title = "🎉 Happy Birthday Vijayavishal! | VIP Celebration";
            // Confetti rain interval
            setInterval(addRainConfetti, 120);

            // Start celebration soundtrack (Magale From Baththa)
            if (typeof startSoundtrack === 'function') {
              startSoundtrack();
            } else if (celebrationAudio) {
              celebrationAudio.play().catch(() => sound.startBirthdayMelody());
            } else {
              sound.startBirthdayMelody();
            }
          }, 600);
        }, 600);
      }
    }, 800);
  }

  if (fixBtn) {
    fixBtn.addEventListener('click', triggerUnlock);
  }

  // Check if user came from separate 404 error page or already solved
  const urlParams = new URLSearchParams(window.location.search);
  const isAlreadySolved = urlParams.get('celebrate') === 'true' || sessionStorage.getItem('prank_solved') === 'true';

  if (isAlreadySolved) {
    if (prankScreen) prankScreen.classList.add('hidden');
    if (celebrationScreen) celebrationScreen.classList.remove('hidden');
    document.title = "🎉 Happy Birthday Vijayavishal! | VIP Celebration";
    setTimeout(() => {
      launchConfettiBlast(window.innerWidth * 0.5, window.innerHeight * 0.3, 100);
      setInterval(addRainConfetti, 120);
      if (typeof startSoundtrack === 'function') {
        startSoundtrack();
      } else if (celebrationAudio) {
        celebrationAudio.play().catch(() => sound.startBirthdayMelody());
      } else {
        sound.startBirthdayMelody();
      }
    }, 400);
  } else {
    // Auto-start 404 prank to celebration on index page after 3s
    let autoCountdown = 3;
    autoUnlockInterval = setInterval(() => {
      if (isUnlockTriggered) {
        clearInterval(autoUnlockInterval);
        return;
      }
      autoCountdown--;
      if (autoCountdown > 0) {
        if (fixBtn) fixBtn.innerHTML = `<span class="btn-icon">⚡</span> Auto-fixing in ${autoCountdown}s...`;
      } else {
        clearInterval(autoUnlockInterval);
        triggerUnlock();
      }
    }, 1000);
  }

  // Replay Prank button in footer
  const replayBtn = document.getElementById('replay-prank-btn');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => {
      sessionStorage.removeItem('prank_solved');
      sound.stopBirthdayMelody();
      if (celebrationAudio) celebrationAudio.pause();
      glitchOverlay.classList.remove('active');
      prankScreen.style.opacity = '1';
      prankScreen.style.transform = 'scale(1)';
      prankScreen.classList.remove('hidden');
      celebrationScreen.classList.add('hidden');
      document.title = "404 - Page Not Found";
      isUnlockTriggered = false;
      if (fixBtn) fixBtn.innerHTML = `<span class="btn-icon">⚡</span> Tap to Fix Error & Reconnect`;

      // Re-arm auto-start countdown
      let replayCountdown = 3;
      if (autoUnlockInterval) clearInterval(autoUnlockInterval);
      autoUnlockInterval = setInterval(() => {
        if (isUnlockTriggered) {
          clearInterval(autoUnlockInterval);
          return;
        }
        replayCountdown--;
        if (replayCountdown > 0) {
          if (fixBtn) fixBtn.innerHTML = `<span class="btn-icon">⚡</span> Auto-fixing in ${replayCountdown}s...`;
        } else {
          clearInterval(autoUnlockInterval);
          triggerUnlock();
        }
      }, 1000);
    });
  }

  // Music toggle control
  musicToggleBtn.addEventListener('click', () => {
    if (sound.isPlayingMusic) {
      sound.stopBirthdayMelody();
      musicStatusText.textContent = 'Music: OFF';
    } else {
      sound.startBirthdayMelody();
      musicStatusText.textContent = 'Music: ON';
    }
  });

  // Confetti burst button
  const confettiBurstBtn = document.getElementById('confetti-burst-btn');
  confettiBurstBtn.addEventListener('click', () => {
    launchConfettiBlast(window.innerWidth / 2, window.innerHeight / 2, 80);
    sound.playFanfare();
  });

  // ------------------------------------------------------------------------
  // HERO SECTION INTERACTIVE CELEBRATION
  // ------------------------------------------------------------------------
  const heroNameEl = document.getElementById('hero-name');
  const heroBadgeEl = document.getElementById('hero-badge');

  function spawnFloatingCelebrationText(x, y, text) {
    const floatEl = document.createElement('div');
    floatEl.textContent = text;
    floatEl.style.position = 'fixed';
    floatEl.style.left = `${x}px`;
    floatEl.style.top = `${y}px`;
    floatEl.style.transform = 'translate(-50%, -50%)';
    floatEl.style.color = '#ffcad4';
    floatEl.style.fontWeight = '900';
    floatEl.style.fontSize = '1.3rem';
    floatEl.style.textShadow = '0 0 15px #ff2a85, 0 0 30px #c026d3';
    floatEl.style.pointerEvents = 'none';
    floatEl.style.zIndex = '9999';
    floatEl.style.transition = 'all 1s cubic-bezier(0.2, 0.9, 0.3, 1)';
    floatEl.style.opacity = '1';
    document.body.appendChild(floatEl);

    requestAnimationFrame(() => {
      floatEl.style.transform = 'translate(-50%, -90px) scale(1.25)';
      floatEl.style.opacity = '0';
    });

    setTimeout(() => {
      floatEl.remove();
    }, 1000);
  }

  if (heroNameEl) {
    heroNameEl.addEventListener('click', (e) => {
      const rect = heroNameEl.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;

      launchConfettiBlast(originX, originY, 85);
      sound.playFanfare();

      heroNameEl.classList.remove('clicked-pop');
      void heroNameEl.offsetWidth; // trigger reflow
      heroNameEl.classList.add('clicked-pop');

      spawnFloatingCelebrationText(originX, originY - 20, '👑 THE BIRTHDAY LEGEND! ✨');
    });
  }

  if (heroBadgeEl) {
    heroBadgeEl.addEventListener('click', (e) => {
      const rect = heroBadgeEl.getBoundingClientRect();
      const originX = rect.left + rect.width / 2;
      const originY = rect.top + rect.height / 2;

      launchConfettiBlast(originX, originY, 50);
      sound.playPop();

      spawnFloatingCelebrationText(originX, originY - 15, '🎂 PARTY TIME! 🎉');
    });
  }

  // ------------------------------------------------------------------------
  // INTERACTIVE BIRTHDAY CAKE & CANDLE BLOWOUT
  // ------------------------------------------------------------------------
  const candles = document.querySelectorAll('.candle');
  const blowAllBtn = document.getElementById('blow-all-candles-btn');
  const relightBtn = document.getElementById('relight-candles-btn');
  const wishCard = document.getElementById('wish-card');
  const cakeInstructions = document.getElementById('cake-instructions');

  let extinguishedCount = 0;

  function extinguishCandle(candle) {
    if (!candle.classList.contains('extinguished')) {
      candle.classList.add('extinguished');
      sound.playPuff();
      extinguishedCount++;
      cakeInstructions.textContent = `${extinguishedCount} of ${candles.length} candles blown out! Keep going...`;

      if (extinguishedCount === candles.length) {
        onAllCandlesExtinguished();
      }
    }
  }

  candles.forEach((candle) => {
    candle.addEventListener('click', () => extinguishCandle(candle));
  });

  blowAllBtn.addEventListener('click', () => {
    candles.forEach((candle, idx) => {
      setTimeout(() => extinguishCandle(candle), idx * 100);
    });
  });

  function onAllCandlesExtinguished() {
    cakeInstructions.textContent = '🌟 All candles extinguished! Happy Birthday Vijayavishal!';
    wishCard.classList.remove('hidden');
    blowAllBtn.classList.add('hidden');
    relightBtn.classList.remove('hidden');
    sound.playFanfare();
    launchConfettiBlast(window.innerWidth / 2, window.innerHeight * 0.45, 120);
  }

  relightBtn.addEventListener('click', () => {
    candles.forEach((candle) => candle.classList.remove('extinguished'));
    extinguishedCount = 0;
    wishCard.classList.add('hidden');
    blowAllBtn.classList.remove('hidden');
    relightBtn.classList.add('hidden');
    cakeInstructions.textContent = 'Tap the candles to blow them out, make your birthday wish!';
  });

  // ------------------------------------------------------------------------
  // POLAROID GALLERY, LIGHTBOX & CUSTOM PHOTO UPLOADER
  // ------------------------------------------------------------------------
  const polaroids = document.querySelectorAll('.polaroid-card');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.querySelector('.lightbox-close');
  const photoInput = document.getElementById('custom-photo-input');
  const polaroidContainer = document.getElementById('polaroid-container');

  function openLightbox(imgSrc, captionText) {
    lightboxImg.src = imgSrc;
    lightboxCaption.textContent = captionText;
    lightboxModal.classList.remove('hidden');
  }

  polaroids.forEach((card) => {
    card.addEventListener('click', () => {
      const img = card.querySelector('img');
      const title = card.querySelector('.caption-title')?.textContent || 'Special Memory';
      if (img && img.src) {
        openLightbox(img.src, title);
      }
    });
  });

  lightboxClose.addEventListener('click', () => lightboxModal.classList.add('hidden'));
  lightboxModal.addEventListener('click', (e) => {
    if (e.target === lightboxModal) lightboxModal.classList.add('hidden');
  });

  // Photo Uploader: Read user's files and prepend new polaroids!
  photoInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newCard = document.createElement('div');
        const randomRot = (Math.random() * 6 - 3).toFixed(1);
        newCard.className = 'polaroid-card';
        newCard.style.setProperty('--rotation', `${randomRot}deg`);

        newCard.innerHTML = `
          <div class="tape-strip"></div>
          <div class="polaroid-img-wrapper">
            <img src="${event.target.result}" alt="Friend Memory" class="polaroid-img">
          </div>
          <div class="polaroid-caption">
            <p class="caption-title">Best Moments 🌟</p>
            <p class="caption-date">Vijayavishal's Celebration</p>
          </div>
        `;

        newCard.addEventListener('click', () => {
          openLightbox(event.target.result, 'Best Moments 🌟');
        });

        polaroidContainer.prepend(newCard);
        launchConfettiBlast(window.innerWidth / 2, window.innerHeight / 2, 40);
      };
      reader.readAsDataURL(file);
    });
  });

  // ------------------------------------------------------------------------
  // SPOTIFY PLAYER & MAGALE (FROM BATHTHA) SOUNDTRACK CONTROLLER
  // ------------------------------------------------------------------------
  const celebrationAudio = document.getElementById('celebration-audio') || new Audio('assets/Magale From _Baththa_.mp3');
  
  const playToggleBtn = document.getElementById('play-toggle-btn');
  const playIcon = document.getElementById('play-icon');
  const sectionPlayBtn = document.getElementById('section-play-btn');
  const currentTimeEl = document.getElementById('current-time');
  const totalTimeEl = document.getElementById('total-time');
  const progressFill = document.getElementById('progress-fill');
  const progressTrack = document.getElementById('progress-track');
  const likeBtn = document.getElementById('like-btn');
  const shuffleBtn = document.getElementById('shuffle-btn');
  const repeatBtn = document.getElementById('repeat-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const lyricsBtn = document.getElementById('lyrics-btn');
  const sectionLyricsBtn = document.getElementById('section-lyrics-btn');
  const lyricsModal = document.getElementById('lyrics-modal');
  const lyricsCloseBtn = document.getElementById('lyrics-close-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const volumeFill = document.getElementById('volume-fill');
  const volumeIconBtn = document.getElementById('volume-icon-btn');

  function formatTime(secs) {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function updatePlayerIcons(isPlaying) {
    if (playIcon) {
      if (isPlaying) {
        playIcon.innerHTML = `
          <rect x="6" y="4" width="4" height="16"></rect>
          <rect x="14" y="4" width="4" height="16"></rect>
        `;
      } else {
        playIcon.innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
      }
    }
    if (sectionPlayBtn) {
      if (isPlaying) {
        sectionPlayBtn.innerHTML = `
          <span class="song-play-icon">⏸</span>
          <span class="song-play-text">Pause Magale Soundtrack</span>
        `;
      } else {
        sectionPlayBtn.innerHTML = `
          <span class="song-play-icon">▶</span>
          <span class="song-play-text">Play Magale Soundtrack</span>
        `;
      }
    }
    if (musicStatusText) {
      musicStatusText.textContent = isPlaying ? 'Music: Magale 🎶' : 'Music: OFF';
    }
  }

  function toggleTrackPlayback() {
    if (!celebrationAudio) return;
    if (celebrationAudio.paused) {
      sound.stopBirthdayMelody();
      celebrationAudio.play().then(() => {
        updatePlayerIcons(true);
        launchConfettiBlast(window.innerWidth * 0.5, window.innerHeight * 0.7, 35);
      }).catch(err => {
        console.warn('Playback error or blocked by autoplay policy:', err);
      });
    } else {
      celebrationAudio.pause();
      updatePlayerIcons(false);
    }
  }

  window.startSoundtrack = function() {
    if (!celebrationAudio) return;
    sound.stopBirthdayMelody();
    celebrationAudio.play().then(() => {
      updatePlayerIcons(true);
    }).catch(() => {
      // Browser blocked unmuted autoplay without prior gesture; arm on first user interaction anywhere
      const resumeOnGesture = () => {
        sound.stopBirthdayMelody();
        celebrationAudio.play().then(() => {
          updatePlayerIcons(true);
        }).catch(() => {});
        document.removeEventListener('click', resumeOnGesture);
        document.removeEventListener('keydown', resumeOnGesture);
        document.removeEventListener('touchstart', resumeOnGesture);
      };
      document.addEventListener('click', resumeOnGesture, { once: true });
      document.addEventListener('keydown', resumeOnGesture, { once: true });
      document.addEventListener('touchstart', resumeOnGesture, { once: true });
    });
  };

  // Audio element events
  celebrationAudio.addEventListener('loadedmetadata', () => {
    if (totalTimeEl && celebrationAudio.duration) {
      totalTimeEl.textContent = formatTime(celebrationAudio.duration);
    }
  });

  celebrationAudio.addEventListener('timeupdate', () => {
    if (!celebrationAudio.duration) return;
    if (currentTimeEl) {
      currentTimeEl.textContent = formatTime(celebrationAudio.currentTime);
    }
    if (progressFill) {
      const pct = (celebrationAudio.currentTime / celebrationAudio.duration) * 100;
      progressFill.style.width = `${pct}%`;
    }
    if (totalTimeEl && totalTimeEl.textContent === '--:--' && celebrationAudio.duration) {
      totalTimeEl.textContent = formatTime(celebrationAudio.duration);
    }
  });

  celebrationAudio.addEventListener('play', () => updatePlayerIcons(true));
  celebrationAudio.addEventListener('pause', () => updatePlayerIcons(false));
  celebrationAudio.addEventListener('ended', () => {
    if (!celebrationAudio.loop) {
      updatePlayerIcons(false);
      celebrationAudio.currentTime = 0;
    }
  });

  // Play/Pause button triggers
  if (playToggleBtn) playToggleBtn.addEventListener('click', toggleTrackPlayback);
  if (sectionPlayBtn) sectionPlayBtn.addEventListener('click', toggleTrackPlayback);

  // Prev / Next button (replays / restarts track)
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      celebrationAudio.currentTime = 0;
      celebrationAudio.play().then(() => updatePlayerIcons(true)).catch(() => {});
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      celebrationAudio.currentTime = 0;
      celebrationAudio.play().then(() => {
        updatePlayerIcons(true);
        launchConfettiBlast(window.innerWidth * 0.5, window.innerHeight * 0.7, 30);
      }).catch(() => {});
    });
  }

  // Repeat button
  if (repeatBtn) {
    repeatBtn.addEventListener('click', () => {
      celebrationAudio.loop = !celebrationAudio.loop;
      repeatBtn.classList.toggle('active', celebrationAudio.loop);
    });
  }

  // Shuffle button
  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      shuffleBtn.classList.toggle('active');
    });
  }

  // Progress scrubber seeking
  if (progressTrack) {
    progressTrack.addEventListener('click', (e) => {
      if (!celebrationAudio.duration) return;
      const rect = progressTrack.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      celebrationAudio.currentTime = ratio * celebrationAudio.duration;
      if (currentTimeEl) currentTimeEl.textContent = formatTime(celebrationAudio.currentTime);
      if (progressFill) progressFill.style.width = `${ratio * 100}%`;
    });
  }

  // Like heart button
  if (likeBtn) {
    likeBtn.addEventListener('click', () => {
      likeBtn.classList.toggle('active');
      if (likeBtn.classList.contains('active')) {
        likeBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        `;
        launchConfettiBlast(window.innerWidth * 0.15, window.innerHeight - 80, 25);
      } else {
        likeBtn.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        `;
      }
    });
  }

  // Volume slider & mute
  let prevVolume = 0.85;
  celebrationAudio.volume = prevVolume;
  if (volumeFill) volumeFill.style.width = `${prevVolume * 100}%`;

  if (volumeSlider) {
    volumeSlider.addEventListener('click', (e) => {
      const rect = volumeSlider.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      celebrationAudio.volume = ratio;
      celebrationAudio.muted = false;
      prevVolume = ratio;
      if (volumeFill) volumeFill.style.width = `${ratio * 100}%`;
    });
  }

  if (volumeIconBtn) {
    volumeIconBtn.addEventListener('click', () => {
      celebrationAudio.muted = !celebrationAudio.muted;
      if (celebrationAudio.muted) {
        if (volumeFill) volumeFill.style.width = '0%';
      } else {
        if (volumeFill) volumeFill.style.width = `${(celebrationAudio.volume || prevVolume) * 100}%`;
      }
    });
  }

  // Lyrics modal
  const openLyrics = () => { if (lyricsModal) lyricsModal.classList.add('active'); };
  const closeLyrics = () => { if (lyricsModal) lyricsModal.classList.remove('active'); };

  if (lyricsBtn) lyricsBtn.addEventListener('click', openLyrics);
  if (sectionLyricsBtn) sectionLyricsBtn.addEventListener('click', openLyrics);
  if (lyricsCloseBtn) lyricsCloseBtn.addEventListener('click', closeLyrics);
  if (lyricsModal) {
    lyricsModal.addEventListener('click', (e) => {
      if (e.target === lyricsModal) closeLyrics();
    });
  }

  // Top nav music toggle button wired to toggleTrackPlayback
  if (musicToggleBtn) {
    musicToggleBtn.onclick = (e) => {
      e.preventDefault();
      toggleTrackPlayback();
    };
  }

  // Attempt to read metadata if audio is already cached
  if (celebrationAudio.readyState >= 1 && totalTimeEl && celebrationAudio.duration) {
    totalTimeEl.textContent = formatTime(celebrationAudio.duration);
  }

});
