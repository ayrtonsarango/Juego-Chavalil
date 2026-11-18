/**
 * SOUND ENGINE - Web Audio API & MP3 Meme FX Engine
 * Soporta reproducción de archivos reales MP3 de la cuadrilla (bocina, auuu, faaah, oh_my_god, bing_chilling, etc.)
 * y síntesis procedural Web Audio API para el mapa overworld de Mario.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.audioPool = {};
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Reproduce un archivo de audio MP3 con control de volumen y gestión de interacción.
   */
  playAudio(src, volume = 0.85) {
    try {
      this.init();
      const audio = new Audio(src);
      audio.volume = Math.max(0, Math.min(1, volume));
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.log(`Audio autoplay pending user gesture: ${src}`);
        });
      }
      return audio;
    } catch (err) {
      console.warn(`Error playing audio ${src}:`, err);
      return null;
    }
  }

  // ================= MP3 MEME SOUNDS =================

  playAuu(vol = 0.9) { return this.playAudio('/audio/auuu.mp3', vol); }
  playBocina(vol = 0.9) { return this.playAudio('/audio/bocina.mp3', vol); }
  playFaaah(vol = 0.9) { return this.playAudio('/audio/faaah.mp3', vol); }
  playOhMyGod(vol = 0.9) { return this.playAudio('/audio/oh_my_god.mp3', vol); }
  playWarwick(vol = 0.9) { return this.playAudio('/audio/warwick.mp3', vol); }
  playDeathFortnite(vol = 0.9) { return this.playAudio('/audio/death_fortnite.mp3', vol); }
  playMemeViolin(vol = 0.85) { return this.playAudio('/audio/meme_violin.mp3', vol); }
  playDangerAlarm(vol = 0.85) { return this.playAudio('/audio/danger_alarm.mp3', vol); }
  playSocialCredit(vol = 0.9) { return this.playAudio('/audio/social_credit.mp3', vol); }
  playBingChilling(vol = 0.9) { return this.playAudio('/audio/bing_chilling.mp3', vol); }
  playLolMatchFound(vol = 0.95) { return this.playAudio('/audio/lol_match_found.mp3', vol); }
  playFirstBlood(vol = 0.95) { return this.playAudio('/audio/first_blood.mp3', vol); }
  playCsBingoBongo(vol = 0.9) { return this.playAudio('/audio/cs_bingo_bongo.mp3', vol); }
  playHarryPotter(vol = 0.85) { return this.playAudio('/audio/harry_potter.mp3', vol); }
  play50Cent(vol = 0.9) { return this.playAudio('/audio/50_cent.mp3', vol); }
  playChineseRingtone(vol = 0.85) { return this.playAudio('/audio/chinese_ringtone.mp3', vol); }
  playAllahAkbar(vol = 0.95) { return this.playAudio('/audio/allah_akbar.mp3', vol); }
  playNuggetCowboy(vol = 0.95) { return this.playAudio('/audio/nugget_cowboy.mp3', vol); }

  // Generic lookup by soundboard ID
  playSoundByName(soundName, vol = 0.9) {
    const map = {
      'auuu': '/audio/auuu.mp3',
      'bocina': '/audio/bocina.mp3',
      'faaah': '/audio/faaah.mp3',
      'oh_my_god': '/audio/oh_my_god.mp3',
      'warwick': '/audio/warwick.mp3',
      'death_fortnite': '/audio/death_fortnite.mp3',
      'meme_violin': '/audio/meme_violin.mp3',
      'danger_alarm': '/audio/danger_alarm.mp3',
      'social_credit': '/audio/social_credit.mp3',
      'bing_chilling': '/audio/bing_chilling.mp3',
      'lol_match_found': '/audio/lol_match_found.mp3',
      'first_blood': '/audio/first_blood.mp3',
      'cs_bingo_bongo': '/audio/cs_bingo_bongo.mp3',
      'harry_potter': '/audio/harry_potter.mp3',
      '50_cent': '/audio/50_cent.mp3',
      'chinese_ringtone': '/audio/chinese_ringtone.mp3',
      'allah_akbar': '/audio/allah_akbar.mp3',
      'nugget_cowboy': '/audio/nugget_cowboy.mp3'
    };
    if (map[soundName]) {
      return this.playAudio(map[soundName], vol);
    }
    // Fallback if not found
    return this.playHonk();
  }

  // Character Pick Themes
  playCharacterTheme(charId, optName = '') {
    const combined = `${charId || ''} ${optName || ''}`.toLowerCase();
    if (combined.includes('manu')) return this.playAllahAkbar();
    if (combined.includes('asier')) return this.playOhMyGod();
    if (combined.includes('lerga')) return this.playSoundByName('nugget_cowboy');
    if (combined.includes('adriachi') || combined.includes('adri')) return this.play50Cent();
    if (combined.includes('alel')) return this.playBocina();
    if (combined.includes('marta')) return this.playFaaah();
    if (combined.includes('violeta')) return this.playCsBingoBongo();
    if (combined.includes('ayrton')) return this.playAuu();
    if (combined.includes('djon') || combined.includes('dj')) return this.playBingChilling();
    if (combined.includes('hua')) return this.playChineseRingtone();
    if (combined.includes('eneko')) return this.playFirstBlood();
    if (combined.includes('yago')) return this.playWarwick();
    if (combined.includes('santi')) return this.playDangerAlarm();
    if (combined.includes('lucia')) return this.playHarryPotter();

    // Fallback: random meme for characters without specific theme
    const memes = ['nugget_cowboy', 'auuu', 'bocina', 'faaah', 'oh_my_god', 'bing_chilling', 'cs_bingo_bongo'];
    const rand = memes[Math.floor(Math.random() * memes.length)];
    return this.playSoundByName(rand);
  }

  // Meme Android Alert: Bocina + Auuu / Faaah / Chinese Ringtone
  playAndroidAlert() {
    this.playBocina(0.95);
    setTimeout(() => {
      const secondary = ['/audio/auuu.mp3', '/audio/faaah.mp3', '/audio/chinese_ringtone.mp3'];
      const chosen = secondary[Math.floor(Math.random() * secondary.length)];
      this.playAudio(chosen, 0.9);
    }, 600);
  }

  // Minigame Eliminations
  playDeathSound(isFirstBlood = false) {
    if (isFirstBlood) {
      return this.playFirstBlood(0.95);
    }
    if (Math.random() < 0.5) {
      return this.playDeathFortnite(0.9);
    } else {
      return this.playMemeViolin(0.85);
    }
  }

  // Minigame Victory / Social Credit
  playSocialCreditVictory() {
    return this.playSocialCredit(0.95);
  }

  // Minigame Preparation (LoL Match Found)
  playPreparationMatchFound() {
    return this.playLolMatchFound(0.95);
  }

  // ================= PROCEDURAL MARIO RETRO SOUNDS =================

  // Bocina / Honk retro o MP3
  playHonk() {
    this.playBocina(0.85);
  }

  playMarioCoin() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, now); // B5
    osc.frequency.setValueAtTime(1318.51, now + 0.08); // E6

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playStep() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = 220 + Math.random() * 80;
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.6, now + 0.06);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  playMarioWalk() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const pitch = 240 + Math.random() * 40;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.7, now + 0.07);

    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.07);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  playPipe() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [350, 300, 250, 200, 180];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.07);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.07);
    });
  }

  playMarioRunTrot() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    const pitch = 380 + Math.random() * 60;
    osc.frequency.setValueAtTime(pitch, now);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, now + 0.045);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.045);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  playCelebrationJump() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(580, now + 0.18);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playJump() {
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(500, now + 0.11);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.14);
    } catch (e) {
      // AudioContext muted/unsupported
    }
  }

  playLevelStartFanfare() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const melody = [
      { f: 392.00, t: 0.00, d: 0.10 },
      { f: 523.25, t: 0.09, d: 0.10 },
      { f: 659.25, t: 0.18, d: 0.10 },
      { f: 783.99, t: 0.27, d: 0.16 },
      { f: 1046.50, t: 0.44, d: 0.45 }
    ];

    melody.forEach(note => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, now + note.t);

      gain.gain.setValueAtTime(0.2, now + note.t);
      gain.gain.exponentialRampToValueAtTime(0.01, now + note.t + note.d);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + note.t);
      osc.stop(now + note.t + note.d);
    });
  }

  playFanfare() {
    this.playLevelStartFanfare();
  }

  playMysteryReveal() {
    this.playCelebrationJump();
  }

  playSwoosh() {
    try {
      const ctx = this.getCtx();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.13);
    } catch (e) {}
  }
}

// Global singleton instance
window.soundEngine = new SoundEngine();
