// settings-panel.js
(async function () {
  'use strict';

  // ===== НАСТРОЙКИ И КОНСТАНТЫ =====
  const API = 'https://script.google.com/macros/s/AKfycbxQoTQPStRV0ZUr5s3EFAtvgC62jbVjH2cp8VLrMPKBi3vDkoAmafVb_fC4L-jw0LBZ/exec';
  const DEFAULT_REPO_CONFIG = {
    owner: 'antomimpuls',
    repo: 'gadanie-golos.ru',
    branch: 'main',
    filePath: 'index.html'
  };
  const REPO_CONFIG_KEY = 'repoConfig';
  const site = location.hostname.replace(/^www\./, '');
  const GITHUB_TOKEN = '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'; // Ваш токен

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
        max-width: 600px;
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

      .form-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
      }

      .form-grid input, .modal-content > input, .modal-content > textarea {
        background: var(--bg);
        border: 1px solid #333;
        border-radius: 6px;
        padding: 10px;
        color: var(--text);
        font-size: 14px;
        box-sizing: border-box;
        width: 100%;
      }
      
      .form-grid input:focus, .modal-content > input:focus, .modal-content > textarea:focus {
        outline: none;
        border-color: var(--accent);
      }

      .modal-content > textarea {
        min-height: 100px;
        resize: vertical;
        font-family: inherit;
        white-space: pre-wrap;
      }

      .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
      }

      .switch input {
        opacity: 0;
        width: 0;
        height: 0;
      }

      .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 24px;
      }

      .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
      }

      input:checked + .slider {
        background-color: var(--accent);
      }

      input:checked + .slider:before {
        transform: translateX(26px);
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 15px;
        margin-top: auto;
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
      
      /* Стили для кнопки в таблице */
      .action-btn {
        background: var(--accent);
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        font-size: 16px;
        color: var(--bg);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.25s;
        margin: 2px;
      }
      
      .action-btn:hover {
        opacity: 0.8;
      }
    </style>
  `;

  // ===== HTML МОДАЛЬНОГО ОКНА (БЕЗ БЛОКА РЕПОЗИТОРИЯ) =====
  const modalHTML = `
    <div id="settingsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Настройки сайта <span id="modalSiteName"></span></h2>
          <button class="close">&times;</button>
        </div>
        
        <div id="settingStatusMessage" class="status-message"></div>

        <!-- Блок настроек -->
        <input id="settingPhoneNumber" placeholder="+79001234567">
        <input id="settingPsychicName" placeholder="Имя экстрасенса">
        <input id="settingYandexMetrikaId" placeholder="ID Яндекс.Метрики">
        <input id="settingSiteUrl" placeholder="https://site.ru">
        <input id="settingPsychicImageURL" placeholder="URL фото">
        
        <div style="display: flex; align-items: center; gap: 10px;">
          <label class="switch">
            <input type="checkbox" id="settingEnableRedirect">
            <span class="slider"></span>
          </label>
          <span>Редирект</span>
        </div>
        
        <div class="form-grid">
          <input type="number" id="settingRedirectPercentage" min="0" max="100" placeholder="Процент редиректа (%)">
          <input type="number" id="settingRedirectDelaySeconds" min="0" max="60" placeholder="Задержка (сек)">
        </div>
        
        <textarea id="settingWhatsappMessage" rows="3" placeholder="Сообщение WhatsApp"></textarea>

        <div class="modal-footer">
          <button class="btn cancel" id="cancelSettingsBtn">Отмена</button>
          <button class="btn save" id="saveSettingsBtn">Сохранить</button>
        </div>
      </div>
    </div>
  `;

  // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
  function getRepoConfig() {
    const configStr = localStorage.getItem(REPO_CONFIG_KEY);
    if (configStr) {
      try {
        return { ...DEFAULT_REPO_CONFIG, ...JSON.parse(configStr) };
      } catch (e) {
        console.error('Ошибка парсинга конфигурации репозитория из localStorage:', e);
        return { ...DEFAULT_REPO_CONFIG };
      }
    }
    return { ...DEFAULT_REPO_CONFIG };
  }

  function saveRepoConfig(config) {
    try {
      localStorage.setItem(REPO_CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error('Ошибка сохранения конфигурации репозитория в localStorage:', e);
      showStatus('Ошибка сохранения конфигурации репозитория в браузере.', 'error');
    }
  }

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

  // ===== ФУНКЦИИ РАБОТЫ С НАСТРОЙКАМИ =====
  async function loadSettings(targetSite) {
    const repoConfig = getRepoConfig();
    const url = new URL(API);
    url.searchParams.append('action', 'getGithubSettings');
    url.searchParams.append('owner', repoConfig.owner);
    url.searchParams.append('repo', repoConfig.repo);
    url.searchParams.append('branch', repoConfig.branch);
    url.searchParams.append('path', repoConfig.filePath);
    url.searchParams.append('site', targetSite);

    try {
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Неизвестная ошибка при загрузке настроек.');

      const settings = data.settings || {};
      // Заполняем форму данными
      document.getElementById('settingPhoneNumber').value = settings.phoneNumber || '';
      document.getElementById('settingPsychicName').value = settings.psychicName || '';
      document.getElementById('settingYandexMetrikaId').value = settings.yandexMetrikaId || '';
      document.getElementById('settingSiteUrl').value = settings.siteUrl || '';
      document.getElementById('settingPsychicImageURL').value = settings.psychicImageURL || '';
      document.getElementById('settingEnableRedirect').checked = settings.enableRedirect === true;
      document.getElementById('settingRedirectPercentage').value = settings.redirectPercentage || '';
      document.getElementById('settingRedirectDelaySeconds').value = settings.redirectDelaySeconds || '';
      document.getElementById('settingWhatsappMessage').value = settings.whatsappMessage || '';

      showStatus('Настройки загружены.', 'success');
      return { site: targetSite, settings: settings };
    } catch (error) {
      console.error('Ошибка при загрузке настроек:', error);
      showStatus(`Ошибка загрузки: ${error.message}`, 'error');
      return null;
    }
  }

  async function saveSettings(targetSite) {
    const repoConfig = {
      owner: document.getElementById('settingOwner').value.trim(),
      repo: document.getElementById('settingRepo').value.trim(),
      branch: document.getElementById('settingBranch').value.trim() || DEFAULT_REPO_CONFIG.branch,
      filePath: document.getElementById('settingFilePath').value.trim() || DEFAULT_REPO_CONFIG.filePath,
    };

    // Проверка обязательных полей репозитория
    if (!repoConfig.owner || !repoConfig.repo) {
      showStatus('Пожалуйста, заполните поля "Владелец" и "Репозиторий".', 'error');
      return false;
    }

    // Собираем данные настроек из формы
    const formDataSettings = {
      phoneNumber: document.getElementById('settingPhoneNumber').value,
      psychicName: document.getElementById('settingPsychicName').value,
      yandexMetrikaId: document.getElementById('settingYandexMetrikaId').value,
      siteUrl: document.getElementById('settingSiteUrl').value,
      psychicImageURL: document.getElementById('settingPsychicImageURL').value,
      enableRedirect: document.getElementById('settingEnableRedirect').checked,
      redirectPercentage: parseInt(document.getElementById('settingRedirectPercentage').value, 10) || 0,
      redirectDelaySeconds: parseInt(document.getElementById('settingRedirectDelaySeconds').value, 10) || 0,
      whatsappMessage: document.getElementById('settingWhatsappMessage').value,
      site: targetSite // Передаем site для корректной обработки на сервере
    };

    const formData = new URLSearchParams();
    formData.append('action', 'saveGithubSettings');
    formData.append('repoConfig', JSON.stringify(repoConfig));
    formData.append('settingsData', JSON.stringify(formDataSettings));

    try {
      const response = await fetch(API, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.status !== 'success') throw new Error(data.message || 'Неизвестная ошибка при сохранении настроек.');

      // Сохраняем конфигурацию репозитория в localStorage
      saveRepoConfig(repoConfig);

      showStatus('✓ Настройки успешно сохранены!', 'success');
      return true;
    } catch (error) {
      console.error('Ошибка при сохранении настроек:', error);
      showStatus(`Ошибка сохранения: ${error.message}`, 'error');
      return false;
    }
  }

  // ===== УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ =====
  function openSettingsModal(targetSite) {
    document.getElementById('modalSiteName').textContent = targetSite;
    document.getElementById('settingsModal').style.display = 'flex';
    // Сбрасываем сообщение статуса
    const statusMsg = document.getElementById('settingStatusMessage');
    if (statusMsg) {
      statusMsg.style.display = 'none';
      statusMsg.className = 'status-message';
      statusMsg.textContent = '';
    }
    loadSettings(targetSite);
  }

  function closeSettingsModal() {
    document.getElementById('settingsModal').style.display = 'none';
    // Очищаем сообщение статуса при закрытии
    const statusMsg = document.getElementById('settingStatusMessage');
    if (statusMsg) {
      statusMsg.style.display = 'none';
      statusMsg.className = 'status-message';
      statusMsg.textContent = '';
    }
  }

  // ===== ИНИЦИАЛИЗАЦИЯ =====
  function init() {
    // Проверяем, что скрипт выполняется в браузере
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      console.warn('Скрипт settings-panel.js предназначен для выполнения в браузере.');
      return;
    }

    // Добавляем стили и модальное окно в DOM
    if (!document.getElementById('settings-modal-styles')) {
      const styleElement = document.createElement('div');
      styleElement.id = 'settings-modal-styles';
      styleElement.innerHTML = styles;
      document.head.appendChild(styleElement);
    }

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
            if (targetSite) {
                const success = await saveSettings(targetSite);
                if (success) {
                    setTimeout(() => {
                        closeSettingsModal();
                    }, 1500);
                }
            }
        });
    }

    // Закрытие модального окна при клике вне его
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeSettingsModal();
      }
    });

    // Закрытие модального окна по клавише Escape
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal?.style.display === 'flex') {
        closeSettingsModal();
      }
    });

    // Добавляем функцию в глобальную область видимости для использования в таблице
    window.openSettingsModal = openSettingsModal;

    console.log('Модуль settings-panel.js инициализирован.');
  }

  // Запускаем инициализацию после загрузки DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
