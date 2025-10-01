/*!
 * Mobile Tab Controller for LeggoManzoni
 * Handles tab switching, dropdown functionality, and mobile-specific interactions
 */

class MobileTabController {
  constructor() {
    this.activeTab = 'text';
    this.activeSecondary = null;
    this.comparisonMode = false;
    this.currentChapter = 'intro';
    this.currentMode = null; // 'desktop', 'mobile-portrait', 'mobile-landscape'
    this.mobileInterfaceInitialized = false; // Track if mobile event listeners are set up
    this.init();
  }

  init() {
    // Determine initial mode
    this.currentMode = this.detectDeviceMode();

    // Initialize appropriate interface based on mode
    if (this.currentMode === 'mobile-portrait') {
      this.setupTabSwitching();
      this.setupDropdowns();
      this.setupSecondaryControls();
      this.setupFloatingActionButton();
      this.setupReadingProgress();
      this.integrateWithExistingFunctions();
      this.mobileInterfaceInitialized = true;
    }

    // Listen for resize and orientation change events
    window.addEventListener('resize', () => {
      this.handleResize();
    });

    window.addEventListener('orientationchange', () => {
      // Add small delay to allow browser to update dimensions
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });
  }

  /**
   * Detect current device mode based on screen size and orientation
   * @returns {string} 'desktop', 'mobile-portrait', or 'mobile-landscape'
   */
  detectDeviceMode() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const isLandscape = width > height;

    // Landscape mode: width ≤ 1024px, landscape orientation, height ≤ 768px
    if (width <= 1024 && isLandscape && height <= 768) {
      return 'mobile-landscape';
    }

    // Mobile portrait: width ≤ 768px, portrait orientation
    if (width <= 768 && !isLandscape) {
      return 'mobile-portrait';
    }

    // Everything else is desktop
    return 'desktop';
  }

  setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.mobile-tab-btn');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const tabName = e.currentTarget.dataset.tab;
        this.switchTab(tabName);
      });
    });
  }

  switchTab(tabName) {
    // Update active tab
    this.activeTab = tabName;

    // Update tab button states
    document.querySelectorAll('.mobile-tab-btn').forEach(btn => {
      btn.classList.remove('active');
    });

    const activeButton = document.querySelector(`[data-tab="${tabName}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }

    // Update tab content visibility
    document.querySelectorAll('.mobile-tab-pane').forEach(pane => {
      pane.classList.remove('active');
    });

    const activePane = document.getElementById(`${tabName}TabPane`);
    if (activePane) {
      activePane.classList.add('active');
    }

    // Update reading progress
    this.updateReadingProgress();
  }

  setupDropdowns() {

    // Chapter dropdown
    const chapterBtn = document.getElementById('mobileChapterBtn');
    const chapterDropdown = document.getElementById('chapterDropdown');

    // Secondary dropdown in controls
    const mobileSecondaryBtn = document.getElementById('mobileSecondaryBtn');
    const secondaryDropdownControls = document.getElementById('secondaryDropdown');

    if (chapterBtn && chapterDropdown) {
      chapterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        chapterDropdown.classList.toggle('show');
      });

      chapterDropdown.addEventListener('click', (e) => {
        if (e.target.classList.contains('mobile-control-item')) {
          e.preventDefault();
          this.handleChapterSelection(e.target);
        }
      });
    }

    // Secondary dropdown in controls
    if (mobileSecondaryBtn && secondaryDropdownControls) {
      mobileSecondaryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        secondaryDropdownControls.classList.toggle('show');
      });

      secondaryDropdownControls.addEventListener('click', (e) => {
        if (e.target.classList.contains('mobile-control-item')) {
          e.preventDefault();
          this.handleSecondaryControlSelection(e.target);
        }
      });
    }

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      this.closeAllDropdowns();
    });
  }

  toggleSelectionDropdown() {
    const dropdown = document.getElementById('mobileSelectionDropdown');

    if (dropdown) {
      dropdown.classList.toggle('show');
    }
  }


  handleChapterSelection(item) {
    const chapter = item.dataset.chapter;
    const display = item.dataset.display;

    // Update chapter label
    const label = document.getElementById('currentChapterLabel');
    if (label) {
      label.textContent = display;
    }

    // Update active selection
    document.querySelectorAll('.mobile-control-item').forEach(chapterItem => {
      chapterItem.classList.remove('active');
    });
    item.classList.add('active');

    // Load chapter using existing function
    if (typeof fetchChapter === 'function') {
      fetchChapter(chapter);
    }

    this.currentChapter = chapter;
    this.closeAllDropdowns();
  }

  handleSecondaryControlSelection(item) {
    // Handle special cases - only comparison mode now
    if (item.id === 'addComparisonOption') {
      this.startComparisonMode();
      // Switch to secondary tab to show comparison
      this.switchTab('secondary');
    } else {
      // For regular content selection, load it and switch to secondary tab
      const type = item.dataset.type;
      const value = item.dataset.value;
      const slot = item.dataset.slot || '1';

      // Update active selection in dropdown
      document.querySelectorAll('#secondaryDropdown .mobile-control-item').forEach(dropItem => {
        dropItem.classList.remove('active');
      });
      item.classList.add('active');

      // Update secondary label
      const label = document.getElementById('currentSecondaryLabel');
      if (label) {
        label.textContent = value;
      }

      // Load the selected content using existing functions
      this.loadSecondaryContent(type, value, slot);
      // Switch to secondary tab to show the content
      this.switchTab('secondary');
    }

    this.closeAllDropdowns();
  }

  setupSecondaryControls() {
    // No secondary controls needed with simple select dropdown

    // Comparison controls
    const comparisonTabs = document.querySelectorAll('.comparison-tab');
    comparisonTabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        const slot = e.currentTarget.dataset.slot;
        this.switchComparisonPane(slot);
      });
    });

    // Close comparison button
    const closeComparisonBtn = document.getElementById('closeComparisonBtn');
    if (closeComparisonBtn) {
      closeComparisonBtn.addEventListener('click', () => {
        this.exitComparisonMode();
      });
    }
  }

  startComparisonMode() {
    this.comparisonMode = true;

    // Show comparison controls
    const comparisonControls = document.getElementById('comparisonControls');
    if (comparisonControls) {
      comparisonControls.classList.remove('hide');
    }

    // Switch to comparison view
    const singleView = document.getElementById('secondarySingleView');
    const comparisonView = document.getElementById('secondaryComparisonView');

    if (singleView) singleView.classList.add('hide');
    if (comparisonView) comparisonView.classList.remove('hide');
  }

  exitComparisonMode() {
    this.comparisonMode = false;

    // Hide comparison controls
    const comparisonControls = document.getElementById('comparisonControls');
    if (comparisonControls) {
      comparisonControls.classList.add('hide');
    }

    // Switch to single view
    const singleView = document.getElementById('secondarySingleView');
    const comparisonView = document.getElementById('secondaryComparisonView');

    if (singleView) singleView.classList.remove('hide');
    if (comparisonView) comparisonView.classList.add('hide');
  }

  switchComparisonPane(slot) {
    // Update tab states
    document.querySelectorAll('.comparison-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.getElementById(`comparisonTab${slot}`).classList.add('active');

    // Update pane visibility
    document.querySelectorAll('.comparison-pane').forEach(pane => {
      pane.classList.remove('active');
    });
    document.getElementById(`comparisonPane${slot}`).classList.add('active');
  }

  setupFloatingActionButton() {
    const fab = document.getElementById('mobileFab');
    const fabBtn = document.getElementById('fabMainBtn');
    const fabMenu = document.getElementById('fabMenu');

    if (fabBtn && fabMenu) {
      fabBtn.addEventListener('click', () => {
        fabMenu.classList.toggle('hide');
      });

      // FAB menu items
      document.getElementById('fabInfo')?.addEventListener('click', () => {
        if (window.open) {
          window.open('./commenti', '_blank');
        }
      });

      document.getElementById('fabBookmark')?.addEventListener('click', () => {
        this.handleBookmark();
      });

      document.getElementById('fabShare')?.addEventListener('click', () => {
        this.handleShare();
      });
    }
  }

  setupReadingProgress() {
    // Update progress based on scroll position in text content
    const textContent = document.getElementById('mobileTextContent');
    if (textContent) {
      textContent.addEventListener('scroll', () => {
        this.updateReadingProgress();
      });
    }
  }

  updateReadingProgress() {
    const textContent = document.getElementById('mobileTextContent');
    const progressFill = document.getElementById('readingProgress');

    if (textContent && progressFill) {
      const scrollTop = textContent.scrollTop;
      const scrollHeight = textContent.scrollHeight - textContent.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;

      progressFill.style.width = `${progress}%`;
    }
  }

  loadSecondaryContent(type, value, slot) {
    // Get active chapter
    const activeChapterElement = document.querySelector('.chapter-link.active-chapter');
    const activeChapter = activeChapterElement ? activeChapterElement.getAttribute('data-chapter') : 'intro';

    // Integrate with existing translation/comment loading functions
    if (type === 'translation') {
      // Use existing fetchAndDisplayData function for translations
      if (typeof fetchAndDisplayData === 'function') {
        const sourceSuffix = window.isAlternateSource ? 's' : '';
        const endpoint = `./get-translation/${value}${sourceSuffix}/${activeChapter}`;

        if (slot === '1') {
          fetchAndDisplayData(endpoint, '#upperDiv .text-comment-top');
        } else {
          fetchAndDisplayData(endpoint, '#bottomDiv .text-comment-bottom');
        }
      }
    } else if (type === 'comment') {
      // For comments, use the get-comment endpoint
      if (typeof fetchAndDisplayData === 'function') {
        const endpoint = `./get-comment/${value}/${activeChapter}`;

        if (slot === '1') {
          fetchAndDisplayData(endpoint, '#upperDiv .text-comment-top');
        } else {
          fetchAndDisplayData(endpoint, '#bottomDiv .text-comment-bottom');
        }
      }
    }
  }

  integrateWithExistingFunctions() {
    // Sync content from desktop to mobile after initial load
    // Wait for initial content to load, then sync
    setTimeout(() => {
      this.syncContentToMobile();
    }, 1000);

    // Also sync after each content update
    this.observeContentChanges();

    // Hook into existing button functionality
    const mobileFont = document.getElementById('mobileFont');
    if (mobileFont && window.changeFont) {
      mobileFont.addEventListener('click', window.changeFont);
    }

    const mobileImages = document.getElementById('mobileImages');
    if (mobileImages && window.changeClassAndFetchData) {
      mobileImages.addEventListener('click', window.changeClassAndFetchData);
    }

    const mobileHighlight = document.getElementById('mobileHighlight');
    if (mobileHighlight && window.highlightHoveredItemWithPencil) {
      mobileHighlight.addEventListener('click', window.highlightHoveredItemWithPencil);
    }

    const mobileFullscreen = document.getElementById('mobileFullscreen');
    if (mobileFullscreen) {
      mobileFullscreen.addEventListener('click', () => {
        this.toggleFullscreen();
      });
    }

    const mobileSource = document.getElementById('mobileSource');
    if (mobileSource && window.changeSourceLevel) {
      mobileSource.addEventListener('click', window.changeSourceLevel);
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }

  handleBookmark() {
    // Implement bookmark functionality
    const chapter = this.currentChapter;
    const position = document.getElementById('mobileTextContent')?.scrollTop || 0;

    // Store in localStorage
    const bookmark = {
      chapter: chapter,
      position: position,
      timestamp: Date.now()
    };

    localStorage.setItem('leggoManzoni_bookmark', JSON.stringify(bookmark));

    // Show feedback
    this.showToast('Posizione salvata');
  }

  handleShare() {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'LeggoManzoni',
        text: `Leggendo ${this.currentChapter}`,
        url: window.location.href
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      this.showToast('Link copiato');
    }
  }

  showToast(message) {
    // Simple toast notification
    const toast = document.createElement('div');
    toast.className = 'mobile-toast';
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 100px;
      left: 50%;
      transform: translateX(-50%);
      background: #333;
      color: white;
      padding: 12px 24px;
      border-radius: 24px;
      z-index: 10000;
      font-size: 14px;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  closeAllDropdowns() {
    document.querySelectorAll('.mobile-selection-dropdown, .mobile-control-dropdown').forEach(dropdown => {
      dropdown.classList.remove('show');
    });
  }

  /**
   * Handle orientation changes
   */
  handleOrientationChange() {
    const newMode = this.detectDeviceMode();

    // Only act if mode actually changed
    if (newMode !== this.currentMode) {
      console.log(`Orientation changed: ${this.currentMode} → ${newMode}`);
      this.currentMode = newMode;
      this.switchToMode(newMode);
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    const newMode = this.detectDeviceMode();

    // Only act if mode actually changed
    if (newMode !== this.currentMode) {
      console.log(`Screen size changed: ${this.currentMode} → ${newMode}`);
      this.currentMode = newMode;
      this.switchToMode(newMode);
    }
  }

  /**
   * Switch interface to appropriate mode
   * @param {string} mode - 'desktop', 'mobile-portrait', or 'mobile-landscape'
   */
  switchToMode(mode) {
    const mobileInterface = document.getElementById('mobileInterface');
    const desktopInterface = document.querySelector('#row-rem');

    switch (mode) {
      case 'desktop':
        // Desktop: show desktop interface, hide mobile tabs
        if (mobileInterface) mobileInterface.style.display = 'none';
        if (desktopInterface) desktopInterface.style.display = 'flex';
        break;

      case 'mobile-portrait':
        // Mobile Portrait: show mobile tabs, hide desktop interface
        if (mobileInterface) mobileInterface.style.display = 'flex';
        if (desktopInterface) desktopInterface.style.display = 'none';
        // Ensure mobile interface is set up (in case switching from another mode)
        if (!this.mobileInterfaceInitialized) {
          this.setupTabSwitching();
          this.setupDropdowns();
          this.setupSecondaryControls();
          this.setupFloatingActionButton();
          this.setupReadingProgress();
          this.integrateWithExistingFunctions();
          this.mobileInterfaceInitialized = true;
        }
        // Sync content from desktop to mobile
        this.syncContentToMobile();
        break;

      case 'mobile-landscape':
        // Mobile Landscape: show desktop interface (CSS handles layout)
        // Hide mobile tabs, show two-column desktop layout
        if (mobileInterface) mobileInterface.style.display = 'none';
        if (desktopInterface) desktopInterface.style.display = 'flex';
        // Sync content from mobile tabs to desktop if needed
        this.syncContentToDesktop();
        break;
    }
  }

  syncContentToMobile() {
    // Sync main text content from desktop to mobile
    const desktopTextContent = document.getElementById('whichpage');
    const mobileTextContent = document.getElementById('mobileWhichpage');

    if (desktopTextContent && mobileTextContent) {
      mobileTextContent.innerHTML = desktopTextContent.innerHTML;
    }

    // Sync comment content from desktop to mobile - simplified approach
    const desktopCommentTop = document.querySelector('#upperDiv .text-comment-top');
    const mobileSecondaryContent = document.querySelector('#mobileSecondaryContent .text-comment-top');

    if (desktopCommentTop && mobileSecondaryContent) {
      // Directly copy desktop comments to mobile secondary content
      mobileSecondaryContent.innerHTML = desktopCommentTop.innerHTML;
    }

    // Auto-switch to secondary tab if there's content and we're not already there
    if (desktopCommentTop && desktopCommentTop.innerHTML.trim().length > 50 && this.activeTab === 'text') {
      // Update the secondary label to show what's currently loaded
      this.updateSecondaryLabel();
    }
  }

  updateSecondaryLabel() {
    // Try to determine what comment/translation is currently loaded
    // This is a bit tricky since we need to reverse-engineer from the content
    // For now, we'll just show a generic label
    const label = document.getElementById('currentSecondaryLabel');
    if (label) {
      const isReader = window.location.pathname.includes('reader');
      label.textContent = isReader ? 'Commento' : 'Traduzione';
    }
  }

  /**
   * Sync content from mobile tabs to desktop interface
   * Used when switching from portrait to landscape
   */
  syncContentToDesktop() {
    // In landscape mode, desktop interface is already populated
    // We just need to ensure it's visible
    // The existing desktop functions (converted_content.js) handle all interactions
    console.log('Switched to landscape mode - desktop interactions active');
  }

  observeContentChanges() {
    // Watch for changes in desktop content and sync to mobile
    const desktopTextContent = document.getElementById('whichpage');
    const desktopCommentTop = document.querySelector('.text-comment-top');
    const desktopCommentBottom = document.querySelector('.text-comment-bottom');

    // Throttle sync to prevent excessive calls
    let syncTimeout;
    const throttledSync = () => {
      clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        // Only sync to mobile if in portrait mode
        if (this.currentMode === 'mobile-portrait') {
          this.syncContentToMobile();
        }
      }, 500); // Wait 500ms before syncing
    };

    if (desktopTextContent) {
      const observer = new MutationObserver(throttledSync);

      observer.observe(desktopTextContent, {
        childList: true,
        subtree: true
        // Removed characterData: true to reduce excessive triggers
      });
    }

    if (desktopCommentTop) {
      const commentObserver = new MutationObserver(throttledSync);

      commentObserver.observe(desktopCommentTop, {
        childList: true,
        subtree: true,
        characterData: true
      });
    }
  }
}

// Initialize mobile controller when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('mobileInterface')) {
    window.mobileController = new MobileTabController();
    // Call handleResize once to set initial state correctly
    if (window.mobileController.handleResize) {
      window.mobileController.handleResize();
    }
  }
});

// Export for potential use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileTabController;
}