// ==========================================================================
// 🏹 CUPID'S ARCHERY & HEART BLOOM ANIMATION
// Dedicated to Vijayavishal's Birthday Celebration
// "one bow, one heart — draw -> fire -> bloom"
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const archeryStage = document.getElementById('archery-stage');
  const bowString = document.getElementById('bow-string');
  const cupidArrow = document.getElementById('cupid-arrow');
  const fireBtn = document.getElementById('fire-arrow-btn');
  const resetBtn = document.getElementById('reset-archery-btn');
  const bloomMessage = document.getElementById('bloom-message');
  const heartBadge = document.getElementById('target-heart-badge');
  const targetBullseye = document.getElementById('target-heart-bullseye');
  const bloomCanvas = document.getElementById('bloom-canvas');
  if (!bloomCanvas || !bowString || !cupidArrow) return;

  const ctx = bloomCanvas.getContext('2d');

  // Palette of roses & soft pinks
  const rose = [
    '#ff0a54', '#ff477e', '#ff7096', '#ff85a1', 
    '#f72585', '#ff2a85', '#ff75b5', '#ffcad4', 
    '#ff007f', '#ff4d8d', '#d91b72', '#ffccd5'
  ];

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ------------------------------------------------------------------------
  // SOUND SYNTHESIZER (Twang, Whoosh, Bloom Sparkle)
  // ------------------------------------------------------------------------
  class ArcheryAudio {
    constructor() {
      this.ctx = null;
    }
    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    }
    playTwang() {
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.35);
      } catch (e) {}
    }
    playWhoosh() {
      this.init();
      if (!this.ctx) return;
      try {
        const bufferSize = this.ctx.sampleRate * 0.3;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(500, this.ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(1800, this.ctx.currentTime + 0.15);
        filter.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.3);
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        noise.start();
      } catch (e) {}
    }
    playBloomChime() {
      this.init();
      if (!this.ctx) return;
      const notes = [587.33, 659.25, 880.00, 1046.50, 1318.51, 1567.98]; // D5, E5, A5, C6, E6, G6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.6);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.6);
          } catch (e) {}
        }, idx * 70);
      });
    }
  }

  const sfx = new ArcheryAudio();

  // ------------------------------------------------------------------------
  // RECURVE BOW & STRING DYNAMICS
  // ------------------------------------------------------------------------
  const restY = 90;
  let isFiring = false;
  let isBloomed = false;

  // Elastic string return simulation (mimicking string.to({ y2: rest }, 'elastic.out'))
  function twangString(maxPull = 135, onComplete) {
    let startTime = performance.now();
    const duration = 500; // ms

    function animate(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      
      // Elastic out easing
      const p = 0.3;
      const elastic = Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1;
      
      // Interpolate from pull back (135) to rest (90)
      const currentY = restY + (maxPull - restY) * (1 - elastic);
      bowString.setAttribute('d', `M 32,90 Q 160,${currentY} 288,90`);

      if (t < 1) {
        requestAnimationFrame(animate);
      } else {
        bowString.setAttribute('d', `M 32,90 Q 160,90 288,90`);
        if (onComplete) onComplete();
      }
    }
    requestAnimationFrame(animate);
  }

  // ------------------------------------------------------------------------
  // BLOOM HEARTS INSIDE A HEART ALGORITHM
  // "bloom hearts inside a heart"
  // while (hearts.length < 340) {
  //   const [u, v] = sample();
  //   if (inHeart(u, v))
  //     bloom(u, v, pick(rose));
  // }
  // ------------------------------------------------------------------------
  let hearts = [];
  let animId = null;

  // Mathematical rejection sampling for heart region
  function sample() {
    // Return point in [-1.5, 1.5] x [-1.5, 1.5]
    const u = (Math.random() * 2.8) - 1.4;
    const v = (Math.random() * 2.8) - 1.4;
    return [u, v];
  }

  function inHeart(u, v) {
    // Mathematical heart implicit equation: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0
    // Invert v so heart points right-side up
    const x = u;
    const y = -v + 0.15;
    const x2 = x * x;
    const y2 = y * y;
    const term = x2 + y2 - 1;
    return (term * term * term - x2 * (y * y * y)) <= 0;
  }

  class BloomingHeart {
    constructor(px, py, color, delay) {
      this.targetX = px;
      this.targetY = py;
      this.color = color;
      this.delay = delay;
      this.birth = performance.now() + delay;
      this.size = Math.random() * 9 + 5;
      this.scale = 0;
      this.alpha = 0;
      this.rotation = (Math.random() * 0.6) - 0.3;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(now) {
      if (now < this.birth) return;
      const progress = Math.min((now - this.birth) / 400, 1);
      // Elastic pop
      this.scale = Math.sin(progress * Math.PI * 0.5) * 1.2;
      if (progress >= 1) {
        this.scale = 1 + Math.sin(this.pulsePhase + now * 0.003) * 0.12;
      }
      this.alpha = Math.min(progress * 1.5, 1);
    }

    draw(ctx) {
      if (this.alpha <= 0) return;
      ctx.save();
      ctx.translate(this.targetX, this.targetY);
      ctx.rotate(this.rotation);
      ctx.scale(this.scale, this.scale);
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.shadowColor = this.color;
      ctx.shadowBlur = 8;

      // Draw mini heart glyph
      const s = this.size;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.3);
      ctx.bezierCurveTo(-s * 0.6, -s * 0.3, -s * 0.9, s * 0.4, 0, s);
      ctx.bezierCurveTo(s * 0.9, s * 0.4, s * 0.6, -s * 0.3, 0, s * 0.3);
      ctx.fill();

      ctx.restore();
    }
  }

  function bloom(u, v, color) {
    // Map [-1.4, 1.4] to canvas coordinates
    const centerX = bloomCanvas.width / 2;
    const centerY = bloomCanvas.height / 2 - 10;
    const scaleFactor = Math.min(bloomCanvas.width, bloomCanvas.height) * 0.32;

    const px = centerX + u * scaleFactor;
    const py = centerY + v * scaleFactor;
    const delay = Math.hypot(u, v) * 650 + Math.random() * 200;

    hearts.push(new BloomingHeart(px, py, color, delay));
  }

  function generateHeartBloom() {
    hearts = [];
    ctx.clearRect(0, 0, bloomCanvas.width, bloomCanvas.height);

    // EXACT ALGORITHM:
    // while (hearts.length < 340) {
    //   const [u, v] = sample();
    //   if (inHeart(u, v))
    //     bloom(u, v, pick(rose));
    // }
    while (hearts.length < 340) {
      const [u, v] = sample();
      if (inHeart(u, v)) {
        bloom(u, v, pick(rose));
      }
    }

    // Animation loop for blooming hearts
    function renderBloom(now) {
      ctx.clearRect(0, 0, bloomCanvas.width, bloomCanvas.height);
      hearts.forEach(h => {
        h.update(now);
        h.draw(ctx);
      });
      animId = requestAnimationFrame(renderBloom);
    }
    if (animId) cancelAnimationFrame(animId);
    animId = requestAnimationFrame(renderBloom);
  }

  // ------------------------------------------------------------------------
  // PULL BACK & FIRE CUPID'S ARROW
  // ------------------------------------------------------------------------
  function fire() {
    if (isFiring) return;
    isFiring = true;
    sfx.init();

    fireBtn.disabled = true;
    fireBtn.style.opacity = '0.6';
    heartBadge.textContent = '🏹 In Flight!';
    heartBadge.classList.add('pulse');

    // 1. Pull back bow and arrow
    cupidArrow.classList.add('drawn');
    bowString.setAttribute('d', 'M 32,90 Q 160,135 288,90');

    setTimeout(() => {
      // 2. Twang bowstring: string.to({ y2: rest }, 'elastic.out')
      sfx.playTwang();
      twangString(135);

      // 3. Arrow whoosh flight: arrow.to({ y: heart })
      sfx.playWhoosh();
      cupidArrow.classList.remove('drawn');
      cupidArrow.classList.add('flying');

      // 4. Arrow hits the heart target
      setTimeout(() => {
        cupidArrow.classList.remove('flying');
        cupidArrow.classList.add('struck');

        // Play chime and trigger target flash & heart bloom!
        sfx.playBloomChime();
        heartBadge.textContent = '💖 Direct Hit!';
        heartBadge.classList.remove('pulse');

        if (targetBullseye) {
          targetBullseye.classList.add('flash');
          setTimeout(() => {
            targetBullseye.classList.add('hit');
          }, 300);
        }

        generateHeartBloom();
        isBloomed = true;

        setTimeout(() => {
          bloomMessage.classList.remove('hidden');
          resetBtn.classList.remove('hidden');
          fireBtn.classList.add('hidden');
        }, 800);

      }, 550); // Flight duration

    }, 350); // Pull duration
  }

  function resetArchery() {
    isFiring = false;
    isBloomed = false;
    hearts = [];
    if (animId) cancelAnimationFrame(animId);
    ctx.clearRect(0, 0, bloomCanvas.width, bloomCanvas.height);

    cupidArrow.classList.remove('drawn', 'flying', 'struck');
    bowString.setAttribute('d', 'M 32,90 Q 160,90 288,90');

    if (targetBullseye) {
      targetBullseye.classList.remove('flash', 'hit');
    }

    bloomMessage.classList.add('hidden');
    resetBtn.classList.add('hidden');
    fireBtn.classList.remove('hidden');
    fireBtn.disabled = false;
    fireBtn.style.opacity = '1';
    heartBadge.textContent = '❤️ Target Ready';
  }

  // Event Listeners
  fireBtn.addEventListener('click', fire);
  resetBtn.addEventListener('click', resetArchery);

  // Click directly on archery stage to shoot
  archeryStage.addEventListener('click', () => {
    if (!isFiring) fire();
  });
});
