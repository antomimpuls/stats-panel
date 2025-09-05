// settings-panel.js  (полностью — без пропусков)
(async function () {
  'use strict';

  // ===== НАСТРОЙКИ =====
  const GITHUB_REPO_OWNER = 'antomimpuls';
  let   GITHUB_REPO_NAME  = 'gadanie-golos.ru'; // будет перезаписан
  const GITHUB_BRANCH     = 'main';
  
  function replaceSettings(src, obj) {
    // сохраняем все оригинальные поля
    const oldMatch = src.match(/const\s+SITE_SETTINGS\s*=\s*({[\s\S]*?});/);
    if (!oldMatch) throw new Error('SITE_SETTINGS не найден');

    // безопасно парсим старый объект
    const oldObjStr = oldMatch[1];
    const oldObj = new Function('return ' + oldObjStr)();

    // обновляем только нужные
    const newObj = { ...oldObj, ...obj };

    // сериализуем обратно
    const newSet = 'const SITE_SETTINGS = ' + JSON.stringify(newObj, null, 2).replace(/"/g, "'") + ';';
    return src.replace(/const\s+SITE_SETTINGS\s*=\s*{[\s\S]*?};/, newSet);
  }
  
  const GITHUB_FILE_PATH  = 'index.html';
  let GITHUB_TOKEN        = sessionStorage.getItem('github_token') || '';

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
        --warning: #ffc107;
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
      
      /* Toggle Switch Styles */
      .switch {position: relative;display: inline-block;width: 50px;height: 24px}
      .switch input {opacity: 0;width: 0;height: 0}
      .slider {position: absolute;cursor: pointer;top: 0;left: 0;right: 0;bottom: 0;background-color: #ccc;transition: .4s;border-radius: 24px}
      .slider:before {position: absolute;content: "";height: 16px;width: 16px;left: 4px;bottom: 4px;background-color: white;transition: .4s;border-radius: 50%}
      input:checked + .slider {background-color: var(--accent)}
      input:checked + .slider:before {transform: translateX(26px)}
      .toggle-container {display: flex;align-items: center;justify-content: space-between;margin-bottom: 1rem}
      .toggle-label {font-size: .9rem;color: #aaa}
      .redirect-settings {padding-left: 20px;border-left: 2px solid var(--accent);margin: 15px 0}
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
        
        <!-- Redirect Settings -->
        <div class="toggle-container">
          <span class="toggle-label">Включить редирект:</span>
          <label class="switch">
            <input type="checkbox" id="settingEnableRedirect">
            <span class="slider"></span>
          </label>
        </div>
        
        <div id="redirectSettings" class="redirect-settings" style="display: none;">
          <div class="input-group">
            <label>Процент редиректа (%):</label>
            <input id="settingRedirectPercentage" type="number" min="0" max="100" placeholder="100" />
          </div>
          
          <div class="input-group">
            <label>Задержка редиректа (сек):</label>
            <input id="settingRedirectDelaySeconds" type="number" min="0" placeholder="10" />
          </div>
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
    setTimeout(() => {
      if (el.textContent === msg) el.style.display = 'none';
    }, 5000);
  }

  function populateForm(settings) {
    if (!settings) return;
    document.getElementById('settingPhoneNumber').value = settings.phoneNumber || '';
    document.getElementById('settingYandexMetrikaId').value = settings.yandexMetrikaId || '';
    
    // Redirect settings
    const enableRedirect = settings.enableRedirect || false;
    document.getElementById('settingEnableRedirect').checked = enableRedirect;
    document.getElementById('redirectSettings').style.display = enableRedirect ? 'block' : 'none';
    
    document.getElementById('settingRedirectPercentage').value = settings.redirectPercentage || 100;
    document.getElementById('settingRedirectDelaySeconds').value = settings.redirectDelaySeconds || 10;
  }

  function setupRedirectToggle() {
    const toggle = document.getElementById('settingEnableRedirect');
    const settingsDiv = document.getElementById('redirectSettings');
    
    toggle.addEventListener('change', function() {
      settingsDiv.style.display = this.checked ? 'block' : 'none';
    });
  }

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
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
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
    if (!res.ok) throw new Error((await res.json()).message || 'Unknown error');
    return true;
  }

  // ===== Парсер/сборщик настроек =====
  function extractSettings(source) {
    const m = source.match(/const\s+SITE_SETTINGS\s*=\s*({[\s\S]*?});/);
    if (!m) throw new Error('SITE_SETTINGS не найден');
    const s = {};
    const ph = m[1].match(/['"]?phoneNumber['"]?\s*:\s*['"`]([^'"`]*)['"`]/);
    const ym = m[1].match(/['"]?yandexMetrikaId['"]?\s*:\s*['"`]([^'"`]*)['"`]/);
    const er = m[1].match(/['"]?enableRedirect['"]?\s*:\s*(true|false)/);
    const rp = m[1].match(/['"]?redirectPercentage['"]?\s*:\s*(\d+)/);
    const rd = m[1].match(/['"]?redirectDelaySeconds['"]?\s*:\s*(\d+)/);
    
    if (ph) s.phoneNumber = ph[1];
    if (ym) s.yandexMetrikaId = ym[1];
    if (er) s.enableRedirect = er[1] === 'true';
    if (rp) s.redirectPercentage = parseInt(rp[1]);
    if (rd) s.redirectDelaySeconds = parseInt(rd[1]);
    
    return { match: m[0], obj: s };
  }

  // ===== Основные операции =====
  async function loadSettings(site) {
    GITHUB_REPO_NAME = site;
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
    GITHUB_REPO_NAME = site;
    try {
      showStatus('Сохранение...', 'success');
      const { content, sha } = await fetchFile();
      const { obj } = extractSettings(content);
      
      // Основные настройки
      obj.phoneNumber = document.getElementById('settingPhoneNumber').value.trim();
      obj.yandexMetrikaId = document.getElementById('settingYandexMetrikaId').value.trim();
      
      // Настройки редиректа
      obj.enableRedirect = document.getElementById('settingEnableRedirect').checked;
      
      // ИСПРАВЛЕНИЕ: Правильная обработка значений 0
      const percentage = parseInt(document.getElementById('settingRedirectPercentage').value);
      obj.redirectPercentage = isNaN(percentage) ? 100 : percentage;
      
      const delaySeconds = parseInt(document.getElementById('settingRedirectDelaySeconds').value);
      obj.redirectDelaySeconds = isNaN(delaySeconds) ? 10 : delaySeconds;
      
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

    // Настройка переключателя редиректа
    setupRedirectToggle();

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
