document.addEventListener('DOMContentLoaded', function () {
    // Constants and variables
    const defaultLanguage = 'German_1880';
    const defaultLanguage2 = 'French_1877';
    const defaultChapter = 'intro'; // Ensure defaultChapter is set

    // // Set default languages
    document.getElementById('toggle-capitoli').innerText = getDisplayChapterName(defaultChapter);
    document.getElementById('toggle-commenti1').innerText = defaultLanguage;
    document.getElementById('toggle-commenti2').innerText = defaultLanguage2;

    markActiveSelections(defaultChapter, defaultLanguage, defaultLanguage2);

    // Fetch and display the default translation and chapter
    fetchAndDisplayData(`./get-translation/${defaultLanguage}/${defaultChapter}`, '.text-comment-top');
    fetchChapter(defaultChapter);

    // Setup MutationObserver
    setupMutationObserver('.divisione');

    // Setup click event listeners for links
    setupMutationObserver('.divisione');
    setupChapterClickListener('.chapter-link', fetchChapter);
    setupLinkClickListener('.comment-link', fetchAndDisplayData, '.text-comment-top');
    setupLinkClickListener('.comment-link-2', fetchAndDisplayData, '.text-comment-bottom');

    setupHoverScrolling();
});

function getDisplayChapterName(chapter) {
    if (chapter === 'intro') return 'Introduzione';
    if (chapter.startsWith('cap')) {
        return 'Capitolo ' + chapter.substring(3);
    }
    return chapter;
}

function markActiveSelections(chapter, comment1, comment2) {
    // Mark active chapter
    const chapterLinks = document.querySelectorAll('.chapter-link');
    chapterLinks.forEach(link => {
        if (link.getAttribute('data-chapter') === chapter) {
            link.classList.add('active-chapter');
        } else {
            link.classList.remove('active-chapter');
        }
    });

    // Mark active comments
    const commentLinks1 = document.querySelectorAll('.comment-link');
    commentLinks1.forEach(link => {
        if (link.getAttribute('data-comment') === comment1) {
            link.classList.add('active-comment');
        } else {
            link.classList.remove('active-comment');
        }
    });

    if (comment2) {
        const commentLinks2 = document.querySelectorAll('.comment-link-2');
        commentLinks2.forEach(link => {
            if (link.getAttribute('data-comment') === comment2) {
                link.classList.add('active-comment');
            } else {
                link.classList.remove('active-comment');
            }
        });
    }
}



let toggleColumn = () => {
    const bottomDiv = document.getElementById("bottomDiv");
    const upperDiv = document.getElementById("upperDiv");
    const icon = document.getElementById("splitButton");
    const text = document.getElementById("popup");
    const buttonComments = document.getElementById("toggle-commenti2");

    if (bottomDiv.classList.contains("hide")) {
        // Show the bottom div
        bottomDiv.classList.remove("hide");
        upperDiv.classList.remove("singularText");
        icon.classList.replace("bi-plus-circle", "bi-dash-circle");
        text.textContent = "Clicca qui per visualizzare un solo commento.";
        buttonComments.classList.remove("hide");

        // Fetch the second translation
        const activeChapterElement = document.querySelector('.chapter-link.active-chapter');
        const activeChapter = activeChapterElement ? activeChapterElement.getAttribute('data-chapter') : "intro";
        const activeCommentElement2 = document.querySelector('.comment-link-2.active-comment');
        const activeComment2 = activeCommentElement2 ? activeCommentElement2.getAttribute('data-comment') : defaultLanguage2;
        fetchAndDisplayData(`./get-translation/${activeComment2}/${activeChapter}`, '.text-comment-bottom');
    } else {
        // Hide the bottom div
        bottomDiv.classList.add("hide");
        upperDiv.classList.add("singularText");
        icon.classList.replace("bi-dash-circle", "bi-plus-circle");
        text.textContent = "Clicca qui per visualizzare due commenti.";
        buttonComments.classList.add("hide");

        // Clear the content of the second translation
        document.querySelector('.text-comment-bottom').innerHTML = '';
    }

    // Update the highlighting
    highlightHoveredItem();
};




function fetchChapter(activeChapter) {
    const imageElement = document.querySelector('.bi.bi-card-image');
    let chapterURL = imageElement ? `./get-chapter/${activeChapter}` : `./get-chapter-with-images/${activeChapter}`;

    // Get active translations
    const activeCommentElement = document.querySelector('.comment-link.active-comment');
    const activeComment = activeCommentElement ? activeCommentElement.getAttribute('data-comment') : "German_1880";

    const activeCommentElement2 = document.querySelector('.comment-link-2.active-comment');
    const activeComment2 = activeCommentElement2 ? activeCommentElement2.getAttribute('data-comment') : defaultLanguage2;

    // Fetch the chapter
    fetch(chapterURL)
        .then(response => response.text())
        .then(data => {
            const chapterElement = document.querySelector('.text-chapter');
            if (chapterElement) {
                chapterElement.innerHTML = data;
                const h1Element = chapterElement.querySelector('h1');
                h1Element.className = activeChapter;
                document.getElementById('promessisposi').scrollTop = 0;

                highlightHoveredItem();

                // Fetch the active translations
                fetchAndDisplayData(`./get-translation/${activeComment}/${activeChapter}`, '.text-comment-top');

                // Check if the second translation is visible
                const bottomDiv = document.getElementById('bottomDiv');
                const isBottomCommentActive = !bottomDiv.classList.contains('hide');
                if (isBottomCommentActive && activeComment2) {
                    fetchAndDisplayData(`./get-translation/${activeComment2}/${activeChapter}`, '.text-comment-bottom');
                } else {
                    // Clear the content if the second translation is hidden
                    document.querySelector('.text-comment-bottom').innerHTML = '';
                }
            }
        })
        .catch(console.error);
}



function changeClassAndFetchData(activeChapter) {
    // Change the image class to 'bi bi-image-fill'
    const test_chapter = document.querySelector('.text-chapter#whichpage');
    const h1Element = test_chapter.querySelector('h1');
    chapter = h1Element.className;

    const imageIcon = document.getElementById("imageIcon");
    const popupImage = document.getElementById("popupImage");

    if (imageIcon.className === "bi bi-card-image") {        
        imageIcon.className = "bi bi-image-fill";
         popupImage.textContent = "Visualizza il testo senza le immagini.";
    } else {
        imageIcon.className = "bi bi-card-image";
        popupImage.textContent = "Visualizza il testo con le immagini.";
    }
    fetchChapter(activeChapter);
}

function fetchAndDisplayData(endpoint, selector, attribute) {
    fetch(endpoint)
        .then(response => response.text())
        .then(data => {
            const element = document.querySelector(selector);
            if (element) {
                element.innerHTML = data;
                highlightHoveredItem();
            }
        })
        .then(removeHighlightFromHoverItems())
        .catch(console.error);
}

function setupMutationObserver(selector) {
    const targetNode = document.querySelector(selector);
    if (targetNode) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    // Remove the fetchAndDisplayData call
                    // Just update the highlighting
                    highlightHoveredItem();
                }
            }
        });
        observer.observe(targetNode, { attributes: true, attributeFilter: ['class'] });
    }
}


function setupLinkClickListener(selector, fetchAndDisplayFunction, displaySelector) {
    document.querySelectorAll(selector).forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const selectedLanguage = event.target.getAttribute('data-comment');

            // Update active class
            document.querySelectorAll(selector).forEach(link => link.classList.remove('active-comment'));
            event.target.classList.add('active-comment');

            // Update the Lingua button label
            if (displaySelector === '.text-comment-top') {
                document.getElementById('toggle-commenti1').innerText = selectedLanguage;
            } else if (displaySelector === '.text-comment-bottom') {
                document.getElementById('toggle-commenti2').innerText = selectedLanguage;
            }

            // Get the active chapter
            const activeChapterElement = document.querySelector('.chapter-link.active-chapter');
            const activeChapter = activeChapterElement ? activeChapterElement.getAttribute('data-chapter') : "intro";

            fetchAndDisplayFunction(`./get-translation/${selectedLanguage}/${activeChapter}`, displaySelector);
        });
    });
}


function setupChapterClickListener(selector, fetchAndDisplayFunction) {
    document.querySelectorAll(selector).forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const data = event.target.getAttribute('data-chapter');

            // Update active class
            document.querySelectorAll(selector).forEach(link => link.classList.remove('active-chapter'));
            event.target.classList.add('active-chapter');

            // Update the Capitoli button text
            document.getElementById('toggle-capitoli').innerText = getDisplayChapterName(data);

            fetchAndDisplayFunction(data);
        });
    });
}

function removeHighlightFromHoverItems() {
    const hoverItems = Array.from(document.querySelectorAll('.hover-item'));

    // For each hover-item, remove the highlight class
    hoverItems.forEach(hoverItem => {
        hoverItem.classList.remove('highlight');
    });
}

// Utility function to check if the target element has the specified classes
function hasSingularTextClass(target) {
    return target.classList.contains('divisione') && target.classList.contains('singularText');
}

function highlightHoveredItem() {
    const hoverItems = Array.from(document.querySelectorAll('.hover-item'));
    let scrollItems = [];

    const commentsContainer = document.getElementById("upperDiv");
    const bottomCommentsContainer = document.getElementById("bottomDiv");

    const isBottomCommentActive = !bottomCommentsContainer.classList.contains('hide');

    // Collect scroll-items from active translations
    const upperScrollItems = Array.from(commentsContainer.querySelectorAll('.scroll-item'));
    scrollItems = scrollItems.concat(upperScrollItems);

    if (isBottomCommentActive) {
        const bottomScrollItems = Array.from(bottomCommentsContainer.querySelectorAll('.scroll-item'));
        scrollItems = scrollItems.concat(bottomScrollItems);
    }

    // Remove existing highlights
    hoverItems.forEach(item => item.classList.remove('highlight'));

    // Add highlights based on active translations
    hoverItems.forEach(hoverItem => {
        const hoverItemId = hoverItem.getAttribute('data-id');
        const correspondingScrollItem = scrollItems.find(scrollItem => scrollItem.getAttribute('data-related-id') === hoverItemId);

        if (correspondingScrollItem) {
            hoverItem.classList.add('highlight');
        }
    });
}


function setupHoverScrolling() {
    const commentsContainer = document.getElementById("upperDiv");
    const bottomCommentsContainer = document.getElementById("bottomDiv");

    document.addEventListener('click', function (event) {
        if (event.target.classList.contains('hover-item')) {
            const dataId = event.target.getAttribute('data-id');

            let upperCorrespondingElement, bottomCorrespondingElement;
            let upperStartId, upperEndId, bottomStartId, bottomEndId;

            const upperElements = Array.from(commentsContainer.querySelectorAll('.scroll-item'));
            const bottomElements = Array.from(bottomCommentsContainer.querySelectorAll('.scroll-item'));

            // Find the corresponding element in the upper translation
            upperElements.forEach(el => {
                const currentId = parseInt(el.getAttribute('data-related-id'), 10);
                if (currentId == dataId) {
                    upperCorrespondingElement = el;
                    upperStartId = currentId;
                    upperEndId = parseInt(el.getAttribute('data-end-id'), 10);
                }
            });

            // Find the corresponding element in the bottom translation if active
            const isBottomCommentActive = !bottomCommentsContainer.classList.contains('hide');
            if (isBottomCommentActive) {
                bottomElements.forEach(el => {
                    const currentId = parseInt(el.getAttribute('data-related-id'), 10);
                    if (currentId == dataId) {
                        bottomCorrespondingElement = el;
                        bottomStartId = currentId;
                        bottomEndId = parseInt(el.getAttribute('data-end-id'), 10);
                    }
                });
            }

            // Remove existing highlights
            const allElements = upperElements.concat(bottomElements);
            allElements.forEach(el => el.classList.remove('highlight-comment'));

            // Scroll to and highlight the corresponding elements
            if (upperCorrespondingElement) {
                commentsContainer.scrollTop = upperCorrespondingElement.offsetTop - commentsContainer.offsetTop;
                upperCorrespondingElement.classList.add('highlight-comment');
            }

            if (isBottomCommentActive && bottomCorrespondingElement) {
                bottomCommentsContainer.scrollTop = bottomCorrespondingElement.offsetTop - bottomCommentsContainer.offsetTop;
                bottomCorrespondingElement.classList.add('highlight-comment');
            }

            // Highlight the text in the original content
            const hoverItems = Array.from(document.querySelectorAll('.hover-item'));
            hoverItems.forEach(hoverItem => {
                const hoverItemId = hoverItem.getAttribute('data-id');
                if ((upperStartId && hoverItemId >= upperStartId && hoverItemId <= upperEndId) ||
                    (isBottomCommentActive && bottomStartId && hoverItemId >= bottomStartId && hoverItemId <= bottomEndId)) {
                    hoverItem.classList.add('highlight-text');
                } else {
                    hoverItem.classList.remove('highlight-text');
                }
            });
        }
    });
}
