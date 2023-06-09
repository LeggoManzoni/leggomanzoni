document.addEventListener('DOMContentLoaded', function () {
    // Constants and variables
    const defaultComment = 'Badini Confalonieri, Luca';
    const defaultChapter = 'intro';

    // Fetch and display the default comment and chapter
    fetchAndDisplayData(`/get-comment/${defaultComment}`, '.text-comment-top', 'data-active-comment');
    fetchChapter(`/get-chapter/${defaultChapter}`, '.text-chapter');

    // Setup MutationObserver
    setupMutationObserver('.divisione');

    // Setup click event listeners for links
    setupChapterClickListener('.chapter-link', fetchChapter, '.text-chapter');
    setupLinkClickListener('.comment-link', fetchAndDisplayData, '.text-comment-top');
    setupLinkClickListener('.comment-link-2', fetchAndDisplayData, '.text-comment-bottom');

    setupHoverScrolling();
});


function fetchChapter(chapter) {
    fetch(chapter)
        .then(response => response.text())
        .then(data => {
            const chapterElement = document.querySelector('.text-chapter');
            console.log(chapter);
            if (chapterElement) {
                console.log(chapterElement);
                chapterElement.innerHTML = data;
            }
        })
        .catch(console.error);
}

function fetchAndDisplayData(endpoint, selector, attribute) {
    fetch(endpoint)
        .then(response => response.text())
        .then(data => {
            const element = document.querySelector(selector);
            console.log(endpoint);
            console.log(selector);
            console.log(attribute);
            if (element) {
                element.innerHTML = data;
                element.setAttribute(attribute, data);
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
                    const comment = hasSingularTextClass(mutation.target) ? '' : 'Angelini';
                    fetchAndDisplayData(`/get-comment/${comment}`, '.text-comment-bottom', 'data-active-comment');
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
            fetchAndDisplayFunction(`/get-comment/${data}`, displaySelector, 'data-active-comment');
        });
    });
}


function setupChapterClickListener(selector, fetchAndDisplayFunction, displaySelector) {
    document.querySelectorAll(selector).forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const data = event.target.getAttribute('data-chapter');
            fetchAndDisplayFunction(`/get-chapter/${data}`, displaySelector, 'text-chapter');
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
    const scrollItems = Array.from(document.querySelectorAll('.scroll-item'));
    hoverItems.forEach(hoverItem => {
        const hoverItemId = hoverItem.getAttribute('data-id');
        const correspondingScrollItem = scrollItems.find(scrollItem => scrollItem.getAttribute('data-related-id') === hoverItemId);

        // If a corresponding scroll-item exists, toggle the highlight class
        if (correspondingScrollItem) {
            hoverItem.classList.toggle('highlight');
        }
    });
}

function setupHoverScrolling() {
    const commentsContainer = document.getElementById('upperDiv');
    document.addEventListener('click', function (event) {
        // Check if the clicked element has the class "hover-item"
        if (event.target.classList.contains('hover-item')) {
            // Get the data-id of the clicked element
            const dataId = event.target.getAttribute('data-id');

            // Find the corresponding element in the right column by data-related-id
            let correspondingElement;
            const elements = Array.from(document.querySelectorAll('.scroll-item'));
            for (let i = 0; i < elements.length; i++) {
                const currentId = parseInt(elements[i].getAttribute('data-related-id'), 10);
                if (currentId >= dataId) {
                    correspondingElement = elements[i];
                    break;
                }
            }

            // Scroll the corresponding element into view in the right column
            if (correspondingElement) {
                // Calculate the top position of the corresponding element relative to the comments container
                const correspondingElementTop = correspondingElement.offsetTop - commentsContainer.offsetTop;

                // Scroll the corresponding element into view in the right column
                commentsContainer.scrollTop = correspondingElementTop;
                for (let i = 0; i < elements.length; i++) {
                    elements[i].classList.remove('highlight-comment');
                }
                correspondingElement.classList.add('highlight-comment');
            }
        }
    });
}
