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

  console.log('Settings panel initialized');

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
    try {
      console.log('Fetching file from GitHub...');
      const url = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}`;
      console.log('URL:', url);
      
      const res = await fetch(url, {
        headers: { 
          Authorization: `token ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('GitHub API error:', res.status, errorText);
        throw new Error(`GitHub API error: ${res.status} - ${errorText}`);
      }
      
      const data = await res.json();
      console.log('GitHub response received');
      
      // Правильное декодирование Base64
      const binaryString = atob(data.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const content = new TextDecoder().decode(bytes);
      
      return { sha: data.sha, content };
    } catch (error) {
      console.error('Error fetching file:', error);
      throw error;
    }
  }

  async function saveFile(newContent, sha) {
    try {
      console.log('Saving file to GitHub...');
      // Правильное кодирование в Base64
      const encoder = new TextEncoder();
      const encoded = encoder.encode(newContent);
      let binaryString = '';
      for (let i = 0; i < encoded.length; i++) {
        binaryString += String.fromCharCode(encoded[i]);
      }
      const base64Content = btoa(binaryString);

      const payload = {
        message: 'Обновлено через панель управления',
        content: base64Content,
        sha: sha,
        branch: GITHUB_BRANCH
      };

      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}`, {
        method: 'PUT',
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
          Accept: 'application/vnd.github.v3+json'
        },
        body: JSON.stringify(payload)
      });

      console.log('Save response status:', res.status);
      
      if (!res.ok) {
        const err = await res.json();
        console.error('Save error:', err);
        throw new Error(err.message || 'Unknown error');
      }

      const result = await res.json();
      console.log('File saved successfully');
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      throw error;
    }
  }

  function extractSettings(source) {
    console.log('Extracting settings from source...');
    
    // Ищем объект SITE_SETTINGS
    const match = source.match(/const\s+SITE_SETTINGS\s*=\s*({[\s\S]*?});/);
    if (!match) {
      console.error('SITE_SETTINGS not found in source');
      throw new Error('Не удалось найти SITE_SETTINGS в файле');
    }
    
    console.log('SITE_SETTINGS found');
    
    // Извлекаем содержимое объекта
    const settingsContent = match[1];
    
    // Создаем объект безопасным способом
    const settings = {};
    
    // Ищем отдельные свойства с разными вариантами кавычек
    const phoneMatch = settingsContent.match(/phoneNumber:\s*['"`]([^'"`]*)['"`]/);
    const metricMatch = settingsContent.match(/yandexMetrikaId:\s*['"`]([^'"`]*)['"`]/);
    
    if (phoneMatch) {
      settings.phoneNumber = phoneMatch[1];
      console.log('Phone number found:', settings.phoneNumber);
    } else {
      console.log('Phone number not found');
    }
    
    if (metricMatch) {
      settings.yandexMetrikaId = metricMatch[1];
      console.log('Metrika ID found:', settings.yandexMetrikaId);
    } else {
      console.log('Metrika ID not found');
    }
    
    return { match: match[0], obj: settings };
  }

  function replaceSettings(source, newObj) {
    console.log('Replacing settings...');
    
    // Создаем новую строку настроек
    const newSettings = `const SITE_SETTINGS = {
  phoneNumber: '${newObj.phoneNumber || ''}',
  yandexMetrikaId: '${newObj.yandexMetrikaId || ''}'
};`;
    
    console.log('New settings:', newSettings);
    
    // Заменяем старые настройки новыми
    return source.replace(/const\s+SITE_SETTINGS\s*=\s*{[\s\S]*?};/, newSettings);
  }

  // ===== ОСНОВНЫЕ ФУНКЦИИ =====
  async function loadSettings(targetSite) {
    try {
      console.log('Loading settings for:', targetSite);
      showStatus('Загрузка...', 'success');
      
      const { content } = await fetchFile();
      const { obj } = extractSettings(content);
      populateForm(obj);
      showStatus('Данные загружены ✅', 'success');
    } catch (e) {
      console.error('Ошибка загрузки:', e);
      showStatus(`Ошибка загрузки: ${e.message}`, 'error');
    }
  }

  async function saveSettings(targetSite) {
    try {
      console.log('Saving settings for:', targetSite);
      showStatus('Сохранение...', 'success');
      
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
      showStatus(`Ошибка сохранения: ${e.message}`, 'error');
    }
  }

  // ===== УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ =====
  function openSettingsModal(targetSite) {
    console.log('Opening modal for:', targetSite);
    document.getElementById('modalSiteName').textContent = targetSite;
    document.getElementById('settingsModal').style.display = 'flex';
    const statusMsg = document.getElementById('settingStatusMessage');
    if (statusMsg) {
      statusMsg.style.display = 'none';
    }
    loadSettings(targetSite);
  }

  function closeSettingsModal() {
    console.log('Closing modal');
    document.getElementById('settingsModal').style.display = 'none';
  }

  // ===== ИНИЦИАЛИЗАЦИЯ МОДУЛЯ =====
  function init() {
    console.log('Initializing settings panel...');
    
    // Добавляем стили
    if (!document.getElementById('settings-modal-styles')) {
      const styleElement = document.createElement('div');
      styleElement.id = 'settings-modal-styles';
      styleElement.innerHTML = styles;
      document.head.appendChild(styleElement);
      console.log('Styles added');
    }

    // Добавляем модальное окно
    if (!document.getElementById('settingsModal')) {
      const modalElement = document.createElement('div');
      modalElement.innerHTML = modalHTML;
      document.body.appendChild(modalElement.firstElementChild);
      console.log('Modal added');
    }

    // Назначаем обработчики событий
    const modal = document.getElementById('settingsModal');
    const span = modal?.querySelector('.close');
    const cancelBtn = document.getElementById('cancelSettingsBtn');
    const saveBtn = document.getElementById('saveSettingsBtn');

    if (span) {
      span.addEventListener('click', closeSettingsModal);
      console.log('Close handler added');
    }
    
    if (cancelBtn) {
      cancelBtn.addEventListener('click', closeSettingsModal);
      console.log('Cancel handler added');
    }
    
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const targetSite = document.getElementById('modalSiteName').textContent;
        if (targetSite) await saveSettings(targetSite);
      });
      console.log('Save handler added');
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
    console.log('Settings panel initialized successfully');
  }

  // Запускаем инициализацию
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

