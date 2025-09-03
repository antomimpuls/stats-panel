// settings-panel.js
(async function () {
  'use strict';

  // ===== НАСТРОЙКИ (динамические) =====
  const GITHUB_REPO_OWNER = 'antomimpuls';
  let   GITHUB_REPO_NAME  = 'gadanie-golos.ru'; // будет заменено
  const GITHUB_BRANCH     = 'main';
  const GITHUB_FILE_PATH  = 'index.html';

  let GITHUB_TOKEN = sessionStorage.getItem('github_token') || '';

  // ===== Стили и HTML (коротко) =====
  const styles = `<style>…</style>`; // оставь свой блок
  const modalHTML = `…`;            // оставь свой блок

  // ===== Утилиты =====
  function showStatus(msg, type = 'success') { /* … */ }

  // ===== Запрос токена =====
  async function requestTokenOnce() { /* … */ }

  // ===== GitHub API =====
  async function fetchFile() {
    if (!await requestTokenOnce()) throw new Error('Токен не предоставлен');
    const url = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    const data = await res.json();
    const content = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
    return { sha: data.sha, content };
  }

  async function saveFile(newContent, sha) { /* … */ }

  // ===== Парсер/сборщик =====
  function extractSettings(source) {
    const m = source.match(/const\s+SITE_SETTINGS\s*=\s*({[\s\S]*?});/);
    if (!m) throw new Error('SITE_SETTINGS не найден');
    const s = {};
    const ph = m[1].match(/['"]?phoneNumber['"]?\s*:\s*['"`]([^'"`]*)['"`]/);
    const ym = m[1].match(/['"]?yandexMetrikaId['"]?\s*:\s*['"`]([^'"`]*)['"`]/);
    if (ph) s.phoneNumber = ph[1];
    if (ym) s.yandexMetrikaId = ym[1];
    return { match: m[0], obj: s };
  }

  function replaceSettings(src, obj) { /* … */ }

  // ===== Основные операции =====
  async function loadSettings(site) {
    GITHUB_REPO_NAME = site; // ВАЖНО!
    try {
      showStatus('Загрузка...', 'success');
      const { content } = await fetchFile();
      const { obj } = extractSettings(content);
      populateForm(obj);
      showStatus('Данные загружены ✅', 'success');
    } catch (e) {
      showStatus(`Ошибка загрузки: ${e.message}`, 'error');
    }
  }

  async function saveSettings(site) {
    GITHUB_REPO_NAME = site; // ВАЖНО!
    try {
      showStatus('Сохранение...', 'success');
      const { content, sha } = await fetchFile();
      const { obj } = extractSettings(content);
      obj.phoneNumber   = document.getElementById('settingPhoneNumber').value.trim();
      obj.yandexMetrikaId = document.getElementById('settingYandexMetrikaId').value.trim();
      const newSrc = replaceSettings(content, obj);
      await saveFile(newSrc, sha);
      showStatus('Сохранено ✅', 'success');
      setTimeout(closeSettingsModal, 1500);
    } catch (e) {
      showStatus(`Ошибка сохранения: ${e.message}`, 'error');
    }
  }

  // ===== Управление модальным окном =====
  function openSettingsModal(site) {
    document.getElementById('modalSiteName').textContent = site;
    document.getElementById('settingsModal').style.display = 'flex';
    const statusMsg = document.getElementById('settingStatusMessage');
    if (statusMsg) statusMsg.style.display = 'none';
    loadSettings(site);
  }

  function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
  }

  // ===== Инициализация =====
  function init() {
    const styleElement = document.createElement('div');
    styleElement.id = 'settings-modal-styles';
    styleElement.innerHTML = styles;
    document.head.appendChild(styleElement);

    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement.firstElementChild);

    const modal = document.getElementById('settingsModal');
    modal.querySelector('.close').onclick = closeSettingsModal;
    document.getElementById('cancelSettingsBtn').onclick = closeSettingsModal;
    document.getElementById('saveSettingsBtn').onclick = () => {
      const site = document.getElementById('modalSiteName').textContent;
      if (site) saveSettings(site);
    };
    window.onclick = e => { if (e.target === modal) closeSettingsModal(); };
    document.onkeydown = e => { if (e.key === 'Escape' && modal.style.display === 'flex') closeSettingsModal(); };

    window.openSettingsModal = openSettingsModal;
  }

  init();
})();
