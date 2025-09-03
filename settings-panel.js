// settings-panel.js
(async function () {
  'use strict';

  // ===== НАСТРОЙКИ =====
  const GITHUB_REPO_OWNER = 'antomimpuls';
  const GITHUB_REPO_NAME = 'gadanie-golos.ru';
  const GITHUB_FILE_PATH = 'index.html';
  const GITHUB_TOKEN = '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'; // ← ВСТАВЬТЕ ТОКЕН

  console.log('Settings panel initialized');

  // ===== СТИЛИ =====
  const styles = `<style>/* стили остаются без изменений */</style>`;

  // ===== HTML МОДАЛЬНОГО ОКНА =====
  const modalHTML = `/* HTML остается без изменений */`;

  // ===== ФУНКЦИИ =====
  async function fetchFile() {
    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_FILE_PATH}`, {
        headers: { 
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      
      const data = await res.json();
      const content = atob(data.content.replace(/\s/g, ''));
      return { sha: data.sha, content };
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  }

  function extractSettings(source) {
    const settings = {};
    const phoneMatch = source.match(/phoneNumber:\s*['"]([^'"]*)['"]/);
    const metricMatch = source.match(/yandexMetrikaId:\s*['"]([^'"]*)['"]/);
    
    if (phoneMatch) settings.phoneNumber = phoneMatch[1];
    if (metricMatch) settings.yandexMetrikaId = metricMatch[1];
    
    return settings;
  }

  function replaceSettings(source, newSettings) {
    let newSource = source;
    
    if (newSettings.phoneNumber) {
      newSource = newSource.replace(/phoneNumber:\s*['"][^'"]*['"]/, `phoneNumber: '${newSettings.phoneNumber}'`);
    }
    
    if (newSettings.yandexMetrikaId) {
      newSource = newSource.replace(/yandexMetrikaId:\s*['"][^'"]*['"]/, `yandexMetrikaId: '${newSettings.yandexMetrikaId}'`);
    }
    
    return newSource;
  }

  // ===== ОСНОВНЫЕ ФУНКЦИИ =====
  async function loadSettings(targetSite) {
    try {
      const { content } = await fetchFile();
      const settings = extractSettings(content);
      
      document.getElementById('settingPhoneNumber').value = settings.phoneNumber || '';
      document.getElementById('settingYandexMetrikaId').value = settings.yandexMetrikaId || '';
      
      showStatus('Данные загружены ✅', 'success');
    } catch (e) {
      showStatus('Ошибка загрузки ❌', 'error');
    }
  }

  async function saveSettings(targetSite) {
    try {
      const { content, sha } = await fetchFile();
      const settings = extractSettings(content);
      
      settings.phoneNumber = document.getElementById('settingPhoneNumber').value;
      settings.yandexMetrikaId = document.getElementById('settingYandexMetrikaId').value;
      
      const newContent = replaceSettings(content, settings);
      await saveFile(newContent, sha);
      
      showStatus('Сохранено ✅', 'success');
    } catch (e) {
      showStatus('Ошибка сохранения ❌', 'error');
    }
  }

  // остальной код без изменений
})();
