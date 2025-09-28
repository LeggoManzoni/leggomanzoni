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
    this.init();
  }

  init() {
    // Only initialize if we're in mobile mode
    if (window.innerWidth <= 768) {
      this.setupTabSwitching();
      this.setupDropdowns();
      this.setupSecondaryControls();
      this.setupFloatingActionButton();
      this.setupReadingProgress();
      this.integrateWithExistingFunctions();
    }

    // Listen for resize events
    window.addEventListener('resize', () => {
      this.handleResize();
    });
  }

  setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.mobile-tab-btn');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabName = e.currentTarget.dataset.tab;

        if (tabName === 'secondary' && e.currentTarget.classList.contains('dropdown-toggle')) {
          // Handle dropdown toggle
          this.toggleSecondaryDropdown();
        } else {
          this.switchTab(tabName);
        }
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
    // Secondary tab dropdown
    const secondaryBtn = document.getElementById('secondaryTabBtn');
    const dropdown = document.getElementById('mobileDropdownMenu');

    if (secondaryBtn && dropdown) {
      secondaryBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleSecondaryDropdown();
      });

      // Handle dropdown item selection
      dropdown.addEventListener('click', (e) => {
        if (e.target.classList.contains('mobile-dropdown-item')) {
          e.preventDefault();
          this.handleSecondarySelection(e.target);
        }
      });
    }

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

  toggleSecondaryDropdown() {
    const dropdown = document.getElementById('mobileDropdownMenu');
    const arrow = document.querySelector('.dropdown-arrow');

    if (dropdown) {
      dropdown.classList.toggle('show');

      if (arrow) {
        arrow.style.transform = dropdown.classList.contains('show') ?
          'rotate(180deg)' : 'rotate(0deg)';
      }
    }
  }

  handleSecondarySelection(item) {
    const type = item.dataset.type;
    const value = item.dataset.value;
    const slot = item.dataset.slot || '1';

    // Update active selection in dropdown
    document.querySelectorAll('.mobile-dropdown-item').forEach(dropItem => {
      dropItem.classList.remove('active');
    });
    item.classList.add('active');

    // Update tab label
    const label = document.getElementById('activeSecondaryLabel');
    if (label) {
      label.textContent = value;
    }

    // Update current selection display
    const currentName = document.getElementById('currentSecondaryName');
    if (currentName) {
      currentName.textContent = value;
    }

    // Handle special cases
    if (item.id === 'addSecondaryOption') {
      this.startComparisonMode();
    } else {
      // Load the selected content using existing functions
      this.loadSecondaryContent(type, value, slot);
    }

    this.closeAllDropdowns();
    this.switchTab('secondary');
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
    if (window.loadChapterSimpleFormat) {
      window.loadChapterSimpleFormat(chapter);
    }

    this.currentChapter = chapter;
    this.closeAllDropdowns();
  }

  handleSecondaryControlSelection(item) {
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

    // Handle special cases
    if (item.id === 'addComparisonOption') {
      this.startComparisonMode();
    } else {
      // Load the selected content using existing functions
      this.loadSecondaryContent(type, value, slot);
      // Switch to secondary tab to show the content
      this.switchTab('secondary');
    }

    this.closeAllDropdowns();
  }

  setupSecondaryControls() {
    // Change selection button
    const changeBtn = document.getElementById('changeSecondaryBtn');
    if (changeBtn) {
      changeBtn.addEventListener('click', () => {
        this.toggleSecondaryDropdown();
      });
    }

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
    // Integrate with existing comment/translation loading functions
    if (type === 'comment') {
      // Use existing comment loading function
      if (window.loadComment) {
        window.loadComment(value, slot);
      }
    } else if (type === 'translation') {
      // Use existing translation loading function
      if (window.loadTranslation) {
        window.loadTranslation(value, slot);
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
    document.querySelectorAll('.mobile-dropdown-menu, .mobile-control-dropdown').forEach(dropdown => {
      dropdown.classList.remove('show');
    });

    // Reset dropdown arrows
    document.querySelectorAll('.dropdown-arrow').forEach(arrow => {
      arrow.style.transform = 'rotate(0deg)';
    });
  }

  handleResize() {
    // Handle responsive behavior
    const mobileInterface = document.getElementById('mobileInterface');
    const desktopInterface = document.querySelector('#row-rem');

    if (window.innerWidth <= 768) {
      if (mobileInterface) mobileInterface.style.display = 'flex';
      if (desktopInterface) desktopInterface.style.display = 'none';
      // Sync content when switching to mobile
      this.syncContentToMobile();
    } else {
      if (mobileInterface) mobileInterface.style.display = 'none';
      if (desktopInterface) desktopInterface.style.display = 'flex';
    }
  }

  syncContentToMobile() {
    // Sync main text content from desktop to mobile
    const desktopTextContent = document.getElementById('whichpage');
    const mobileTextContent = document.getElementById('mobileWhichpage');

    if (desktopTextContent && mobileTextContent) {
      mobileTextContent.innerHTML = desktopTextContent.innerHTML;
      // console.log('📱 Synced text content to mobile');
    }

    // Sync comment content from desktop to mobile
    const desktopCommentTop = document.querySelector('.text-comment-top');
    const mobileCommentTop = document.querySelector('#secondarySingleView .text-comment-top');

    if (desktopCommentTop && mobileCommentTop) {
      mobileCommentTop.innerHTML = desktopCommentTop.innerHTML;
      // console.log('📱 Synced comment content to mobile');
    }

    // Sync comment bottom (for comparison mode)
    const desktopCommentBottom = document.querySelector('.text-comment-bottom');
    const mobileCommentBottom = document.querySelector('#comparisonPane2 .text-comment-bottom');

    if (desktopCommentBottom && mobileCommentBottom) {
      mobileCommentBottom.innerHTML = desktopCommentBottom.innerHTML;
      // console.log('📱 Synced comparison content to mobile');
    }
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
        if (window.innerWidth <= 768) {
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