import { initDashboard, renderUserDashboard } from './dashboard.js';
import { initCommunityScreen } from './community.js';

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  initApp();
});

function setupNavigation() {
  const tabDashboard = document.getElementById('tabDashboard');
  const tabCommunity = document.getElementById('tabCommunity');
  const dashboardView = document.getElementById('dashboardView');
  const communityView = document.getElementById('communityView');

  function switchTab(tab) {
    if (tab === 'community') {
      tabDashboard.classList.remove('active');
      tabCommunity.classList.add('active');
      dashboardView.style.display = 'none';
      communityView.style.display = 'block';
      window.location.hash = 'community';
      initCommunityScreen();
    } else {
      tabCommunity.classList.remove('active');
      tabDashboard.classList.add('active');
      communityView.style.display = 'none';
      dashboardView.style.display = 'block';
      window.location.hash = 'dashboard';
    }
  }

  tabDashboard.addEventListener('click', () => switchTab('dashboard'));
  tabCommunity.addEventListener('click', () => switchTab('community'));

  // Listen to hash
  if (window.location.hash === '#community') {
    switchTab('community');
  } else {
    switchTab('dashboard');
  }

  window.addEventListener('hashchange', () => {
    if (window.location.hash === '#community') {
      switchTab('community');
    } else {
      switchTab('dashboard');
    }
  });
}

async function initApp() {
  await initDashboard();
}
