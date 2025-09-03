// settings-panel.js
// Модуль для отображения и редактирования настроек сайта из GitHub
(async function () {
  'use strict';

  // ===== НАСТРОЙКИ И КОНСТАНТЫ =====
  // Параметры репозитория жестко заданы, как указано
  const GITHUB_REPO_OWNER = 'antomimpuls';
  const GITHUB_REPO_NAME = 'gadanie-golos.ru';
  const GITHUB_BRANCH = 'main';
  const GITHUB_FILE_PATH = 'index.html';
  // Ваш новый токен для GitHub API
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

  // ===== HTML МОДАЛЬНОГО ОКНА (ТОЛЬКО НУЖНЫЕ НАСТРОЙКИ) =====
  const modalHTML = `
    <div id="settingsModal">
      <div class="modal-content">
        <div class="modal-header">
          <h2>Настройки сайта <span id="modalSiteName"></span></h2>
          <button class="close">&times;</button>
        </div>
        
        <div id="settingStatusMessage" class="status-message"></div>

        <!-- Блок настроек -->
        <input id="settingPhoneNumber" placeholder="Номер телефона">
        <input id="settingPsychicName" placeholder="Имя экстрасенса">
        <input id="settingYandexMetrikaId" placeholder="ID Яндекс.Метрики">
        <input id="settingSiteUrl" placeholder="URL сайта">
        <input id="settingPsychicImageURL" placeholder="URL фото экстрасенса">
        
        <div style="display: flex; align-items: center; gap: 10px;">
          <label class="switch">
            <input type="checkbox" id="settingEnableRedirect">
            <span class="slider"></span>
          </label>
          <span>Включить редирект</span>
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
  /**
   * Отображает сообщение статуса в модальном окне.
   * @param {string} message - Текст сообщения.
   * @param {string} [type='success'] - Тип сообщения ('success' или 'error').
   */
  function showStatus(message, type = 'success') {
    const statusMsg = document.getElementById('settingStatusMessage');
    if (!statusMsg) return;
    statusMsg.textContent = message;
    statusMsg.className = `status-message status-${type}`;
    statusMsg.style.display = 'block';
    // Автоматически скрыть сообщение через 5 секунд
    setTimeout(() => {
      if (statusMsg.textContent === message) {
        statusMsg.style.display = 'none';
      }
    }, 5000);
  }

  /**
   * Заполняет форму модального окна данными настроек.
   * @param {Object} settings - Объект с настройками сайта.
   */
  function populateForm(settings) {
    if (!settings) return;
    document.getElementById('settingPhoneNumber').value = settings.phoneNumber || '';
    document.getElementById('settingPsychicName').value = settings.psychicName || '';
    document.getElementById('settingYandexMetrikaId').value = settings.yandexMetrikaId || '';
    document.getElementById('settingSiteUrl').value = settings.siteUrl || '';
    document.getElementById('settingPsychicImageURL').value = settings.psychicImageURL || '';
    document.getElementById('settingEnableRedirect').checked = settings.enableRedirect === true;
    document.getElementById('settingRedirectPercentage').value = settings.redirectPercentage || '';
    document.getElementById('settingRedirectDelaySeconds').value = settings.redirectDelaySeconds || '';
    // Используем value для textarea, чтобы сохранить переносы строк
    document.getElementById('settingWhatsappMessage').value = settings.whatsappMessage || '';
  }

  // ===== ФУНКЦИИ РАБОТЫ С НАСТРОЙКАМИ =====
  /**
   * Загружает настройки сайта из файла index.html на GitHub.
   * @param {string} targetSite - Имя сайта (домен), для которого загружаются настройки.
   */
  async function loadSettings(targetSite) {
    console.log(`[settings-panel.js] Попытка загрузки настроек для сайта: ${targetSite}`);
    try {
      // Формируем URL для получения "сырого" содержимого файла с GitHub
      const url = `https://raw.githubusercontent.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/${GITHUB_BRANCH}/${GITHUB_FILE_PATH}`;

      console.log(`[settings-panel.js] Запрос к URL: ${url}`);

      // Заголовки для авторизации
      const headers = {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3.raw' // Запрашиваем сырой контент
      };

      // Выполняем запрос к GitHub
      const response = await fetch(url, { headers });

      // Проверяем, успешен ли HTTP-запрос
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[settings-panel.js] Ошибка HTTP при запросе к GitHub: ${response.status}`, errorText.substring(0, 300));
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Получаем текст содержимого файла index.html
      const content = await response.text();
      console.log(`[settings-panel.js] Получено содержимое файла index.html (первые 1000 символов):`, content.substring(0, 1000));

      // Ищем объявление SITE_SETTINGS в содержимом файла
      // Регулярное выражение ищет const SITE_SETTINGS = { ... }; и захватывает только {...}
      const match = content.match(/const\s+SITE_SETTINGS\s*=\s*({[^;]*});/s);
      
      if (!match || !match[1]) {
          console.error('[settings-panel.js] RegExp match для SITE_SETTINGS не удался.');
          throw new Error('Не найдено корректное объявление SITE_SETTINGS в index.html.');
      }

      // Извлекаем строку с объектом настроек (внутри {...})
      let settingsStr = match[1];
      console.log('[settings-panel.js] Найденная строка настроек (до очистки):', settingsStr);

      // Очищаем строку от комментариев JavaScript, которые могут мешать JSON.parse
      settingsStr = settingsStr
        .replace(/\/\*[\s\S]*?\*\//g, '') // Удалить /* многострочные комментарии */
        .replace(/\/\/.*$/gm, '') // Удалить // однострочные комментарии
        .trim(); // Удалить пробелы в начале и конце

      console.log('[settings-panel.js] Строка настроек после очистки от комментариев:', settingsStr);

      // Парсим очищенную строку как JSON
      let settings;
      try {
        settings = JSON.parse(settingsStr);
        console.log('[settings-panel.js] Успешно распарсенные настройки:', settings);
      } catch (parseError) {
         console.error('[settings-panel.js] Ошибка парсинга JSON из SITE_SETTINGS:', parseError);
         throw new Error(`Ошибка парсинга настроек: ${parseError.message}`);
      }

      // Заполняем форму модального окна полученными данными
      populateForm(settings);

      showStatus('Настройки успешно загружены.', 'success');
      return settings;
    } catch (error) {
      console.error('[settings-panel.js] Критическая ошибка в функции loadSettings:', error);
      showStatus(`Ошибка загрузки: ${error.message}`, 'error');
      return null;
    }
  }

  /**
   * Сохраняет настройки сайта в файл index.html на GitHub.
   * @param {string} targetSite - Имя сайта (домен), для которого сохраняются настройки.
   */
  async function saveSettings(targetSite) {
    console.log(`[settings-panel.js] Попытка сохранения настроек для сайта: ${targetSite}`);
    showStatus('Сохранение настроек...', 'success'); // Показываем временное сообщение

    try {
      // 1. Собираем новые настройки из формы
      const newSettings = {
        phoneNumber: document.getElementById('settingPhoneNumber').value,
        psychicName: document.getElementById('settingPsychicName').value,
        enableRedirect: document.getElementById('settingEnableRedirect').checked,
        redirectPercentage: parseInt(document.getElementById('settingRedirectPercentage').value, 10) || 0,
        redirectDelaySeconds: parseInt(document.getElementById('settingRedirectDelaySeconds').value, 10) || 0,
        siteUrl: document.getElementById('settingSiteUrl').value,
        // Используем value для textarea
        whatsappMessage: document.getElementById('settingWhatsappMessage').value,
        yandexMetrikaId: document.getElementById('settingYandexMetrikaId').value,
        psychicImageURL: document.getElementById('settingPsychicImageURL').value
      };

      console.log('[settings-panel.js] Новые настройки для сохранения:', newSettings);

      // 2. Получаем SHA файла index.html (необходимо для обновления)
      const fileInfoUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}?ref=${GITHUB_BRANCH}`;
      const fileInfoResponse = await fetch(fileInfoUrl, {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!fileInfoResponse.ok) {
        const errorText = await fileInfoResponse.text();
        console.error(`[settings-panel.js] Ошибка получения информации о файле: ${fileInfoResponse.status}`, errorText);
        throw new Error(`Не удалось получить информацию о файле: ${fileInfoResponse.status}`);
      }

      const fileInfo = await fileInfoResponse.json();
      const fileSha = fileInfo.sha;
      const originalContent = atob(fileInfo.content); // Декодируем base64

      console.log(`[settings-panel.js] SHA файла: ${fileSha}`);

      // 3. Формируем строку нового объекта SITE_SETTINGS в формате JS
      // Важно: используем JSON.stringify для значений, чтобы корректно экранировать кавычки
      const newSettingsString = `const SITE_SETTINGS = {
  phoneNumber: ${JSON.stringify(newSettings.phoneNumber)},
  psychicName: ${JSON.stringify(newSettings.psychicName)},
  enableRedirect: ${newSettings.enableRedirect},
  redirectPercentage: ${newSettings.redirectPercentage},
  redirectDelaySeconds: ${newSettings.redirectDelaySeconds},
  siteUrl: ${JSON.stringify(newSettings.siteUrl)},
  whatsappMessage: ${JSON.stringify(newSettings.whatsappMessage)},
  yandexMetrikaId: ${JSON.stringify(newSettings.yandexMetrikaId)},
  psychicImageURL: ${JSON.stringify(newSettings.psychicImageURL)}
};`;

      console.log('[settings-panel.js] Новая строка SITE_SETTINGS:', newSettingsString);

      // 4. Находим позиции старого объявления SITE_SETTINGS в оригинальном файле
      const settingsMatch = originalContent.match(/const\s+SITE_SETTINGS\s*=\s*({[^;]*});/s);
      
      if (!settingsMatch) {
          throw new Error("Не удалось найти объявление SITE_SETTINGS в оригинальном файле для замены.");
      }

      const oldSettingsStart = settingsMatch.index;
      const oldSettingsEnd = oldSettingsStart + settingsMatch[0].length;

      console.log(`[settings-panel.js] Позиции замены: ${oldSettingsStart} - ${oldSettingsEnd}`);

      // 5. Формируем новый контент файла
      const newFileContent = 
          originalContent.substring(0, oldSettingsStart) +
          newSettingsString +
          originalContent.substring(oldSettingsEnd);

      console.log('[settings-panel.js] Новый контент файла (первые 1000 символов):', newFileContent.substring(0, 1000));

      // 6. Кодируем новый контент в base64 для GitHub API
      const encodedContent = btoa(unescape(encodeURIComponent(newFileContent)));

      // 7. Отправляем запрос PUT для обновления файла
      const updateUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}`;
      const updateResponse = await fetch(updateUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: `Обновление настроек для сайта ${targetSite} через панель`,
          content: encodedContent,
          sha: fileSha,
          branch: GITHUB_BRANCH
        })
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        console.error('[settings-panel.js] Ошибка обновления файла. Ответ сервера:', errorData);
        throw new Error(`Ошибка HTTP при обновлении: ${updateResponse.status}. ${errorData.message || 'Неизвестная ошибка'}`);
      }

      const result = await updateResponse.json();
      console.log('[settings-panel.js] Файл успешно обновлен. Новый SHA:', result.content.sha);

      showStatus('Настройки успешно сохранены!', 'success');
      
      // Через некоторое время убираем сообщение об успехе
      setTimeout(() => {
        const statusMsg = document.getElementById('settingStatusMessage');
        if (statusMsg && statusMsg.textContent === 'Настройки успешно сохранены!') {
            statusMsg.style.display = 'none';
        }
      }, 2000);

    } catch (error) {
      console.error('[settings-panel.js] Ошибка в функции saveSettings:', error);
      showStatus(`Ошибка сохранения: ${error.message}`, 'error');
    }
  }


  // ===== УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ =====
  /**
   * Открывает модальное окно настроек для указанного сайта.
   * @param {string} targetSite - Имя сайта (домен).
   */
  function openSettingsModal(targetSite) {
    console.log(`[settings-panel.js] Открытие модального окна для сайта: ${targetSite}`);
    document.getElementById('modalSiteName').textContent = targetSite;
    document.getElementById('settingsModal').style.display = 'flex';
    // Сбрасываем сообщение статуса
    const statusMsg = document.getElementById('settingStatusMessage');
    if (statusMsg) {
      statusMsg.style.display = 'none';
      statusMsg.className = 'status-message';
      statusMsg.textContent = '';
    }
    // Загружаем настройки для выбранного сайта
    loadSettings(targetSite);
  }

  /**
   * Закрывает модальное окно настроек.
   */
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

  // ===== ИНИЦИАЛИЗАЦИЯ МОДУЛЯ =====
  /**
   * Инициализирует модуль: добавляет стили и модальное окно в DOM,
   * назначает обработчики событий.
   */
  function init() {
    console.log('[settings-panel.js] Инициализация модуля settings-panel.js');
    // Проверяем, что скрипт выполняется в браузере
    if (typeof document === 'undefined' || typeof window === 'undefined') {
      console.warn('[settings-panel.js] Скрипт settings-panel.js предназначен для выполнения в браузере.');
      return;
    }

    // Добавляем стили в <head> документа, если они ещё не добавлены
    if (!document.getElementById('settings-modal-styles')) {
      console.log('[settings-panel.js] Добавление стилей в <head>');
      const styleElement = document.createElement('div');
      styleElement.id = 'settings-modal-styles';
      styleElement.innerHTML = styles;
      document.head.appendChild(styleElement);
    } else {
       console.log('[settings-panel.js] Стили уже существуют в <head>');
    }

    // Добавляем HTML модального окна в <body> документа, если оно ещё не добавлено
    if (!document.getElementById('settingsModal')) {
       console.log('[settings-panel.js] Добавление модального окна в <body>');
      const modalElement = document.createElement('div');
      modalElement.innerHTML = modalHTML;
      document.body.appendChild(modalElement.firstElementChild);
    } else {
       console.log('[settings-panel.js] Модальное окно уже существует в <body>');
    }

    // Назначаем обработчики событий для элементов модального окна
    const modal = document.getElementById('settingsModal');
    const span = modal?.querySelector('.close');
    const cancelBtn = document.getElementById('cancelSettingsBtn');
    const saveBtn = document.getElementById('saveSettingsBtn');

    if (span) {
        console.log('[settings-panel.js] Назначение обработчика для кнопки закрытия (X)');
        span.addEventListener('click', closeSettingsModal);
    }
    if (cancelBtn) {
        console.log('[settings-panel.js] Назначение обработчика для кнопки "Отмена"');
        cancelBtn.addEventListener('click', closeSettingsModal);
    }
    if (saveBtn) {
        console.log('[settings-panel.js] Назначение обработчика для кнопки "Сохранить"');
        saveBtn.addEventListener('click', async () => {
            const targetSite = document.getElementById('modalSiteName').textContent;
            if (targetSite) {
                await saveSettings(targetSite);
                // Модальное окно закроется только после успешного сохранения
                // Можно добавить условие, но лучше оставить пользователю самому закрывать
                // setTimeout(() => { closeSettingsModal(); }, 1500);
            }
        });
    }

    // Закрытие модального окна при клике вне его
    console.log('[settings-panel.js] Назначение обработчика для закрытия по клику вне окна');
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        closeSettingsModal();
      }
    });

    // Закрытие модального окна по клавише Escape
    console.log('[settings-panel.js] Назначение обработчика для закрытия по Escape');
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal?.style.display === 'flex') {
        closeSettingsModal();
      }
    });

    // Добавляем функцию openSettingsModal в глобальную область видимости window,
    // чтобы она была доступна из других скриптов (например, из таблицы)
    console.log('[settings-panel.js] Экспорт функции openSettingsModal в window');
    window.openSettingsModal = openSettingsModal;

    console.log('[settings-panel.js] Модуль settings-panel.js успешно инициализирован.');
  }

  // Запускаем инициализацию после загрузки DOM
  console.log('[settings-panel.js] Проверка состояния document');
  if (document.readyState === 'loading') {
    console.log('[settings-panel.js] DOM ещё не загружен, добавление слушателя DOMContentLoaded');
    document.addEventListener('DOMContentLoaded', init);
  } else {
    console.log('[settings-panel.js] DOM уже загружен, запуск инициализации');
    init();
  }

})();
