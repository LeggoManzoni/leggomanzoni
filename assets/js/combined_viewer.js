// Global state for selected curator filter
let selectedCurator = 'all';

document.addEventListener('DOMContentLoaded', function () {
    const defaultChapter = 'intro';

    // Set initial button text
    document.getElementById('toggle-capitoli').innerText = getDisplayChapterName(defaultChapter);

    // Mark initial chapter as active
    markActiveChapter(defaultChapter);

    // Load initial content
    fetchChapter(defaultChapter);
    fetchCombinedComments(defaultChapter);

    // Setup listeners
    setupChapterClickListener('.chapter-link', handleChapterClick);
    setupCuratorFilterListener();
    setupHoverScrolling();
    highlightHoveredItem();
});

/**
 * Handles chapter selection and updates both text and comments
 */
function handleChapterClick(chapter) {
    fetchChapter(chapter);
    fetchCombinedComments(chapter);
}

/**
 * Fetches chapter text from the server
 */
function fetchChapter(chapter) {
    const imageElement = document.querySelector('.bi.bi-card-image');
    const chapterURL = imageElement ? `./get-chapter/${chapter}` : `./get-chapter-with-images/${chapter}`;

    fetch(chapterURL)
        .then(response => response.text())
        .then(data => {
            const chapterElement = document.querySelector('.text-chapter#whichpage');
            if (chapterElement) {
                chapterElement.innerHTML = data;
                const h1Element = chapterElement.querySelector('h1');
                if (h1Element) {
                    h1Element.className = chapter;
                }

                // Scroll to top
                const promessisposiElement = document.getElementById('promessisposi');
                if (promessisposiElement) {
                    promessisposiElement.scrollTop = 0;
                }

                // Re-highlight after chapter loads (in case comments are already loaded)
                setTimeout(() => {
                    highlightHoveredItem();
                }, 100);
            }
        })
        .catch(error => {
            console.error('Error fetching chapter:', error);
        });
}

/**
 * Fetches combined comments for the chapter and organizes them by target ID
 */
function fetchCombinedComments(chapter) {
    fetch(`./get-combined-comments/${chapter}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            displayCombinedComments(data);
            // After comments are displayed, highlight the corresponding text
            highlightHoveredItem();
        })
        .catch(error => {
            console.error('Error fetching combined comments:', error);
            const commentsContainer = document.querySelector('.text-combined-comments');
            if (commentsContainer) {
                commentsContainer.innerHTML = `<p class="error-message">${window.translations.loadingError || 'Error loading comments'}</p>`;
            }
        });
}

/**
 * Escapes HTML special characters to prevent XSS
 */
/**
 * Processes TEI XML tags in comment content and converts them to HTML
 * Mimics the XSLT transformation used in the reader view
 */
function processTEITags(text) {
    if (!text) return '';

    // First pass: convert TEI tags to HTML tags (preserving formatting)
    // Process <hi rend="italic"> and similar italic tags
    text = text.replace(/<hi\s+rend=["']italic["'][^>]*>(.*?)<\/hi>/gis, '<em>$1</em>');
    text = text.replace(/<rs\s+rend=["']italic["'][^>]*>(.*?)<\/rs>/gis, '<em>$1</em>');

    // Process <title rend="italic"> tags (book/work titles)
    text = text.replace(/<title\s+rend=["']italic(?:h)?["'][^>]*>(.*?)<\/title>/gis, '<em>$1</em>');

    // Process other emphasis tags
    text = text.replace(/<emph[^>]*>(.*?)<\/emph>/gis, '<em>$1</em>');
    text = text.replace(/<foreign[^>]*>(.*?)<\/foreign>/gis, '<em>$1</em>');
    text = text.replace(/<mentioned[^>]*>(.*?)<\/mentioned>/gis, '<em>$1</em>');

    // Process <ref rend="bold"> tags
    text = text.replace(/<ref\s+rend=["']bold["'][^>]*>(.*?)<\/ref>/gis, '<strong>$1</strong>');

    // Process quoted text - use regular quotes
    text = text.replace(/<quote[^>]*>(.*?)<\/quote>/gis, '"$1"');
    text = text.replace(/<q[^>]*>(.*?)<\/q>/gis, '"$1"');
    text = text.replace(/<soCalled[^>]*>(.*?)<\/soCalled>/gis, '"$1"');

    // Second pass: remove structural TEI tags but keep content
    // Remove figure tags (keep figDesc content if present)
    text = text.replace(/<figure[^>]*>.*?<figDesc[^>]*>(.*?)<\/figDesc>.*?<\/figure>/gis, '$1');
    text = text.replace(/<figure[^>]*>.*?<\/figure>/gis, '');

    // Process line breaks
    text = text.replace(/<lb\s*\/?>/gi, ' ');

    // Remove <bibl> tags but keep content
    text = text.replace(/<bibl[^>]*>(.*?)<\/bibl>/gis, '$1');

    // Remove <persName>, <placeName> tags but keep their content
    text = text.replace(/<persName[^>]*>(.*?)<\/persName>/gis, '$1');
    text = text.replace(/<placeName[^>]*>(.*?)<\/placeName>/gis, '$1');

    // Remove <rs> tags (if not already processed as italic)
    text = text.replace(/<rs[^>]*>(.*?)<\/rs>/gis, '$1');

    // Remove <title> tags without rend attribute
    text = text.replace(/<title[^>]*>(.*?)<\/title>/gis, '$1');

    // Remove any remaining TEI tags but keep their content (except em and strong which we want)
    text = text.replace(/<(?!em|\/em|strong|\/strong)([a-zA-Z][a-zA-Z0-9]*)[^>]*>(.*?)<\/\1>/gis, '$2');

    return text;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Displays combined comments organized by target ID
 */
function displayCombinedComments(commentsData) {
    const commentsContainer = document.querySelector('.text-combined-comments');
    if (!commentsContainer) return;

    // Clear existing content
    commentsContainer.innerHTML = '';

    // Filter comments by selected curator if not 'all'
    let filteredData = commentsData;
    if (selectedCurator !== 'all') {
        filteredData = {};
        Object.keys(commentsData).forEach(targetKey => {
            const filteredComments = commentsData[targetKey].filter(comment => {
                // Handle both string and array curator names
                if (Array.isArray(comment.curator)) {
                    // For multi-author commentaries, join with ', ' (comma-space) to match dropdown format
                    // Also trim each name to handle extra spaces
                    const joinedName = comment.curator.map(name => name.trim()).join(', ');
                    return joinedName === selectedCurator;
                }
                return comment.curator === selectedCurator;
            });
            if (filteredComments.length > 0) {
                filteredData[targetKey] = filteredComments;
            }
        });
    }

    // Sort target IDs: primary by start ID, secondary by end ID (for ranges with same start)
    const targetKeys = Object.keys(filteredData).sort((a, b) => {
        const getDigits = (str, isEnd = false) => {
            const parts = str.split('-');
            const target = isEnd && parts.length > 1 ? parts[parts.length - 1] : parts[0];
            const match = target.match(/#(.+)/);
            if (match) {
                // Extract all digits (matches XSLT getNumbers: 'c2_10001' -> '210001')
                const allDigits = match[1].replace(/\D/g, '');
                return parseInt(allDigits) || 0;
            }
            return 0;
        };

        // Primary sort: by starting target ID
        const startDiff = getDigits(a, false) - getDigits(b, false);
        if (startDiff !== 0) return startDiff;

        // Secondary sort: by ending target ID (shorter ranges first)
        return getDigits(a, true) - getDigits(b, true);
    });

    if (targetKeys.length === 0) {
        const noCommentsMsg = selectedCurator === 'all'
            ? 'Nessun commento disponibile per questo capitolo.'
            : `Nessun commento da ${selectedCurator} per questo capitolo.`;
        commentsContainer.innerHTML = `<p class="no-comments">${noCommentsMsg}</p>`;
        return;
    }

    // Create a group for each target ID
    targetKeys.forEach(targetKey => {
        const comments = filteredData[targetKey];

        // Create group container
        const groupDiv = document.createElement('div');
        groupDiv.className = 'comment-group';
        groupDiv.setAttribute('data-target', targetKey);

        // Create header with target ID (hidden by default, useful for debugging)
        const headerDiv = document.createElement('div');
        headerDiv.className = 'comment-group-header debug-info';
        headerDiv.innerHTML = `<strong>Target: ${targetKey}</strong> <span class="comment-count">(${comments.length} ${comments.length === 1 ? 'commentary' : 'commentaries'})</span>`;
        groupDiv.appendChild(headerDiv);

        // Add each curator's comment
        comments.forEach(comment => {
            const commentDiv = document.createElement('div');
            commentDiv.className = 'curator-comment';

            // Create comment content
            const commentContent = document.createElement('div');
            commentContent.className = 'curator-comment-content';

            // Format the content: split on colon to separate ref from text
            const content = comment.content || '';
            const colonIndex = content.indexOf(':');

            // Format curator attribution - handle array curator names
            const curatorName = Array.isArray(comment.curator)
                ? comment.curator.join(', ')
                : comment.curator;
            const curatorAttribution = comment.date ? `${curatorName} (${comment.date})` : curatorName;

            if (colonIndex > 0 && colonIndex < 200) {
                // Has a reference part (before colon)
                const refPart = content.substring(0, colonIndex).trim();
                const textPart = content.substring(colonIndex + 1).trim();

                // Process TEI tags to render properly (italic, remove person names tags, etc.)
                const processedRef = processTEITags(refPart);
                const processedText = processTEITags(textPart);

                commentContent.innerHTML = `<p><strong>${processedRef}:</strong> ${processedText} <span class="curator-attribution">[${curatorAttribution}]</span></p>`;
            } else {
                // No clear reference, just show the content
                const processedContent = processTEITags(content);
                commentContent.innerHTML = `<p>${processedContent} <span class="curator-attribution">[${curatorAttribution}]</span></p>`;
            }

            commentDiv.appendChild(commentContent);

            groupDiv.appendChild(commentDiv);
        });

        commentsContainer.appendChild(groupDiv);
    });

    // Scroll to top of comments
    const destraElement = document.getElementById('destra');
    if (destraElement) {
        destraElement.scrollTop = 0;
    }
}

/**
 * Converts chapter ID to display name
 */
function getDisplayChapterName(chapter) {
    if (chapter === 'intro') return 'Introduzione';
    if (chapter.startsWith('cap')) {
        return 'Capitolo ' + chapter.substring(3);
    }
    return chapter;
}

/**
 * Marks the active chapter in the dropdown
 */
function markActiveChapter(chapter) {
    const chapterLinks = document.querySelectorAll('.chapter-link');
    chapterLinks.forEach(link => {
        if (link.getAttribute('data-chapter') === chapter) {
            link.classList.add('active-chapter');
        } else {
            link.classList.remove('active-chapter');
        }
    });
}

/**
 * Sets up click listener for chapter selection
 */
function setupChapterClickListener(selector, callback) {
    document.querySelectorAll(selector).forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const chapter = this.getAttribute('data-chapter');

            // Update button text
            document.getElementById('toggle-capitoli').innerText = getDisplayChapterName(chapter);

            // Mark as active
            markActiveChapter(chapter);

            // Call the callback
            callback(chapter);
        });
    });
}

/**
 * Sets up click listener for curator filter selection
 */
function setupCuratorFilterListener() {
    document.querySelectorAll('.curator-filter-link').forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const curator = this.getAttribute('data-curator');

            // Update selected curator
            selectedCurator = curator;

            // Update button text
            const buttonText = curator === 'all' ? 'Tutti i commenti' : curator;
            document.getElementById('toggle-curators').innerText = buttonText;

            // Mark as active
            document.querySelectorAll('.curator-filter-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Re-fetch and re-display comments with filter
            const currentChapter = getCurrentChapter();
            fetchCombinedComments(currentChapter);
        });
    });
}

/**
 * Toggles image display on/off
 */
function changeClassAndFetchData() {
    const test_chapter = document.querySelector('.text-chapter#whichpage');
    const h1Element = test_chapter?.querySelector('h1');
    const chapter = h1Element?.className;

    const imageIcon = document.getElementById("imageIcon");
    const popupImage = document.getElementById("popupImage");

    if (!imageIcon || !chapter) return;

    if (imageIcon.className === "bi bi-card-image") {
        imageIcon.className = "bi bi-image-fill";
        popupImage.textContent = window.translations.hideImages;
    } else {
        imageIcon.className = "bi bi-card-image";
        popupImage.textContent = window.translations.showImages;
    }

    // Reload chapter with/without images
    fetchChapter(chapter);
}

/**
 * Highlights text sections that have comments when hovering over them
 * Works with the existing .hover-item class from XSLT transformation
 */
function highlightHoveredItem() {
    const hoverItems = document.querySelectorAll('.hover-item');
    const commentGroups = document.querySelectorAll('.comment-group');

    // First, remove all existing highlights
    hoverItems.forEach(item => item.classList.remove('highlight'));

    // Build a map of which data-ids have comments
    const idsWithComments = new Set();

    commentGroups.forEach(group => {
        const groupTarget = group.getAttribute('data-target');

        // Extract digits only from the START of the comment range
        // For ranges like "quarantana/cap1.xml#c1_10001-quarantana/cap1.xml#c1_10006",
        // only underline the first word (c1_10001) to reduce visual noise
        if (groupTarget) {
            // Split by '-' to handle targetEnd ranges, but only use the first part
            const targets = groupTarget.split('-');
            const firstTarget = targets[0]; // Only process the start ID

            const idMatch = firstTarget.match(/#(.+)/);
            if (idMatch) {
                // Extract only digits from the ID part, matching XSLT getNumbers template
                const allDigits = idMatch[1].replace(/\D/g, '');
                if (allDigits) {
                    idsWithComments.add(allDigits);
                }
            }
        }
    });

    // Add highlight class to items that have comments
    hoverItems.forEach(hoverItem => {
        const dataId = hoverItem.getAttribute('data-id');

        if (dataId && idsWithComments.has(dataId)) {
            hoverItem.classList.add('highlight');
        }
    });
}

/**
 * Sets up click handlers for highlighted text to scroll to comments
 */
function setupHoverScrolling() {
    let currentHighlightedWord = null;

    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('hover-item') && event.target.classList.contains('highlight')) {
            const dataId = event.target.getAttribute('data-id');

            // Remove highlight from previously clicked word
            if (currentHighlightedWord && currentHighlightedWord !== event.target) {
                currentHighlightedWord.classList.remove('active-highlight');
            }

            // Add highlight to clicked word
            event.target.classList.add('active-highlight');
            currentHighlightedWord = event.target;

            // Find ALL comment groups that match the clicked word
            const commentGroups = document.querySelectorAll('.comment-group');
            let matchingGroups = [];
            let scrollTarget = null;  // Only scroll to START matches (precise comments)

            commentGroups.forEach(group => {
                const groupTarget = group.getAttribute('data-target');
                if (!groupTarget) return;

                // Split by '-' to separate start and end targets
                const targets = groupTarget.split('-');
                const firstTarget = targets[0];

                // Check if the clicked word matches the START of this comment
                const firstMatch = firstTarget.match(/#(.+)/);
                if (firstMatch) {
                    const firstDigits = firstMatch[1].replace(/\D/g, '');
                    if (firstDigits === dataId) {
                        matchingGroups.push(group);
                        // Only scroll to the first START match (most precise comment)
                        if (!scrollTarget) {
                            scrollTarget = group;
                        }
                        return;
                    }
                }

                // If not found as start, check if word is at end of range
                // Note: We still highlight end-of-range matches but don't scroll to them
                if (targets.length > 1) {
                    const lastTarget = targets[targets.length - 1];
                    const lastMatch = lastTarget.match(/#(.+)/);
                    if (lastMatch) {
                        const lastDigits = lastMatch[1].replace(/\D/g, '');
                        if (lastDigits === dataId) {
                            matchingGroups.push(group);
                            // Don't set scrollTarget for END matches
                        }
                    }
                }
            });

            if (matchingGroups.length > 0) {
                // Remove previous comment group highlights
                commentGroups.forEach(g => g.classList.remove('highlighted'));

                // Highlight ALL matching groups
                matchingGroups.forEach(group => {
                    group.classList.add('highlighted');
                });

                // Scroll only to START matches (most precise comments)
                // This avoids scrolling to long-range comments where the clicked word is just the end
                if (scrollTarget) {
                    const destraElement = document.getElementById('destra');
                    if (destraElement) {
                        // Calculate position relative to the scrollable container
                        const containerRect = destraElement.getBoundingClientRect();
                        const groupRect = scrollTarget.getBoundingClientRect();
                        const currentScroll = destraElement.scrollTop;

                        // Position the group 20px from the top of the visible area
                        const targetScroll = currentScroll + (groupRect.top - containerRect.top) - 20;

                        destraElement.scrollTo({
                            top: targetScroll,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        }
    });
}

/**
 * Gets the current chapter name from the page
 */
function getCurrentChapter() {
    const h1Element = document.querySelector('.text-chapter#whichpage h1');
    if (h1Element) {
        return h1Element.className || 'intro';
    }
    return 'intro';
}

/**
 * Enables/disables highlighting by pencil icon
 */
function highlightHoveredItemWithPencil() {
    const pencilIcon = document.getElementById("highlightHoveredItem");
    const popupUnderline = document.getElementById("popupUnderline");

    if (!pencilIcon) return;

    if (pencilIcon.classList.contains("bi-pencil-fill")) {
        // Turn OFF highlighting
        pencilIcon.classList.remove("bi-pencil-fill");
        pencilIcon.classList.add("bi-pencil");
        popupUnderline.textContent = window.translations.showComments;

        // Remove highlight class from all hover-items
        const hoverItems = document.querySelectorAll('.hover-item');
        hoverItems.forEach(item => item.classList.remove('highlight'));
    } else {
        // Turn ON highlighting
        pencilIcon.classList.remove("bi-pencil");
        pencilIcon.classList.add("bi-pencil-fill");
        popupUnderline.textContent = window.translations.hideComments;

        // Re-apply highlighting
        highlightHoveredItem();
    }
}
