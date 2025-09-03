// settings-panel.js
// Модуль для отображения и редактирования настроек сайта из GitHub
(async function () {
  'use strict';

  // ===== НАСТРОЙКИ И КОНСТАНТЫ =====
  const GITHUB_REPO_OWNER = 'antomimpuls';
  const GITHUB_REPO_NAME  = 'gadanie-golos.ru';
  const GITHUB_BRANCH     = 'main';
  const GITHUB_FILE_PATH  = 'index.html';

  // --- токен берём из sessionStorage ---
  let GITHUB_TOKEN = sessionStorage.getItem('github_token') || '';

  console.log('Settings panel initialized');

  // ===== СТИЛИ =====
  const styles = `
    <style>
      :root {
        --bg: #0a0a0f;
        --card: #1a1a25;
        --accent: #b388eb;
        --text: #fff;
        --success: #28a745;
        --danger: #ff4757;
      }
      #settingsModal{display:none;position:fixed;z-index:10000;left:0;top:0;width:100%;height:100%;background:rgba(0,0,0,.7);justify-content:center;align-items:center;padding:20px;box-sizing:border-box}
      .modal-content{background:var(--card);color:var(--text);border-radius:10px;max-width:500px;width:100%;max-height:90vh;overflow-y:auto;padding:25px;display:flex;flex-direction:column;gap:15px}
      .modal-header{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--accent);padding-bottom:10px}
      .close{background:0 0;border:0;font-size:1.8em;cursor:pointer;color:var(--text);opacity:.7}
      .close:hover{opacity:1}
      .input-group{margin-bottom:1rem}
      .input-group label{display:block;margin-bottom:.5rem;font-size:.9rem;color:#aaa}
      .input-group input{width:100%;padding:10px;background:var(--bg);border:1px solid #333;border-radius:6px;color:var(--text)}
      .modal-footer{display:flex;justify-content:flex-end;gap:15px;margin-top:20px;border-top:1px solid #333;padding-top:20px}
      .btn{border:0;border-radius:6px;padding:10px 20px;font-weight:700;cursor:pointer}
      .btn.save{background:var(--accent);color:var(--bg)}
      .btn.cancel{background:#6c757d;color:var(--text)}
      .status-message{padding:10px;border-radius:5px;text-align:center;display:none}
      .status-success{background:rgba(40,167,69,.2);color:var(--success);border:1px solid var(--success)}
      .status-error{background:rgba(220,53,69,.2);color:var(--danger);border:1px solid var(--danger)}
    </style>
  `;

  // ===== HTML =====
  const modalHTML = `
    <div id="settingsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Настройки сайта <span id="modalSiteName"></span></h2>
          <button class="close">&times;</button>
        </div>
        <div id="settingStatusMessage" class="status-message"></div>
        <div class="input-group">
          <label>Номер телефона:</label>
          <input id="settingPhoneNumber" type="text" placeholder="+7 XXX XXX XX XX" />
        </div>
        <div class="input-group">
          <label>ID Яндекс.Метрики:</label>
          <input id="settingYandexMetrikaId" type="text" placeholder="12345678" />
        </div>
        <div class="modal-footer">
          <button class="btn cancel" id="cancelSettingsBtn">Отмена</button>
          <button class="btn save" id="saveSettingsBtn">Сохранить</button>
        </div>
      </div>
    </div>
  `;

  // ===== Утилиты =====
  function showStatus(msg, type = 'success') {
    const el = document.getElementById('settingStatusMessage');
    if (!el) return;
    el.textContent = msg;
    el.className = `status-message status-${type}`;
    el.style.display = 'block';
    setTimeout(() => { if (el.textContent === msg) el.style.display = 'none'; }, 5000);
  }

  function populateForm(settings) {
    if (!settings) return;
    document.getElementById('settingPhoneNumber').value   = settings.phoneNumber || '';
    document.getElementById('settingYandexMetrikaId').value = settings.yandexMetrikaId || '';
  }

  // ===== Запрос токена =====
  async function requestTokenOnce() {
    if (GITHUB_TOKEN) return true;
    const raw = prompt('Введите GitHub Personal Access Token (только один раз за сессию):');
    if (!raw) return false;
    GITHUB_TOKEN = raw.trim();
    sessionStorage.setItem('github_token', GITHUB_TOKEN);
    return true;
  }

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
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`GitHub API error: ${res.status} - ${txt}`);
    }
    const data = await res.json();
    const content = new TextDecoder().decode(Uint8Array.from(atob(data.content), c => c.charCodeAt(0)));
    return { sha: data.sha, content };
  }

  async function saveFile(newContent, sha) {
    if (!await requestTokenOnce()) throw new Error('Токен не предоставлен');
    const payload = {
      message: 'Обновлено через панель управления',
      content: btoa(new TextEncoder().encode(newContent).reduce((a, b) => a + String.fromCharCode(b), '')),
      sha: sha,
      branch: GITHUB_BRANCH
    };
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(payload)
      }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Unknown save error');
    }
    return true;
  }

  // ===== Парсер/сборщик настроек =====
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

  function replaceSettings(src, obj) {
    const newSet = `const SITE_SETTINGS = {\n  'phoneNumber': '${obj.phoneNumber || ''}',\n  'yandexMetrikaId': '${obj.yandexMetrikaId || ''}'\n};`;
    return src.replace(/const\s+SITE_SETTINGS\s*=\s*{[\s\S]*?};/, newSet);
  }

  // ===== Основные операции =====
  async function loadSettings(targetSite) {
    try {
      showStatus('Загрузка...', 'success');
      const { content } = await fetchFile();
      const { obj } = extractSettings(content);
      populateForm(obj);
      showStatus('Данные загружены ✅', 'success');
    } catch (e) {
      console.error(e);
      showStatus(`Ошибка загрузки: ${e.message}`, 'error');
    }
  }

  async function saveSettings(targetSite) {
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
      console.error(e);
      showStatus(`Ошибка сохранения: ${e.message}`, 'error');
    }
  }

  // ===== Управление модальным окном =====
  function openSettingsModal(targetSite) {
    document.getElementById('modalSiteName').textContent = targetSite;
    document.getElementById('settingsModal').style.display = 'flex';
    const statusMsg = document.getElementById('settingStatusMessage');
    if (statusMsg) statusMsg.style.display = 'none';
    loadSettings(targetSite);
  }

  function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
  }

  // ===== Инициализация =====
  function init() {
    // стили и HTML
    if (!document.getElementById('settings-modal-styles')) {
      const d = document.createElement('div');
      d.id = 'settings-modal-styles';
      d.innerHTML = styles;
      document.head.appendChild(d);
    }
    if (!document.getElementById('settingsModal')) {
      const d = document.createElement('div');
      d.innerHTML = modalHTML;
      document.body.appendChild(d.firstElementChild);
    }

    // обработчики
    const modal = document.getElementById('settingsModal');
    modal.querySelector('.close').onclick = closeSettingsModal;
    document.getElementById('cancelSettingsBtn').onclick = closeSettingsModal;
    document.getElementById('saveSettingsBtn').onclick = () => {
      const site = document.getElementById('modalSiteName').textContent;
      if (site) saveSettings(site);
    };
    window.onclick = e => { if (e.target === modal) closeSettingsModal(); };
    document.onkeydown = e => { if (e.key === 'Escape' && modal.style.display === 'flex') closeSettingsModal(); };

    // публикуем функцию
    window.openSettingsModal = openSettingsModal;
  }

  // запуск
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
