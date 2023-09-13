document.addEventListener('DOMContentLoaded', function () {
    // Constants and variables
    const defaultComment = 'Badini Confalonieri, Luca';
    const defaultChapter = 'intro';

    // Fetch and display the default comment and chapter
    fetchAndDisplayData(`./get-comment/${defaultComment}`, '.text-comment-top', 'data-active-comment');
    fetchChapter(defaultChapter);

    // Setup MutationObserver
    setupMutationObserver('.divisione');

    // Setup click event listeners for links
    setupChapterClickListener('.chapter-link', fetchChapter, '.text-chapter');
    setupLinkClickListener('.comment-link', fetchAndDisplayData, '.text-comment-top');
    setupLinkClickListener('.comment-link-2', fetchAndDisplayData, '.text-comment-bottom');

    setupHoverScrolling();

});


function fetchChapter(defaultChapter) {
    const imageElement = document.querySelector('.bi.bi-card-image');
    let chapterURL = imageElement ? `./get-chapter/${defaultChapter}` : `./get-chapter-with-images/${defaultChapter}`;

    // Proceed with the fetch operation
    fetch(chapterURL)
        .then(response => response.text())
        .then(data => {
            const chapterElement = document.querySelector('.text-chapter');
            if (chapterElement) {
                chapterElement.innerHTML = data;
                highlightHoveredItem();  // Call the highlight function here
            }
        })
        .catch(console.error);
}


function changeClassAndFetchData(defaultChapter) {
    // Change the class to 'bi bi-image-fill'
    const chapter = document.querySelector(".chapter-link").getAttribute("data-chapter");
    const imageIcon = document.getElementById("imageIcon");
    const popupImage = document.getElementById("popupImage");

    if (imageIcon.className === "bi bi-card-image") {
        
        // Change the class to 'bi bi-image-fill'
        imageIcon.className = "bi bi-image-fill";
         // Change the popup
         popupImage.textContent = "Visualizza il testo senza le immagini.";
    } else {
        // Change the class to 'bi bi-card-image'
        imageIcon.className = "bi bi-card-image";
        // Change the popup
        popupImage.textContent = "Visualizza il testo con le immagini.";
    }
    fetchChapter(chapter);
}


function fetchAndDisplayData(endpoint, selector, attribute) {
    fetch(endpoint)
        .then(response => response.text())
        .then(data => {
            const element = document.querySelector(selector);
            if (element) {
                element.innerHTML = data;
                element.setAttribute(attribute, data);
                highlightHoveredItem();  // Call the highlight function here
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
                    const comment = hasSingularTextClass(mutation.target) ? '' : 'Angelini, Cesare';
                    fetchAndDisplayData(`./get-comment/${comment}`, '.text-comment-bottom', 'data-active-comment');
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
            fetchAndDisplayFunction(`./get-comment/${data}`, displaySelector, 'data-active-comment');
        });
    });
}


function setupChapterClickListener(selector, fetchAndDisplayFunction, displaySelector) {
    document.querySelectorAll(selector).forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const data = event.target.getAttribute('data-chapter');
            fetchAndDisplayFunction(data, displaySelector, 'text-chapter');
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

        // If a corresponding scroll-item exists, add the highlight class
        if (correspondingScrollItem) {
            hoverItem.classList.add('highlight');  // Use add instead of toggle
        }
    });
}

function highlightHoveredItemWithPencil() {
    const hoverItems = Array.from(document.querySelectorAll('.hover-item'));
    const scrollItems = Array.from(document.querySelectorAll('.scroll-item'));
    hoverItems.forEach(hoverItem => {
        const hoverItemId = hoverItem.getAttribute('data-id');
        const correspondingScrollItem = scrollItems.find(scrollItem => scrollItem.getAttribute('data-related-id') === hoverItemId);

        // If a corresponding scroll-item exists, add the highlight class
        if (correspondingScrollItem) {
            hoverItem.classList.toggle('highlight');  // Use toggle
        }
    });
    var i = document.getElementById("highlightHoveredItem");
    var captionFont = document.getElementById("popupUnderline");

    if (i.classList.contains("bi-pencil-fill")) {
        // Show the bottom div
        i.classList.add("bi-pencil");
        i.classList.remove("bi-pencil-fill");
        captionFont.textContent = "Clicca qui per visualizzare le note di commento.";

    } else {
        // Hide the bottom div
        i.classList.add("bi-pencil-fill");
        i.classList.remove("bi-pencil");
        captionFont.textContent = "Clicca qui per eliminare le note di commento.";

    }
}


function setupHoverScrolling() {
    const commentsContainer = document.getElementById("upperDiv");
    document.addEventListener('click', function (event) {
        // Check if the clicked element has the class "hover-item"
        if (event.target.classList.contains('hover-item')) {
            // Get the data-id of the clicked element
            const dataId = event.target.getAttribute('data-id');

            // Find the corresponding element in the right column by data-related-id
            let correspondingElement;
            let startId, endId;
            const elements = Array.from(document.querySelectorAll('.scroll-item'));
            for (let i = 0; i < elements.length; i++) {
                const currentId = parseInt(elements[i].getAttribute('data-related-id'), 10);
                if (currentId >= dataId) {
                    correspondingElement = elements[i];
                    startId = parseInt(elements[i].getAttribute('data-related-id'), 10);
                    endId = parseInt(elements[i].getAttribute('data-end-id'), 10);
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
                    elements[i].classList.remove('highlight-text', 'highlight-comment');
                }
                correspondingElement.classList.add('highlight-text', 'highlight-comment');

                // Highlight the elements with class hover-item and data-id between startId and endId
                const hoverItems = Array.from(document.querySelectorAll('.hover-item'));
                for (let i = 0; i < hoverItems.length; i++) {
                    const hoverItemId = hoverItems[i].getAttribute('data-id');
                    if (hoverItemId >= startId && hoverItemId <= endId) {
                        hoverItems[i].classList.add('highlight-text'); // Add the underline class
                    } else if (hoverItemId == startId) {
                        hoverItems[i].classList.add('highlight-text'); // Add the underline class
                    } else {
                        hoverItems[i].classList.remove('highlight-text'); // Remove the underline class if not in the range
                    }
                }
            }
        }
    });
}
