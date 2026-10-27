const LANG_KEY = 'pixuli-site-lang';
const THEME_KEY = 'pixuli-site-theme';

function currentLang(): 'zh' | 'en' {
  return document.documentElement.dataset.lang === 'en' ? 'en' : 'zh';
}

function applyLang(lang: 'zh' | 'en'): void {
  document.documentElement.dataset.lang = lang;
  document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
  document.title =
    lang === 'en'
      ? 'Pixuli — A local-first workspace for your files'
      : 'Pixuli — 本地优先的资源工作区';
  localStorage.setItem(LANG_KEY, lang);
}

function applyTheme(mode: 'light' | 'dark'): void {
  const dark = mode === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, mode);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#1e1b4b' : '#7c6cf0');
}

const langToggle = document.querySelector<HTMLButtonElement>('#lang-toggle');
langToggle?.addEventListener('click', () => {
  applyLang(currentLang() === 'zh' ? 'en' : 'zh');
});

const themeToggle = document.querySelector<HTMLButtonElement>('#theme-toggle');
themeToggle?.addEventListener('click', () => {
  const dark = document.documentElement.classList.contains('dark');
  applyTheme(dark ? 'light' : 'dark');
});
