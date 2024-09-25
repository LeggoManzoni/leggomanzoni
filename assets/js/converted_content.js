document.addEventListener('DOMContentLoaded', function () {
    const defaultComment = 'Badini Confalonieri, Luca';
    const defaultChapter = 'intro';

    fetchAndDisplayData(`./get-comment/${defaultComment}/${defaultChapter}`, '.text-comment-top');
    fetchChapter(defaultChapter);

    setupMutationObserver('.divisione');
    setupChapterClickListener('.chapter-link', fetchChapter);
    setupLinkClickListener('.comment-link', fetchAndDisplayData, '.text-comment-top');
    setupLinkClickListener('.comment-link-2', fetchAndDisplayData, '.text-comment-bottom');

    setupHoverScrolling();
    highlightHoveredItem();
});

function fetchChapter(chapter) {
    const imageElement = document.querySelector('.bi.bi-card-image');
    const chapterURL = imageElement ? `./get-chapter/${chapter}` : `./get-chapter-with-images/${chapter}`;

    // Get the active comments from the DOM
    const activeCommentElement = document.querySelector('.comment-link.active-comment');
    const activeComment = activeCommentElement ? activeCommentElement.getAttribute('data-comment') : 'Badini Confalonieri, Luca'; // Fallback to default comment if no active comment found

    const activeCommentElement2 = document.querySelector('.comment-link-2.active-comment');
    const activeComment2 = activeCommentElement2 ? activeCommentElement2.getAttribute('data-comment') : 'Angelini, Cesare'; // Fallback to default comment if no active comment found

    fetch(chapterURL)
        .then(response => response.text())
        .then(data => {
            const chapterElement = document.querySelector('.text-chapter');
            if (chapterElement) {
                chapterElement.innerHTML = data;
                const test_chapter = document.querySelector('.text-chapter#whichpage');
                const h1Element = test_chapter.querySelector('h1');
                h1Element.className = chapter;
                const promessisposiElement = document.getElementById('promessisposi');
                if (promessisposiElement) {
                    promessisposiElement.scrollTop = 0;
                }

                // Fetch and display comments for the new chapter
                fetchAndDisplayData(`./get-comment/${activeComment}/${chapter}`, '.text-comment-top');
                fetchAndDisplayData(`./get-comment/${activeComment2}/${chapter}`, '.text-comment-bottom');

                highlightHoveredItem();
            }
        })
        .catch(console.error);
}

function changeClassAndFetchData() {
    const test_chapter = document.querySelector('.text-chapter#whichpage');
    const h1Element = test_chapter.querySelector('h1');
    const chapter = h1Element.className;

    const imageIcon = document.getElementById("imageIcon");
    const popupImage = document.getElementById("popupImage");

    if (imageIcon.className === "bi bi-card-image") {        
        imageIcon.className = "bi bi-image-fill";
        popupImage.textContent = "Visualizza il testo senza le immagini.";
    } else {
        imageIcon.className = "bi bi-card-image";
        popupImage.textContent = "Visualizza il testo con le immagini.";
    }
    fetchChapter(chapter);
}

function fetchAndDisplayData(endpoint, selector) {
    fetch(endpoint)
        .then(response => response.text())
        .then(data => {
            const element = document.querySelector(selector);
            if (element) {
                removeHighlightFromHoverItems();
                element.innerHTML = data;
                highlightHoveredItem();
            }
        })
        .catch(console.error);
}

function setupMutationObserver(selector) {
    const targetNode = document.querySelector(selector);
    if (targetNode) {
        const observer = new MutationObserver(mutationsList => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const comment = hasSingularTextClass(mutation.target) ? '' : 'Angelini, Cesare';
                    const chapter = document.querySelector('.chapter-link').getAttribute('data-chapter');
                    fetchAndDisplayData(`./get-comment/${comment}/${chapter}`, '.text-comment-bottom');
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
            const data = event.target.getAttribute('data-comment');

            // Mark the clicked comment as active
            document.querySelectorAll('.comment-link').forEach(link => link.classList.remove('active-comment'));
            event.target.classList.add('active-comment');

            // Get the active chapter from the DOM
            const activeChapterElement = document.querySelector('.chapter-link.active-chapter');
            const chapter = activeChapterElement ? activeChapterElement.getAttribute('data-chapter') : 'intro'; // Fallback to default chapter if no active chapter found

            fetchAndDisplayFunction(`./get-comment/${data}/${chapter}`, displaySelector);
        });
    });
}

function setupChapterClickListener(selector, fetchAndDisplayFunction) {
    document.querySelectorAll(selector).forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const data = event.target.getAttribute('data-chapter');
            
            // Mark the clicked chapter as active
            document.querySelectorAll('.chapter-link').forEach(link => link.classList.remove('active-chapter'));
            event.target.classList.add('active-chapter');
            
            fetchAndDisplayFunction(data);
        });
    });
}

function removeHighlightFromHoverItems() {
    document.querySelectorAll('.hover-item').forEach(item => {
        item.classList.remove('highlight');
    });
}

function hasSingularTextClass(target) {
    return target.classList.contains('divisione') && target.classList.contains('singularText');
}

function highlightHoveredItem() {
    const hoverItems = Array.from(document.querySelectorAll('.hover-item'));
    const scrollItems = Array.from(document.querySelectorAll('.scroll-item'));
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

            upperElements.forEach(el => {
                const currentId = parseInt(el.getAttribute('data-related-id'), 10);
                if (currentId == dataId) {
                    upperCorrespondingElement = el;
                    upperStartId = currentId;
                    upperEndId = parseInt(el.getAttribute('data-end-id'), 10);
                }
            });

            bottomElements.forEach(el => {
                const currentId = parseInt(el.getAttribute('data-related-id'), 10);
                if (currentId == dataId) {
                    bottomCorrespondingElement = el;
                    bottomStartId = currentId;
                    bottomEndId = parseInt(el.getAttribute('data-end-id'), 10);
                }
            });

            [...upperElements, ...bottomElements].forEach(el => el.classList.remove('highlight-comment'));

            if (upperCorrespondingElement) {
                commentsContainer.scrollTop = upperCorrespondingElement.offsetTop - commentsContainer.offsetTop;
                upperCorrespondingElement.classList.add('highlight-comment');
            }

            if (bottomCorrespondingElement) {
                bottomCommentsContainer.scrollTop = bottomCorrespondingElement.offsetTop - bottomCommentsContainer.offsetTop;
                bottomCorrespondingElement.classList.add('highlight-comment');
            }

            document.querySelectorAll('.hover-item').forEach(hoverItem => {
                const hoverItemId = hoverItem.getAttribute('data-id');
                if ((hoverItemId >= upperStartId && hoverItemId <= upperEndId) ||
                    (hoverItemId >= bottomStartId && hoverItemId <= bottomEndId) ||
                    (hoverItemId == dataId)) {
                    hoverItem.classList.add('highlight-text');
                } else {
                    hoverItem.classList.remove('highlight-text');
                }
            });
        }
    });
}
