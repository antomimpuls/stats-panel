// settings-panel.js
(async function () {
  'use strict';

  // ===== НАСТРОЙКИ И КОНСТАНТЫ =====
  // Эти параметры можно оставить как есть, так как они зашиты в логику получения файла
  const GITHUB_REPO_OWNER = 'antomimpuls';
  const GITHUB_REPO_NAME = 'gadanie-golos.ru';
  const GITHUB_BRANCH = 'main';
  const GITHUB_FILE_PATH = 'index.html';
  // Ваш токен для GitHub API
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
          <!-- Кнопка сохранения убрана, так как логика сохранения не реализована -->
          <!-- <button class="btn save" id="saveSettingsBtn">Сохранить</button> -->
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

  // ===== ФУНКЦИИ РАБОТЫ С НАСТРОЙКАМИ =====
  async function loadSettings(targetSite) {
    console.log(`Попытка загрузки настроек для сайта: ${targetSite}`);
    try {
      // Формируем URL для GitHub API для получения содержимого файла
      // Используем прямую ссылку на содержимое файла
      const url = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/${GITHUB_FILE_PATH}`;

      console.log(`Запрос к URL: ${url}`);

      // Заголовки для авторизации (если потребуется, хотя для raw.githubusercontent.com может и не нужно)
      // const headers = {
      //   'Authorization': `token ${GITHUB_TOKEN}`,
      //   'Accept': 'application/vnd.github.v3.raw' // Запрашиваем сырой контент
      // };
      // const response = await fetch(url, { headers });

      // Простой запрос без специальных заголовков для raw.githubusercontent.com
      const response = await fetch(url);

      // Проверяем статус ответа
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Ошибка HTTP: ${response.status}`, errorText);
        throw new Error(`HTTP error! status: ${response.status}, text: ${errorText.substring(0, 200)}`);
      }

      // Получаем текст содержимого файла
      const content = await response.text();
      console.log('Получено содержимое файла index.html (первые 500 символов):', content.substring(0, 500));

      // Находим объявление SITE_SETTINGS с более надежным регулярным выражением
      // Это выражение ищет SITE_SETTINGS и захватывает всё до ближайшей точки с запятой после закрывающей фигурной скобки
      const match = content.match(/const\s+SITE_SETTINGS\s*=\s*({[^;]*});/s);
      
      if (!match || !match[1]) {
          console.error('RegExp match для SITE_SETTINGS не удался. Полный текст для поиска:', content);
          throw new Error('Не найдено корректное объявление SITE_SETTINGS в index.html. Проверьте формат в репозитории.');
      }

      const settingsStr = match[1];
      console.log('Найденная строка настроек:', settingsStr);

      // Парсим JSON
      let settings;
      try {
        settings = JSON.parse(settingsStr);
        console.log('Успешно распарсенные настройки:', settings);
      } catch (parseError) {
         console.error('Ошибка парсинга JSON из SITE_SETTINGS:', parseError);
         // Попробуем "почистить" строку вручную, если стандартный JSON.parse не сработал
         // Удаляем возможные комментарии и лишние символы (это рискованно, но может помочь)
         const cleanedSettingsStr = settingsStr
           .replace(/\/\*[\s\S]*?\*\//g, '') // Удалить /* комментарии */
           .replace(/\/\/.*$/gm, '') // Удалить // комментарии
           .replace(/,\s*([}\]])/g, '$1') // Удалить запятые перед закрывающими скобками (иногда бывает)
           .trim();
         console.log('Очищенная строка настроек для повторной попытки:', cleanedSettingsStr);
         settings = JSON.parse(cleanedSettingsStr);
         console.log('Настройки после очистки и повторного парсинга:', settings);
      }


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

      showStatus('Настройки успешно загружены.', 'success');
      return settings;
    } catch (error) {
      console.error('Критическая ошибка в функции loadSettings:', error);
      showStatus(`Ошибка загрузки: ${error.message}`, 'error');
      return null;
    }
  }


  // ===== УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ =====
  function openSettingsModal(targetSite) {
    console.log(`Открытие модального окна для сайта: ${targetSite}`);
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
    console.log('Инициализация settings-panel.js');
    // Проверяем, что скрипт выполняется в браузере
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      console.warn('Скрипт settings-panel.js предназначен для выполнения в браузере.');
      return;
    }

    // Добавляем стили и модальное окно в DOM
    if (!document.getElementById('settings-modal-styles')) {
      console.log('Добавление стилей в DOM');
      const styleElement = document.createElement('div');
      styleElement.id = 'settings-modal-styles';
      styleElement.innerHTML = styles;
      document.head.appendChild(styleElement);
    } else {
       console.log('Стили уже существуют в DOM');
    }

    if (!document.getElementById('settingsModal')) {
       console.log('Добавление модального окна в DOM');
      const modalElement = document.createElement('div');
      modalElement.innerHTML = modalHTML;
      document.body.appendChild(modalElement.firstElementChild);
    } else {
       console.log('Модальное окно уже существует в DOM');
    }

    // Назначаем обработчики событий
    const modal = document.getElementById('settingsModal');
    const span = modal?.querySelector('.close');
    const cancelBtn = document.getElementById('cancelSettingsBtn');
    // const saveBtn = document.getElementById('saveSettingsBtn'); // Убрано, так как сохранение не реализовано

    if (span) {
        console.log('Назначение обработчика для кнопки закрытия');
        span.addEventListener('click', closeSettingsModal);
    }
    if (cancelBtn) {
        console.log('Назначение обработчика для кнопки Отмена');
        cancelBtn.addEventListener('click', closeSettingsModal);
    }
    // if (saveBtn) { // Убрано
    //     saveBtn.addEventListener('click', async () => {
    //         const targetSite = document.getElementById('modalSiteName').textContent;
    //         if (targetSite) {
    //             await saveSettings(); // Эта функция не реализована
    //             setTimeout(() => {
    //                 closeSettingsModal();
    //             }, 1500);
    //         }
    //     });
    // }

    // Закрытие модального окна при клике вне его
    console.log('Назначение обработчика для закрытия по клику вне окна');
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeSettingsModal();
      }
    });

    // Закрытие модального окна по клавише Escape
    console.log('Назначение обработчика для закрытия по Escape');
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal?.style.display === 'flex') {
        closeSettingsModal();
      }
    });

    // Добавляем функцию в глобальную область видимости для использования в таблице
    console.log('Экспорт функции openSettingsModal в window');
    window.openSettingsModal = openSettingsModal;

    console.log('Модуль settings-panel.js инициализирован.');
  }

  // Запускаем инициализацию после загрузки DOM
  console.log('Проверка состояния document');
  if (document.readyState === 'loading') {
    console.log('DOM ещё не загружен, добавление слушателя DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log('DOM уже загружен, запуск инициализации');
    init();
  }

})();
