const { getJson, getText } = require('../lib/http');
const { allowApi } = require('../lib/antiBan');
const { sendMenu } = require('../lib/interactive');

function apiGate(key) {
  const a = allowApi(key);
  if (!a.ok) return 'Slow down — wait ' + Math.ceil(a.waitMs / 1000) + 's (anti-spam).';
  return null;
}

async function safe(fn, reply) {
  try {
    await fn();
  } catch (e) {
    await reply('API error: ' + (e.message || 'failed') + '. Try again later.');
  }
}

function clip(s, n = 900) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

const cmds = [
  // —— Weather ——
  {
    name: 'weather',
    pattern: 'weather',
    aliases: ['wttr', 'cuaca'],
    desc: 'Weather for a city (wttr.in)',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('weather');
      if (gate) return reply(gate);
      const city = (arg || 'Karachi').trim().replace(/\s+/g, '+');
      await safe(async () => {
        const t = await getText('https://wttr.in/' + encodeURIComponent(city) + '?format=%l:+%c+%t+(feels+%f)+Humidity+%h+Wind+%w', { ua: 'curl/8.0' });
        await reply(String(t).trim() || 'No data');
      }, reply);
    },
  },
  {
    name: 'forecast',
    pattern: 'forecast',
    aliases: ['fcast'],
    desc: 'Short forecast text',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('forecast');
      if (gate) return reply(gate);
      const city = (arg || 'Karachi').trim();
      await safe(async () => {
        const j = await getJson('https://wttr.in/' + encodeURIComponent(city) + '?format=j1', { ua: 'curl/8.0' });
        const cur = j.current_condition?.[0];
        const d0 = j.weather?.[0];
        if (!cur) return reply('No forecast');
        await reply(
          clip(
            city +
              '\nNow: ' +
              cur.temp_C +
              'C ' +
              (cur.weatherDesc?.[0]?.value || '') +
              '\nHumidity ' +
              cur.humidity +
              '% | Wind ' +
              cur.windspeedKmph +
              ' km/h' +
              (d0
                ? '\nToday max ' + d0.maxtempC + 'C / min ' + d0.mintempC + 'C'
                : '')
          )
        );
      }, reply);
    },
  },
  {
    name: 'sunrise',
    pattern: 'sunrise',
    aliases: ['sunset', 'sun'],
    desc: 'Sunrise/sunset for lat,lng or RYK default',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('sunrise');
      if (gate) return reply(gate);
      let lat = 28.42,
        lng = 70.3;
      if (arg && arg.includes(',')) {
        const [a, b] = arg.split(',').map((x) => parseFloat(x.trim()));
        if (!isNaN(a) && !isNaN(b)) {
          lat = a;
          lng = b;
        }
      }
      await safe(async () => {
        const j = await getJson(
          'https://api.sunrise-sunset.org/json?lat=' + lat + '&lng=' + lng + '&formatted=0'
        );
        const r = j.results;
        await reply(
          'Lat ' +
            lat +
            ' Lng ' +
            lng +
            '\nSunrise: ' +
            new Date(r.sunrise).toUTCString() +
            '\nSunset: ' +
            new Date(r.sunset).toUTCString() +
            '\nDay length: ' +
            r.day_length +
            's'
        );
      }, reply);
    },
  },

  // —— Prayer / Quran ——
  {
    name: 'pray',
    pattern: 'pray',
    aliases: ['prayer', 'namaz', 'salah'],
    desc: 'Prayer times by city',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('pray');
      if (gate) return reply(gate);
      const city = (arg || 'Karachi').trim();
      await safe(async () => {
        const j = await getJson(
          'https://api.aladhan.com/v1/timingsByCity?city=' +
            encodeURIComponent(city) +
            '&country=Pakistan&method=1'
        );
        const t = j.data?.timings;
        if (!t) return reply('No timings');
        await reply(
          'Prayer · ' +
            city +
            '\nFajr ' +
            t.Fajr +
            '\nDhuhr ' +
            t.Dhuhr +
            '\nAsr ' +
            t.Asr +
            '\nMaghrib ' +
            t.Maghrib +
            '\nIsha ' +
            t.Isha +
            '\nSunrise ' +
            t.Sunrise
        );
      }, reply);
    },
  },
  {
    name: 'ayah',
    pattern: 'ayah',
    aliases: ['quran'],
    desc: 'Quran ayah e.g. .ayah 2:255',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('ayah');
      if (gate) return reply(gate);
      const ref = (arg || '1:1').trim();
      await safe(async () => {
        const j = await getJson('https://api.alquran.cloud/v1/ayah/' + encodeURIComponent(ref) + '/en.asad');
        const d = j.data;
        await reply(clip((d.surah?.englishName || '') + ' ' + d.numberInSurah + '\n' + d.text));
      }, reply);
    },
  },
  {
    name: 'bible',
    pattern: 'bible',
    aliases: ['verse'],
    desc: 'Bible verse e.g. .bible john 3:16',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('bible');
      if (gate) return reply(gate);
      const q = (arg || 'john 3:16').trim();
      await safe(async () => {
        const j = await getJson('https://bible-api.com/' + encodeURIComponent(q));
        await reply(clip((j.reference || q) + '\n' + (j.text || '').trim()));
      }, reply);
    },
  },

  // —— Currency / crypto ——
  {
    name: 'rate',
    pattern: 'rate',
    aliases: ['fx', 'currency'],
    desc: 'FX rate .rate USD PKR',
    category: 'api',
    async handler({ reply, arg, args }) {
      const gate = apiGate('rate');
      if (gate) return reply(gate);
      const from = (args[0] || 'USD').toUpperCase();
      const to = (args[1] || 'PKR').toUpperCase();
      await safe(async () => {
        const j = await getJson(
          'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/' +
            from.toLowerCase() +
            '.json'
        );
        const map = j[from.toLowerCase()] || {};
        const v = map[to.toLowerCase()];
        if (v == null) return reply('Unknown pair');
        await reply('1 ' + from + ' = ' + Number(v).toFixed(4) + ' ' + to);
      }, reply);
    },
  },
  {
    name: 'crypto',
    pattern: 'crypto',
    aliases: ['btc', 'coin'],
    desc: 'Crypto prices (CoinGecko)',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('crypto');
      if (gate) return reply(gate);
      const ids = (arg || 'bitcoin,ethereum').replace(/\s+/g, '');
      await safe(async () => {
        const j = await getJson(
          'https://api.coingecko.com/api/v3/simple/price?ids=' +
            encodeURIComponent(ids) +
            '&vs_currencies=usd,pkr'
        );
        const lines = Object.keys(j).map((k) => {
          const o = j[k];
          return k + ': $' + o.usd + (o.pkr != null ? ' | PKR ' + o.pkr : '');
        });
        await reply(lines.join('\n') || 'No data (rate limited?)');
      }, reply);
    },
  },

  // —— Knowledge ——
  {
    name: 'define',
    pattern: 'define',
    aliases: ['dict', 'meaning'],
    desc: 'Dictionary definition',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('define');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .define word');
      await safe(async () => {
        const j = await getJson(
          'https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(arg.trim())
        );
        const e = Array.isArray(j) ? j[0] : null;
        if (!e) return reply('Not found');
        const m = e.meanings?.[0];
        const def = m?.definitions?.[0]?.definition || '';
        await reply(clip(e.word + ' (' + (m?.partOfSpeech || '') + ')\n' + def));
      }, reply);
    },
  },
  {
    name: 'synonym',
    pattern: 'synonym',
    aliases: ['syn'],
    desc: 'Synonyms via Datamuse',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('syn');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .synonym happy');
      await safe(async () => {
        const j = await getJson(
          'https://api.datamuse.com/words?rel_syn=' + encodeURIComponent(arg.trim()) + '&max=12'
        );
        await reply(j.map((x) => x.word).join(', ') || 'None');
      }, reply);
    },
  },
  {
    name: 'rhyme',
    pattern: 'rhyme',
    aliases: ['rhymes'],
    desc: 'Rhyming words',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('rhyme');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .rhyme blue');
      await safe(async () => {
        const j = await getJson(
          'https://api.datamuse.com/words?rel_rhy=' + encodeURIComponent(arg.trim()) + '&max=12'
        );
        await reply(j.map((x) => x.word).join(', ') || 'None');
      }, reply);
    },
  },
  {
    name: 'translate',
    pattern: 'translate',
    aliases: ['tr'],
    desc: 'Translate via MyMemory .tr en|ur hello',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('tr');
      if (gate) return reply(gate);
      // .tr en|ur text   or  .tr ur hello
      let pair = 'en|ur',
        text = arg || '';
      const m = String(arg || '').match(/^([a-z]{2})\|([a-z]{2})\s+(.+)$/i);
      if (m) {
        pair = m[1].toLowerCase() + '|' + m[2].toLowerCase();
        text = m[3];
      } else {
        const m2 = String(arg || '').match(/^([a-z]{2})\s+(.+)$/i);
        if (m2) {
          pair = 'en|' + m2[1].toLowerCase();
          text = m2[2];
        }
      }
      if (!text) return reply('Usage: .tr en|ur Hello');
      await safe(async () => {
        const j = await getJson(
          'https://api.mymemory.translated.net/get?q=' +
            encodeURIComponent(text) +
            '&langpair=' +
            encodeURIComponent(pair)
        );
        await reply(clip(j.responseData?.translatedText || 'No translation'));
      }, reply);
    },
  },

  // —— GitHub / npm ——
  {
    name: 'github',
    pattern: 'github',
    aliases: ['gh'],
    desc: 'GitHub user or repo user/repo',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('gh');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .gh octocat  or  .gh user/repo');
      await safe(async () => {
        if (arg.includes('/')) {
          const j = await getJson('https://api.github.com/repos/' + arg.trim());
          await reply(
            clip(
              j.full_name +
                '\n' +
                (j.description || '') +
                '\nStars ' +
                j.stargazers_count +
                ' | Forks ' +
                j.forks_count +
                '\n' +
                (j.html_url || '')
            )
          );
        } else {
          const j = await getJson('https://api.github.com/users/' + arg.trim());
          await reply(
            clip(
              j.login +
                ' · ' +
                (j.name || '') +
                '\nRepos ' +
                j.public_repos +
                ' | Followers ' +
                j.followers +
                '\n' +
                (j.bio || '') +
                '\n' +
                (j.html_url || '')
            )
          );
        }
      }, reply);
    },
  },
  {
    name: 'npm',
    pattern: 'npm',
    aliases: ['pkg'],
    desc: 'npm package info',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('npm');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .npm baileys');
      await safe(async () => {
        const j = await getJson('https://registry.npmjs.org/' + encodeURIComponent(arg.trim()) + '/latest');
        await reply(
          clip(
            j.name +
              '@' +
              j.version +
              '\n' +
              (j.description || '') +
              '\nLicense ' +
              (j.license || '?')
          )
        );
      }, reply);
    },
  },

  // —— Fun APIs ——
  {
    name: 'advice',
    pattern: 'advice',
    aliases: ['slip'],
    desc: 'Random advice',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('advice');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://api.adviceslip.com/advice');
        await reply(j.slip?.advice || '?');
      }, reply);
    },
  },
  {
    name: 'zenquote',
    pattern: 'zenquote',
    aliases: ['zquote'],
    desc: 'Zen quote',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('zen');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://zenquotes.io/api/random');
        const q = Array.isArray(j) ? j[0] : j;
        await reply(clip('"' + (q.q || '') + '" — ' + (q.a || '')));
      }, reply);
    },
  },
  {
    name: 'apijoke',
    pattern: 'apijoke',
    aliases: ['jjoke'],
    desc: 'Joke from JokeAPI',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('jjoke');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://v2.jokeapi.dev/joke/Any?type=single&safe-mode');
        await reply(clip(j.joke || j.setup || '?'));
      }, reply);
    },
  },
  {
    name: 'chuck',
    pattern: 'chuck',
    aliases: ['norris'],
    desc: 'Chuck Norris joke',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('chuck');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://api.chucknorris.io/jokes/random');
        await reply(clip(j.value));
      }, reply);
    },
  },
  {
    name: 'factapi',
    pattern: 'factapi',
    aliases: ['ufact'],
    desc: 'Useless fact',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('ufact');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://uselessfacts.jsph.pl/api/v2/facts/random');
        await reply(clip(j.text));
      }, reply);
    },
  },
  {
    name: 'catfact',
    pattern: 'catfact',
    aliases: ['meowfact'],
    desc: 'Cat fact',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('catfact');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://catfact.ninja/fact');
        await reply(clip(j.fact));
      }, reply);
    },
  },
  {
    name: 'bored',
    pattern: 'bored',
    aliases: ['activity'],
    desc: 'Something to do',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('bored');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://bored-api.appbrewery.com/random');
        await reply(clip((j.activity || '?') + (j.type ? ' [' + j.type + ']' : '')));
      }, reply);
    },
  },
  {
    name: 'yesno',
    pattern: 'yesno',
    aliases: ['yn'],
    desc: 'Yes or no',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('yesno');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://yesno.wtf/api');
        await reply(String(j.answer || '?').toUpperCase());
      }, reply);
    },
  },

  // —— Names ——
  {
    name: 'agify',
    pattern: 'agify',
    aliases: ['guessage'],
    desc: 'Guess age from name',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('agify');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .agify Ali');
      await safe(async () => {
        const j = await getJson('https://api.agify.io?name=' + encodeURIComponent(arg.trim()));
        await reply(j.name + ' → age guess ' + j.age + ' (n=' + j.count + ')');
      }, reply);
    },
  },
  {
    name: 'genderize',
    pattern: 'genderize',
    aliases: ['guessgender'],
    desc: 'Guess gender from name',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('gender');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .genderize Sara');
      await safe(async () => {
        const j = await getJson('https://api.genderize.io?name=' + encodeURIComponent(arg.trim()));
        await reply(j.name + ' → ' + j.gender + ' (' + Math.round((j.probability || 0) * 100) + '%)');
      }, reply);
    },
  },
  {
    name: 'nationalize',
    pattern: 'nationalize',
    aliases: ['nation'],
    desc: 'Guess nationality from name',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('nation');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .nation Ali');
      await safe(async () => {
        const j = await getJson('https://api.nationalize.io?name=' + encodeURIComponent(arg.trim()));
        const top = (j.country || []).slice(0, 3).map((c) => c.country_id + ' ' + Math.round(c.probability * 100) + '%');
        await reply(j.name + ' → ' + (top.join(', ') || '?'));
      }, reply);
    },
  },

  // —— Media / images (URL only) ——
  {
    name: 'dog',
    pattern: 'dog',
    aliases: ['woof'],
    desc: 'Random dog image URL',
    category: 'api',
    async handler({ reply, sock, jid, m }) {
      const gate = apiGate('dog');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://dog.ceo/api/breeds/image/random');
        const url = j.message;
        try {
          await sock.sendMessage(jid, { image: { url }, caption: 'Dog' }, { quoted: m });
        } catch {
          await reply(url);
        }
      }, reply);
    },
  },
  {
    name: 'cat',
    pattern: 'cat',
    aliases: ['kitty'],
    desc: 'Random cat image',
    category: 'api',
    async handler({ reply, sock, jid, m }) {
      const gate = apiGate('cat');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://api.thecatapi.com/v1/images/search');
        const url = j[0]?.url;
        if (!url) return reply('No cat');
        try {
          await sock.sendMessage(jid, { image: { url }, caption: 'Cat' }, { quoted: m });
        } catch {
          await reply(url);
        }
      }, reply);
    },
  },
  {
    name: 'fox',
    pattern: 'fox',
    aliases: ['floof'],
    desc: 'Random fox image',
    category: 'api',
    async handler({ reply, sock, jid, m }) {
      const gate = apiGate('fox');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://randomfox.ca/floof/');
        try {
          await sock.sendMessage(jid, { image: { url: j.image }, caption: 'Fox' }, { quoted: m });
        } catch {
          await reply(j.image);
        }
      }, reply);
    },
  },
  {
    name: 'qr',
    pattern: 'qr',
    aliases: ['qrcode'],
    desc: 'QR code from text',
    category: 'api',
    async handler({ reply, arg, sock, jid, m }) {
      const gate = apiGate('qr');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .qr hello');
      const url =
        'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(arg);
      try {
        await sock.sendMessage(jid, { image: { url }, caption: clip(arg, 80) }, { quoted: m });
      } catch {
        await reply(url);
      }
    },
  },

  // —— Entertainment ——
  {
    name: 'tv',
    pattern: 'tv',
    aliases: ['show'],
    desc: 'TV show search (TVmaze)',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('tv');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .tv friends');
      await safe(async () => {
        const j = await getJson('https://api.tvmaze.com/search/shows?q=' + encodeURIComponent(arg));
        const s = j[0]?.show;
        if (!s) return reply('Not found');
        await reply(
          clip(
            s.name +
              ' (' +
              (s.premiered || '?') +
              ')\n' +
              (s.genres || []).join(', ') +
              '\nRating ' +
              (s.rating?.average || '?') +
              '\n' +
              (s.summary || '').replace(/<[^>]+>/g, '')
          )
        );
      }, reply);
    },
  },
  {
    name: 'pokemon',
    pattern: 'pokemon',
    aliases: ['poke'],
    desc: 'Pokemon info',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('poke');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .poke pikachu');
      await safe(async () => {
        const j = await getJson('https://pokeapi.co/api/v2/pokemon/' + encodeURIComponent(arg.trim().toLowerCase()));
        const types = (j.types || []).map((t) => t.type.name).join(', ');
        await reply(j.name + ' #' + j.id + '\nTypes: ' + types + '\nHeight ' + j.height + ' Weight ' + j.weight);
      }, reply);
    },
  },
  {
    name: 'trivia',
    pattern: 'trivia',
    aliases: ['quizapi'],
    desc: 'Trivia question (interactive)',
    category: 'api',
    async handler(ctx) {
      const { reply } = ctx;
      const gate = apiGate('trivia');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://opentdb.com/api.php?amount=1&type=multiple');
        const q = j.results?.[0];
        if (!q) return reply('No question');
        const correct = decodeHtml(q.correct_answer);
        const opts = [...q.incorrect_answers.map(decodeHtml), correct].sort(() => Math.random() - 0.5);
        await sendMenu(
          ctx,
          decodeHtml(q.question) + '\n[' + q.category + ']',
          opts.map((label) => ({
            label,
            async run(c) {
              await c.reply(label === correct ? 'Correct' : 'Wrong — answer: ' + correct);
            },
          }))
        );
      }, reply);
    },
  },
  {
    name: 'itunes',
    pattern: 'itunes',
    aliases: ['song'],
    desc: 'Search iTunes song',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('itunes');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .song coldplay');
      await safe(async () => {
        const j = await getJson(
          'https://itunes.apple.com/search?term=' + encodeURIComponent(arg) + '&entity=song&limit=3'
        );
        const lines = (j.results || []).map(
          (r) => r.trackName + ' — ' + r.artistName + (r.previewUrl ? '\n' + r.previewUrl : '')
        );
        await reply(clip(lines.join('\n\n') || 'None'));
      }, reply);
    },
  },
  {
    name: 'lyrics',
    pattern: 'lyrics',
    aliases: ['lyric'],
    desc: 'Lyrics .lyrics Artist | Title',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('lyrics');
      if (gate) return reply(gate);
      if (!arg || !arg.includes('|')) return reply('Usage: .lyrics Coldplay | Yellow');
      const [artist, title] = arg.split('|').map((s) => s.trim());
      await safe(async () => {
        const j = await getJson(
          'https://api.lyrics.ovh/v1/' + encodeURIComponent(artist) + '/' + encodeURIComponent(title)
        );
        await reply(clip(j.lyrics || 'Not found', 1500));
      }, reply);
    },
  },

  // —— Geo / net ——
  {
    name: 'ip',
    pattern: 'ip',
    aliases: ['myip'],
    desc: 'Server public IP (not your phone)',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('ip');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://api.ipify.org?format=json');
        await reply('Bot host IP: ' + j.ip);
      }, reply);
    },
  },
  {
    name: 'country',
    pattern: 'country',
    aliases: ['countryd'],
    desc: 'Country info',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('country');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .country Pakistan');
      await safe(async () => {
        const j = await getJson(
          'https://restcountries.com/v3.1/name/' + encodeURIComponent(arg.trim()) + '?fields=name,capital,population,region,currencies,languages'
        );
        const c = Array.isArray(j) ? j[0] : j;
        await reply(
          clip(
            (c.name?.common || arg) +
              '\nCapital: ' +
              (c.capital || []).join(', ') +
              '\nRegion: ' +
              c.region +
              '\nPop: ' +
              c.population
          )
        );
      }, reply);
    },
  },
  {
    name: 'quake',
    pattern: 'quake',
    aliases: ['earthquake'],
    desc: 'Recent significant quakes',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('quake');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson(
          'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson'
        );
        const feats = (j.features || []).slice(0, 5);
        if (!feats.length) return reply('No significant quakes this week');
        await reply(
          feats
            .map((f) => {
              const p = f.properties;
              return 'M' + p.mag + ' · ' + p.place + '\n' + new Date(p.time).toUTCString();
            })
            .join('\n\n')
        );
      }, reply);
    },
  },
  {
    name: 'dns',
    pattern: 'dns',
    aliases: ['resolve'],
    desc: 'DNS A record via Google DNS',
    category: 'api',
    async handler({ reply, arg }) {
      const gate = apiGate('dns');
      if (gate) return reply(gate);
      if (!arg) return reply('Usage: .dns example.com');
      await safe(async () => {
        const j = await getJson(
          'https://dns.google/resolve?name=' + encodeURIComponent(arg.trim()) + '&type=A'
        );
        const ans = (j.Answer || []).map((a) => a.data).join(', ');
        await reply(arg + ' → ' + (ans || 'no A record'));
      }, reply);
    },
  },

  // —— Random user / fake ——
  {
    name: 'fakeuser',
    pattern: 'fakeuser',
    aliases: ['randuser'],
    desc: 'Random fake profile',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('fakeuser');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://randomuser.me/api/');
        const u = j.results?.[0];
        if (!u) return reply('Fail');
        await reply(
          u.name.first +
            ' ' +
            u.name.last +
            '\n' +
            u.location.city +
            ', ' +
            u.location.country +
            '\n' +
            u.email
        );
      }, reply);
    },
  },
  {
    name: 'carddeck',
    pattern: 'carddeck',
    aliases: ['shuffle'],
    desc: 'Shuffle a deck',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('deck');
      if (gate) return reply(gate);
      await safe(async () => {
        const j = await getJson('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
        await reply('Deck ' + j.deck_id + ' · remaining ' + j.remaining);
      }, reply);
    },
  },
  {
    name: 'drawcard',
    pattern: 'drawcard',
    aliases: ['draw'],
    desc: 'Draw from new shuffled deck',
    category: 'api',
    async handler({ reply }) {
      const gate = apiGate('draw');
      if (gate) return reply(gate);
      await safe(async () => {
        const d = await getJson('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1');
        const j = await getJson(
          'https://deckofcardsapi.com/api/deck/' + d.deck_id + '/draw/?count=1'
        );
        const c = j.cards?.[0];
        await reply(c ? c.value + ' of ' + c.suit : 'No card');
      }, reply);
    },
  },

  // —— Interactive hubs ——
  {
    name: 'apimenu',
    pattern: 'apimenu',
    aliases: ['apihelp', 'online'],
    desc: 'Interactive API command menu',
    category: 'api',
    async handler(ctx) {
      await sendMenu(ctx, 'API tools — pick a number', [
        {
          label: 'Weather Karachi',
          async run(c) {
            c.arg = 'Karachi';
            await cmds.find((x) => x.pattern === 'weather').handler(c);
          },
        },
        {
          label: 'Prayer times',
          async run(c) {
            c.arg = 'Karachi';
            await cmds.find((x) => x.pattern === 'pray').handler(c);
          },
        },
        {
          label: 'USD to PKR',
          async run(c) {
            c.args = ['USD', 'PKR'];
            c.arg = 'USD PKR';
            await cmds.find((x) => x.pattern === 'rate').handler(c);
          },
        },
        {
          label: 'Random advice',
          async run(c) {
            await cmds.find((x) => x.pattern === 'advice').handler(c);
          },
        },
        {
          label: 'Trivia quiz',
          async run(c) {
            await cmds.find((x) => x.pattern === 'trivia').handler(c);
          },
        },
        {
          label: 'Dog image',
          async run(c) {
            await cmds.find((x) => x.pattern === 'dog').handler(c);
          },
        },
        {
          label: 'Crypto BTC/ETH',
          async run(c) {
            c.arg = 'bitcoin,ethereum';
            await cmds.find((x) => x.pattern === 'crypto').handler(c);
          },
        },
        {
          label: 'Useless fact',
          async run(c) {
            await cmds.find((x) => x.pattern === 'factapi').handler(c);
          },
        },
      ]);
    },
  },
  {
    name: 'funapi',
    pattern: 'funapi',
    aliases: ['funmenu'],
    desc: 'Interactive fun API menu',
    category: 'api',
    async handler(ctx) {
      await sendMenu(ctx, 'Fun APIs', [
        { label: 'Joke', run: (c) => cmds.find((x) => x.pattern === 'apijoke').handler(c) },
        { label: 'Chuck', run: (c) => cmds.find((x) => x.pattern === 'chuck').handler(c) },
        { label: 'Yes/No', run: (c) => cmds.find((x) => x.pattern === 'yesno').handler(c) },
        { label: 'Bored idea', run: (c) => cmds.find((x) => x.pattern === 'bored').handler(c) },
        { label: 'Cat fact', run: (c) => cmds.find((x) => x.pattern === 'catfact').handler(c) },
        { label: 'Zen quote', run: (c) => cmds.find((x) => x.pattern === 'zenquote').handler(c) },
      ]);
    },
  },
];

function decodeHtml(s) {
  return String(s || '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

module.exports = cmds;
