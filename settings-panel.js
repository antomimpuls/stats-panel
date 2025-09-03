// settings-panel.js
// Модуль для отображения и редактирования настроек сайта из GitHub
(async function () {
  'use strict';

  // ===== НАСТРОЙКИ И КОНСТАНТЫ =====
  const GITHUB_REPO_OWNER = 'antomimpuls';
  const GITHUB_REPO_NAME = 'gadanie-golos.ru';
  const GITHUB_BRANCH = 'main';
  const GITHUB_FILE_PATH = 'index.html';
  const GITHUB_TOKEN = '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';

  // ===== СТИЛИ ДЛЯ МОДАЛЬНОГО ОКНА =====
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

      /* Модальное окно настроек */
      #settingsModal {
        display: none;
        position: fixed;
        z-index: 10000;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0,0,0,0.7);
        justify-content: center;
        align-items: center;
        padding: 20px;
        box-sizing: border-box;
      }

      .modal-content {
        background: var(--card);
        color: var(--text);
        border-radius: 10px;
        max-width: 500px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        padding: 25px;
        box-sizing: border-box;
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--accent);
      }

      .modal-header h2 {
        margin: 0;
        font-size: 1.5em;
      }

      .close {
        background: none;
        border: none;
        font-size: 1.8em;
        cursor: pointer;
        color: var(--text);
        opacity: 0.7;
        transition: opacity 0.25s;
        padding: 0;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .close:hover {
        opacity: 1;
      }

      .input-group {
        margin-bottom: 1rem;
      }

      .input-group label {
        display: block;
        margin-bottom: .5rem;
        font-size: .9rem;
        color: #aaa;
      }

      .input-group input {
        width: 100%;
        padding: 10px;
        background: var(--bg);
        border: 1px solid #333;
        border-radius: 6px;
        color: var(--text);
        font-size: 14px;
        box-sizing: border-box;
      }
      
      .input-group input:focus {
        outline: none;
        border-color: var(--accent);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 15px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid #333;
      }

      .btn {
        border: none;
        border-radius: 6px;
        padding: 10px 20px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        transition: .25s;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .btn.save {
        background: var(--accent);
        color: var(--bg);
      }

      .btn.cancel {
        background: #6c757d;
        color: var(--text);
      }

      .btn:hover {
        opacity: 0.8;
      }

      .status-message {
        padding: 10px;
        border-radius: 5px;
        margin-bottom: 15px;
        text-align: center;
        display: none;
      }

      .status-success {
        background-color: rgba(40, 167, 69, 0.2);
        color: var(--success);
        border: 1px solid var(--success);
      }

      .status-error {
        background-color: rgba(220, 53, 69, 0.2);
        color: var(--danger);
        border: 1px solid var(--danger);
      }
    </style>
  `;

  // ===== HTML МОДАЛЬНОГО ОКНА =====
  const modalHTML = `
    <div id="settingsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Настройки сайта <span id="modalSiteName"></span></h2>
          <button class="close">&times;</button>
        </div>
        
        <div id="settingStatusMessage" class="status-message"></div>

        <!-- Только нужные настройки: телефон и метрика -->
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

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
  function showStatus(message, type = 'success') {
    const statusMsg = document.getElementById('settingStatusMessage');
    if (!statusMsg) return;
    statusMsg.textContent = message;
    statusMsg.className = `status-message status-${type}`;
    statusMsg.style.display = 'block';
    setTimeout(() => {
      if (statusMsg.textContent === message) {
        statusMsg.style.display = 'none';
      }
    }, 5000);
  }

  function populateForm(settings) {
    if (!settings) return;
    document.getElementById('settingPhoneNumber').value = settings.phoneNumber || '';
    document.getElementById('settingYandexMetrikaId').value = settings.yandexMetrikaId || '';
  }

  // ===== ФУНКЦИИ РАБОТЫ С GITHUB =====
  async function fetchFile() {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}`, {
      headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const data = await res.json();
    return { sha: data.sha, content: atob(data.content.replace(/\s/g, '')) };
  }

  async function saveFile(newContent, sha) {
    // Правильное кодирование в Base64
    const base64Content = btoa(unescape(encodeURIComponent(newContent)));

    const payload = {
      message: 'Обновлено через панель управления',
      content: base64Content,
      sha: sha
    };

    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'unknown');
    }

    return true;
  }

  function extractSettings(source) {
    const m = source.match(/const\s+SITE_SETTINGS\s*=\s*({[\s\S]*?});/);
    if (!m) throw new Error('Не удалось найти SITE_SETTINGS');
    return { match: m[0], obj: Function('"use strict";return (' + m[1] + ')')() };
  }

  function replaceSettings(source, newObj) {
    const json = JSON.stringify(newObj, null, 2).replace(/"/g, "'");
    return source.replace(/const\s+SITE_SETTINGS\s*=\s*{[\s\S]*?};/, `const SITE_SETTINGS = ${json};`);
  }

  // ===== ОСНОВНЫЕ ФУНКЦИИ =====
  async function loadSettings(targetSite) {
    try {
      const { content } = await fetchFile();
      const { obj } = extractSettings(content);
      populateForm(obj);
      showStatus('Данные загружены ✅', 'success');
    } catch (e) {
      console.error('Ошибка загрузки:', e);
      showStatus('Ошибка загрузки ❌', 'error');
    }
  }

  async function saveSettings(targetSite) {
    try {
      const { content, sha } = await fetchFile();
      const { obj } = extractSettings(content);

      // Обновляем только нужные поля
      obj.phoneNumber = document.getElementById('settingPhoneNumber').value.trim();
      obj.yandexMetrikaId = document.getElementById('settingYandexMetrikaId').value.trim();

      const newSource = replaceSettings(content, obj);
      const ok = await saveFile(newSource, sha);

      if (ok) {
        showStatus('Сохранено ✅', 'success');
        setTimeout(() => closeSettingsModal(), 1500);
      }
    } catch (e) {
      console.error('Ошибка сохранения:', e);
      showStatus('Ошибка сохранения ❌', 'error');
    }
  }

  // ===== УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ =====
  function openSettingsModal(targetSite) {
    document.getElementById('modalSiteName').textContent = targetSite;
    document.getElementById('settingsModal').style.display = 'flex';
    const statusMsg = document.getElementById('settingStatusMessage');
    if (statusMsg) {
      statusMsg.style.display = 'none';
    }
    loadSettings(targetSite);
  }

  function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
  }

  // ===== ИНИЦИАЛИЗАЦИЯ МОДУЛЯ =====
  function init() {
    // Добавляем стили
    if (!document.getElementById('settings-modal-styles')) {
      const styleElement = document.createElement('div');
      styleElement.id = 'settings-modal-styles';
      styleElement.innerHTML = styles;
      document.head.appendChild(styleElement);
    }

    // Добавляем модальное окно
    if (!document.getElementById('settingsModal')) {
      const modalElement = document.createElement('div');
      modalElement.innerHTML = modalHTML;
      document.body.appendChild(modalElement.firstElementChild);
    }

    // Назначаем обработчики событий
    const modal = document.getElementById('settingsModal');
    const span = modal?.querySelector('.close');
    const cancelBtn = document.getElementById('cancelSettingsBtn');
    const saveBtn = document.getElementById('saveSettingsBtn');

    if (span) span.addEventListener('click', closeSettingsModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeSettingsModal);
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const targetSite = document.getElementById('modalSiteName').textContent;
        if (targetSite) await saveSettings(targetSite);
      });
    }

    window.addEventListener('click', (event) => {
      if (event.target === modal) closeSettingsModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal?.style.display === 'flex') {
        closeSettingsModal();
      }
    });

    // Делаем функцию доступной глобально
    window.openSettingsModal = openSettingsModal;
  }

  // Запускаем инициализацию
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
