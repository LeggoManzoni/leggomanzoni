document.addEventListener('DOMContentLoaded', function () {
    // Constants and variables
    const defaultComment = 'English_2022';
    
    const defaultChapter = 'intro';

    // Fetch and display the default comment and chapter
    fetchAndDisplayData(`./get-translation/${defaultComment}`, '.text-comment-top', 'data-active-comment');
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
                const test_chapter = document.querySelector('.text-chapter#whichpage');
                const h1Element = test_chapter.querySelector('h1');
                h1Element.className = defaultChapter;
                const promessisposiElement = document.getElementById('promessisposi');
                if (promessisposiElement) {
                    promessisposiElement.scrollTop = 0;
                }

                highlightHoveredItem();  // Call the highlight function here
                
            }
        })
        .catch(console.error);
}


function changeClassAndFetchData(defaultChapter) {
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
    fetchChapter(chapter);
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
                    const comment = hasSingularTextClass(mutation.target) ? '' : 'English_1845';
                    fetchAndDisplayData(`./get-translation/${comment}`, '.text-comment-bottom', 'data-active-comment');
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
            fetchAndDisplayFunction(`./get-translation/${data}`, displaySelector, 'data-active-comment');
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
    //Change style to the pencil together with the popup
    var i = document.getElementById("highlightHoveredItem");
    var captionFont = document.getElementById("popupUnderline");

    if (i.classList.contains("bi-pencil-fill")) {
        
        i.classList.add("bi-pencil");
        i.classList.remove("bi-pencil-fill");
        captionFont.textContent = "Clicca qui per visualizzare le note di commento.";

    } else {
        
        i.classList.add("bi-pencil-fill");
        i.classList.remove("bi-pencil");
        captionFont.textContent = "Clicca qui per eliminare le note di commento.";

    }
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

            // Find the corresponding element in the upper block
            for (let i = 0; i < upperElements.length; i++) {
                const currentId = parseInt(upperElements[i].getAttribute('data-related-id'), 10);
                if (currentId == dataId) {
                    upperCorrespondingElement = upperElements[i];
                    upperStartId = currentId;
                    upperEndId = parseInt(upperElements[i].getAttribute('data-end-id'), 10);
                    break;
                }
            }

            // Find the corresponding element in the bottom block
            for (let i = 0; i < bottomElements.length; i++) {
                const currentId = parseInt(bottomElements[i].getAttribute('data-related-id'), 10);
                if (currentId == dataId) {
                    bottomCorrespondingElement = bottomElements[i];
                    bottomStartId = currentId;
                    bottomEndId = parseInt(bottomElements[i].getAttribute('data-end-id'), 10);
                    break;
                }
            }

            // Remove existing highlights
            const allElements = [...upperElements, ...bottomElements];
            for (let i = 0; i < allElements.length; i++) {
                allElements[i].classList.remove('highlight-comment');
            }

            // Scroll to the corresponding element in the upper block
            if (upperCorrespondingElement) {
                const upperElementTop = upperCorrespondingElement.offsetTop - commentsContainer.offsetTop;
                commentsContainer.scrollTop = upperElementTop;
                upperCorrespondingElement.classList.add('highlight-comment');
            }

            // Scroll to the corresponding element in the bottom block
            if (bottomCorrespondingElement) {
                const bottomElementBottom = bottomCorrespondingElement.offsetTop - bottomCommentsContainer.offsetTop;
                bottomCommentsContainer.scrollTop = bottomElementBottom;
                bottomCorrespondingElement.classList.add('highlight-comment');
            }

            

            // Highlight the text
            const hoverItems = Array.from(document.querySelectorAll('.hover-item'));
            for (let i = 0; i < hoverItems.length; i++) {
                const hoverItemId = hoverItems[i].getAttribute('data-id');
                if ((hoverItemId >= upperStartId && hoverItemId <= upperEndId) || 
                    (hoverItemId >= bottomStartId && hoverItemId <= bottomEndId) ||
                    (hoverItemId == dataId))  {
                    hoverItems[i].classList.add('highlight-text');
                } else {
                    hoverItems[i].classList.remove('highlight-text');
                }
            }
        }
    });
}