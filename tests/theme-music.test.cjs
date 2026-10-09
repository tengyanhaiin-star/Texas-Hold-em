const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const audioCode = html.slice(html.indexOf('var audioCtx=null;'), html.indexOf('function makeDeck()'));
const themeCode = html.slice(html.indexOf('var CARD_THEMES='), html.indexOf('function cardEl('));
const settle = () => new Promise(resolve => setImmediate(resolve));

function setup({ deferred = false, suspended = false, failFirst = false } = {}) {
  const sources = [], gains = [], oscillators = [], requests = [], pending = [];
  const events = [], listeners = {}, warnings = [];
  let decodeCount = 0;
  const ctx = {
    state: suspended ? 'suspended' : 'running', currentTime: 0, destination: {},
    resume() {
      if (this.state === 'running') return Promise.resolve();
      return new Promise(resolve => pending.push(() => { this.state = 'running'; resolve(); }));
    },
    decodeAudioData(data) { decodeCount++; return Promise.resolve({ url: data }); },
    createBufferSource() {
      const source = {
        connect() {}, disconnect() { this.disconnected = true; },
        start(...args) { this.args = args; events.push(['start', this.buffer.url]); },
        stop() { this.stopped = true; events.push(['stop', this.buffer.url]); }
      };
      sources.push(source);
      return source;
    },
    createGain() {
      const gain = {
        gain: { value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect() {}, disconnect() { this.disconnected = true; }
      };
      gains.push(gain);
      return gain;
    },
    createOscillator() {
      const osc = { frequency: { setValueAtTime() {} }, connect() {}, start() {}, stop() {} };
      oscillators.push(osc);
      return osc;
    }
  };
  const select = { value: 'svg-cards', appendChild() {}, addEventListener() {} };
  const sandbox = {
    window: { AudioContext: function() { return ctx; } },
    document: {
      body: { style: {} },
      addEventListener(name, fn) { listeners[name] = fn; },
      getElementById(id) {
        return id === 'card-theme-select' ? select : {
          classList: { toggle() {} }, style: { setProperty() {}, removeProperty() {} }
        };
      },
      querySelectorAll() { return []; }, createElement() { return {}; }
    },
    localStorage: { getItem() { return null; }, setItem() {} },
    console: { warn(...args) { warnings.push(args); } },
    fetch(url) {
      requests.push(url);
      const response = { ok: !(failFirst && requests.length === 1), status: 503, arrayBuffer: () => Promise.resolve(url) };
      return deferred ? new Promise(resolve => pending.push(() => resolve(response))) : Promise.resolve(response);
    }
  };
  vm.createContext(sandbox);
  vm.runInContext(audioCode + '\n' + themeCode, sandbox);
  return { sandbox, ctx, sources, gains, oscillators, requests, events, listeners, warnings,
    decoded: () => decodeCount, release: () => pending.splice(0).forEach(resolve => resolve()) };
}

test('all seven themes follow menu order and reference their supplied MP3s', () => {
  const { sandbox: s } = setup();
  const order = ['svg-cards', 'geometric-rhapsody', 'jinxiu-huazhang', 'blood-moon-castle', 'azure-holiday', 'cyber-epoch', 'star-voyage'];
  assert.deepEqual(Object.keys(s.CARD_THEMES), order);
  for (const theme of order) {
    assert.equal(s.CARD_THEMES[theme].music, `audio/${theme}.mp3`);
    assert.ok(fs.statSync(path.join(root, s.CARD_THEMES[theme].music)).size > 0);
  }
});

test('each entry starts at zero, loops, and stops before the next theme starts', async () => {
  const h = setup(), s = h.sandbox;
  for (const theme of ['svg-cards', 'geometric-rhapsody', 'jinxiu-huazhang', 'blood-moon-castle', 'azure-holiday', 'cyber-epoch', 'star-voyage', 'svg-cards', 'star-voyage', 'cyber-epoch', 'azure-holiday', 'jinxiu-huazhang']) {
    s.changeCardTheme(theme);
    await settle();
    const source = h.sources.at(-1);
    assert.equal(source.buffer.url, `audio/${theme}.mp3`);
    assert.equal(source.loop, true);
    assert.equal(source.loopStart, 0);
    assert.equal(source.loopEnd, { 'svg-cards': 80, 'geometric-rhapsody': 50, 'jinxiu-huazhang': 54, 'blood-moon-castle': 91, 'azure-holiday': 77, 'cyber-epoch': 48, 'star-voyage': 60 }[theme]);
    assert.deepEqual(source.args, [0, 0]);
    assert.equal(h.gains.at(-1).gain.value, 0.35);
    assert.equal(h.sources.filter(source => !source.stopped).length, 1);
  }
  assert.equal(h.requests.length, 7);
  assert.equal(h.decoded(), 7);
  assert.deepEqual(h.events.map(event => event[0]), ['start', 'stop', 'start', 'stop', 'start', 'stop', 'start', 'stop', 'start', 'stop', 'start', 'stop', 'start', 'stop', 'start', 'stop', 'start', 'stop', 'start', 'stop', 'start', 'stop', 'start']);
  s.stopThemeMusic();
  await settle();
  assert.equal(s.themeMusicSource, null);
  assert.equal(s.themeMusicGain, null);
  assert.ok(h.sources.every(source => source.stopped && source.disconnected));
  assert.ok(h.gains.every(gain => gain.disconnected));
  assert.equal(h.ctx.state, 'running');
});

test('leaving during loading prevents late playback', async () => {
  const h = setup({ deferred: true }), s = h.sandbox;
  s.changeCardTheme('svg-cards');
  s.changeCardTheme('blood-moon-castle');
  h.release();
  await settle();
  assert.equal(h.sources.length, 1);
  assert.equal(s.themeMusicSource.buffer.url, 'audio/blood-moon-castle.mp3');
});

test('rapid switches while all seven tracks load start only the latest theme once', async () => {
  const h = setup({ deferred: true }), s = h.sandbox;
  s.changeCardTheme('svg-cards');
  s.changeCardTheme('blood-moon-castle');
  s.changeCardTheme('geometric-rhapsody');
  s.changeCardTheme('svg-cards');
  s.changeCardTheme('star-voyage');
  s.changeCardTheme('cyber-epoch');
  s.changeCardTheme('azure-holiday');
  s.changeCardTheme('jinxiu-huazhang');
  h.listeners.click();
  h.listeners.keydown();
  h.release();
  await settle();
  assert.equal(h.requests.length, 7);
  assert.equal(h.sources.length, 1);
  assert.equal(h.sources[0].buffer.url, 'audio/jinxiu-huazhang.mp3');
  assert.equal(h.sources[0].loopEnd, 54);
});

test('an old suspended resume cannot start the previous theme after switching', async () => {
  const h = setup({ suspended: true }), s = h.sandbox;
  s.changeCardTheme('svg-cards');
  await settle();
  assert.equal(h.sources.length, 0);
  s.changeCardTheme('blood-moon-castle');
  h.release();
  await settle();
  assert.equal(h.sources.length, 1);
  assert.equal(h.sources[0].buffer.url, 'audio/blood-moon-castle.mp3');
});

test('unlocking a suspended context preserves the existing source', async () => {
  const h = setup(), s = h.sandbox;
  s.changeCardTheme('svg-cards');
  await settle();
  h.ctx.state = 'suspended';
  h.listeners.click();
  h.listeners.keydown();
  h.release();
  await settle();
  assert.equal(h.ctx.state, 'running');
  assert.equal(h.sources.length, 1);
  assert.equal(h.sources[0].stopped, undefined);
});

test('failed music loads can retry without disabling game sound effects', async () => {
  const h = setup({ failFirst: true }), s = h.sandbox;
  s.changeCardTheme('svg-cards');
  await settle();
  assert.equal(h.warnings.length, 1);
  assert.equal(h.sources.length, 0);
  h.listeners.click();
  await settle();
  assert.equal(h.sources.length, 1);
  s.changeCardTheme('blood-moon-castle');
  s.soundCheck();
  await settle();
  assert.equal(h.oscillators.length, 1);
  assert.equal(h.ctx.state, 'running');
});

test('switching themes does not render or reset game state or countdown', async () => {
  const h = setup(), s = h.sandbox;
  s.G = { phase: 'showdown', pot: 200 };
  const game = s.G;
  s.nextHandTimer = 123;
  s.render = () => assert.fail('theme switch must not re-render the game');
  s.clearInterval = () => assert.fail('theme switch must not clear the countdown');
  s.setInterval = () => assert.fail('theme switch must not restart the countdown');
  for (const theme of ['blood-moon-castle', 'geometric-rhapsody', 'jinxiu-huazhang', 'azure-holiday', 'cyber-epoch', 'star-voyage', 'svg-cards']) s.changeCardTheme(theme);
  await settle();
  assert.equal(s.G, game);
  assert.equal(s.G.pot, 200);
  assert.equal(s.nextHandTimer, 123);
});
