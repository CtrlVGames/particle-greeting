const GREETINGS = {
  KR: { text: '안녕', lang: '한국어' },
  JP: { text: 'こんにちは', lang: '日本語' },
  CN: { text: '你好',       lang: '中文' },
  TW: { text: '你好',       lang: '中文' },
  HK: { text: '你好',       lang: '中文' },
  US: { text: 'Hello',      lang: 'English' },
  GB: { text: 'Hello',      lang: 'English' },
  AU: { text: 'Hello',      lang: 'English' },
  CA: { text: 'Hello',      lang: 'English' },
  FR: { text: 'Bonjour',    lang: 'Français' },
  ES: { text: 'Hola',       lang: 'Español' },
  MX: { text: 'Hola',       lang: 'Español' },
  AR: { text: 'Hola',       lang: 'Español' },
  CO: { text: 'Hola',       lang: 'Español' },
  DE: { text: 'Hallo',      lang: 'Deutsch' },
  AT: { text: 'Hallo',      lang: 'Deutsch' },
  CH: { text: 'Hallo',      lang: 'Deutsch' },
  IT: { text: 'Ciao',       lang: 'Italiano' },
  PT: { text: 'Olá',        lang: 'Português' },
  BR: { text: 'Olá',        lang: 'Português' },
  RU: { text: 'Привет',     lang: 'Русский' },
  SA: { text: 'مرحبا',      lang: 'العربية' },
  AE: { text: 'مرحبا',      lang: 'العربية' },
  EG: { text: 'مرحبا',      lang: 'العربية' },
  IN: { text: 'नमस्ते',       lang: 'हिन्दी' },
  TH: { text: 'สวัสดี',      lang: 'ภาษาไทย' },
  VN: { text: 'Xin chào',   lang: 'Tiếng Việt' },
  ID: { text: 'Halo',       lang: 'Bahasa Indonesia' },
  NL: { text: 'Hallo',      lang: 'Nederlands' },
  SE: { text: 'Hej',        lang: 'Svenska' },
  NO: { text: 'Hei',        lang: 'Norsk' },
  DK: { text: 'Hej',        lang: 'Dansk' },
  FI: { text: 'Hei',        lang: 'Suomi' },
  PL: { text: 'Cześć',      lang: 'Polski' },
  TR: { text: 'Merhaba',    lang: 'Türkçe' },
  GR: { text: 'Γεια σας',   lang: 'Ελληνικά' },
};

const DEFAULT_GREETING = { text: 'Hello', lang: 'English' };

const COUNTRY_NAMES = {
  KR: 'South Korea', JP: 'Japan', CN: 'China', TW: 'Taiwan', HK: 'Hong Kong',
  US: 'United States', GB: 'United Kingdom', AU: 'Australia', CA: 'Canada',
  FR: 'France', ES: 'Spain', MX: 'Mexico', AR: 'Argentina', CO: 'Colombia',
  DE: 'Germany', AT: 'Austria', CH: 'Switzerland', IT: 'Italy',
  PT: 'Portugal', BR: 'Brazil', RU: 'Russia',
  SA: 'Saudi Arabia', AE: 'UAE', EG: 'Egypt',
  IN: 'India', TH: 'Thailand', VN: 'Vietnam', ID: 'Indonesia',
  NL: 'Netherlands', SE: 'Sweden', NO: 'Norway', DK: 'Denmark',
  FI: 'Finland', PL: 'Poland', TR: 'Turkey', GR: 'Greece',
};

async function _tryCloudflareTrace() {
  const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
    signal: AbortSignal.timeout(4000),
  });
  if (!res.ok) throw new Error();
  const text = await res.text();
  const match = text.match(/loc=([A-Z]{2})/);
  if (!match) throw new Error();
  return match[1];
}

async function _tryIpWhoIs() {
  const res = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error();
  const data = await res.json();
  if (!data.success) throw new Error();
  return (data.country_code || '').toUpperCase();
}

async function _tryCountryIs() {
  const res = await fetch('https://api.country.is/', { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error();
  const data = await res.json();
  return (data.country || '').toUpperCase();
}

async function detectGreeting() {
  const apis = [_tryCloudflareTrace, _tryIpWhoIs, _tryCountryIs];
  for (const api of apis) {
    try {
      const code = await api();
      if (code && code.length === 2) {
        const greeting = GREETINGS[code] || DEFAULT_GREETING;
        return { ...greeting, country: COUNTRY_NAMES[code] || code, countryCode: code };
      }
    } catch {
      // try next
    }
  }
  return { ...DEFAULT_GREETING, country: 'Unknown', countryCode: '' };
}
