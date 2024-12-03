document.addEventListener('DOMContentLoaded', function () {
    const defaultComment = 'Badini Confalonieri, Luca';
    const defaultComment2 = 'Angelini, Cesare';
    const defaultChapter = 'intro';

    // Set initial button texts
    document.getElementById('toggle-capitoli').innerText = getDisplayChapterName(defaultChapter);
    document.getElementById('toggle-commenti1').innerText = defaultComment;
    document.getElementById('toggle-commenti2').innerText = defaultComment2;

    markActiveSelections(defaultChapter, defaultComment, defaultComment2);

    var icon = document.getElementById("splitButton");
    var text = document.getElementById("popup");

    icon.classList.remove("bi-dash-circle");
    icon.classList.add("bi-plus-circle");
    text.textContent = "Clicca qui per visualizzare due commenti.";

    fetchChapter(defaultChapter);
    fetchAndDisplayData(`./get-comment/${defaultComment}/${defaultChapter}`, '.text-comment-top');
    fetchAndDisplayData(`./get-comment/${defaultComment2}/${defaultChapter}`, '.text-comment-bottom');


    setupMutationObserver('.divisione');
    // Setup listeners and other functions
    setupChapterClickListener('.chapter-link', fetchChapter);
    setupLinkClickListener('.comment-link', fetchAndDisplayData, '.text-comment-top');
    setupLinkClickListener('.comment-link-2', fetchAndDisplayData, '.text-comment-bottom');

    setupHoverScrolling();
    highlightHoveredItem();
});

function isCommentBlockActive(blockId) {
    const blockElement = document.getElementById(blockId);
    return blockElement && !blockElement.classList.contains('hide');
  }
  

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

    const commentLinks2 = document.querySelectorAll('.comment-link-2');
    commentLinks2.forEach(link => {
        if (link.getAttribute('data-comment') === comment2) {
            link.classList.add('active-comment');
        } else {
            link.classList.remove('active-comment');
        }
    });
}


// Function to mark active selections based on the selector
function markActiveComment(selector, comment) {
    if (selector === '.text-comment-top') {
        document.getElementById('toggle-commenti1').innerText = comment;
    } else if (selector === '.text-comment-bottom') {
        document.getElementById('toggle-commenti2').innerText = comment;
    }

    // Update active class
    const commentLinks = document.querySelectorAll(selector === '.text-comment-top' ? '.comment-link' : '.comment-link-2');
    commentLinks.forEach(link => {
        if (link.getAttribute('data-comment') === comment) {
            link.classList.add('active-comment');
        } else {
            link.classList.remove('active-comment');
        }
    });
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

async function fetchAndDisplayData(endpoint, selector) {
    try {
        const response = await fetch(endpoint);
        const element = document.querySelector(selector);

        if (response.status === 204) {
            // Comment not found
            if (element) {
                element.innerHTML = `
                    <p class="not-found-message">
                        Il commento selezionato per questo capitolo non è ancora disponibile. Vuoi leggere il commento di 
                        <a href="#" id="bricchi-link">Mariarosa Bricchi</a> o 
                        <a href="#" id="russo-link">Luigi Russo</a>?
                    </p>
                `;
                const activeChapterElement = document.querySelector('.chapter-link.active-chapter');
                const chapter = activeChapterElement ? activeChapterElement.getAttribute('data-chapter') : 'intro';

                // Bricchi comment link
                document.getElementById('bricchi-link').addEventListener('click', async function(event) {
                    event.preventDefault();
                    const newEndpoint = `./get-comment/Bricchi, Mariarosa/${chapter}`;
                    await fetchAndDisplayData(newEndpoint, selector); // Load Bricchi comment
                    markActiveComment(selector, 'Bricchi, Mariarosa');
                });

                // Russo comment link
                document.getElementById('russo-link').addEventListener('click', async function(event) {
                    event.preventDefault();
                    const newEndpoint = `./get-comment/Russo, Luigi/${chapter}`;
                    await fetchAndDisplayData(newEndpoint, selector); // Load Russo comment
                    markActiveComment(selector, 'Russo, Luigi');
                });
            }
        } else if (response.ok) {
            const data = await response.text();
            if (element) {
                element.innerHTML = data;
                // Update highlights after loading new content
                highlightHoveredItem();
                // Scroll the container to the top
                if (selector === '.text-comment-top') {
                    const containerElement = document.getElementById('upperDiv');
                    if (containerElement) {
                        containerElement.scrollTop = 0;
                    }
                } else if (selector === '.text-comment-bottom') {
                    const containerElement = document.getElementById('bottomDiv');
                    if (containerElement) {
                        containerElement.scrollTop = 0;
                    }
                }
            }
        } else {
            // Handle other HTTP errors
            console.error('Error fetching data:', response.statusText);
            if (element) {
                element.innerHTML = '<p class="error-message">Si è verificato un errore durante il caricamento del commento.</p>';
            }
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        const element = document.querySelector(selector);
        if (element) {
            element.innerHTML = '<p class="error-message">Si è verificato un errore durante il caricamento del commento.</p>';
        }
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
      icon.classList.remove("bi-plus-circle");
      icon.classList.add("bi-dash-circle");
      text.textContent = "Clicca qui per visualizzare un solo commento.";
      buttonComments.classList.remove("hide");
    } else {
      // Hide the bottom div
      bottomDiv.classList.add("hide");
      upperDiv.classList.add("singularText");
      icon.classList.remove("bi-dash-circle");
      icon.classList.add("bi-plus-circle");
      text.textContent = "Clicca qui per visualizzare due commenti.";
      buttonComments.classList.add("hide");
    }
  
    // Update the highlighting based on the visibility of the second comment
    highlightHoveredItem();
  };
  


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

            // Update active class
            document.querySelectorAll(selector).forEach(link => link.classList.remove('active-comment'));
            event.target.classList.add('active-comment');

            // Update the corresponding Commento button's text
            if (displaySelector === '.text-comment-top') {
                document.getElementById('toggle-commenti1').innerText = data;
            } else if (displaySelector === '.text-comment-bottom') {
                document.getElementById('toggle-commenti2').innerText = data;
            }

            // Get the active chapter
            const activeChapterElement = document.querySelector('.chapter-link.active-chapter');
            const chapter = activeChapterElement ? activeChapterElement.getAttribute('data-chapter') : 'intro';

            fetchAndDisplayFunction(`./get-comment/${data}/${chapter}`, displaySelector);
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
    document.querySelectorAll('.hover-item').forEach(item => {
        item.classList.remove('highlight');
    });
}

function hasSingularTextClass(target) {
    return target.classList.contains('divisione') && target.classList.contains('singularText');
}

function highlightHoveredItem() {
    const hoverItems = Array.from(document.querySelectorAll('.hover-item'));
    let scrollItems = [];
  
    const upperDiv = document.getElementById("upperDiv");
    const bottomDiv = document.getElementById("bottomDiv");
  
    const isTopCommentActive = isCommentBlockActive('upperDiv');
    const isBottomCommentActive = isCommentBlockActive('bottomDiv');
  
    // Collect scroll-items from active comments
    if (isTopCommentActive) {
      const upperScrollItems = Array.from(upperDiv.querySelectorAll('.scroll-item'));
      scrollItems = scrollItems.concat(upperScrollItems);
    }
  
    if (isBottomCommentActive) {
      const bottomScrollItems = Array.from(bottomDiv.querySelectorAll('.scroll-item'));
      scrollItems = scrollItems.concat(bottomScrollItems);
    }
  
    // Remove existing highlights
    hoverItems.forEach(item => item.classList.remove('highlight'));
  
    // Add highlights based on active comments
    hoverItems.forEach(hoverItem => {
      const hoverItemId = hoverItem.getAttribute('data-id');
      const correspondingScrollItem = scrollItems.find(scrollItem => scrollItem.getAttribute('data-related-id') === hoverItemId);
  
      if (correspondingScrollItem) {
        hoverItem.classList.add('highlight');
      }
    });
  }
  


  function highlightHoveredItemWithPencil() {
    const hoverItems = Array.from(document.querySelectorAll('.hover-item'));
    let scrollItems = [];
  
    const upperDiv = document.getElementById("upperDiv");
    const bottomDiv = document.getElementById("bottomDiv");
  
    const isTopCommentActive = isCommentBlockActive('upperDiv');
    const isBottomCommentActive = isCommentBlockActive('bottomDiv');
  
    if (isTopCommentActive) {
      const upperScrollItems = Array.from(upperDiv.querySelectorAll('.scroll-item'));
      scrollItems = scrollItems.concat(upperScrollItems);
    }
  
    if (isBottomCommentActive) {
      const bottomScrollItems = Array.from(bottomDiv.querySelectorAll('.scroll-item'));
      scrollItems = scrollItems.concat(bottomScrollItems);
    }
  
    hoverItems.forEach(hoverItem => {
      const hoverItemId = hoverItem.getAttribute('data-id');
      const correspondingScrollItem = scrollItems.find(scrollItem => scrollItem.getAttribute('data-related-id') === hoverItemId);
  
      if (correspondingScrollItem) {
        hoverItem.classList.toggle('highlight');  // Toggle highlight
      }
    });
  
    // Change style of the pencil icon and update the tooltip
    const pencilIcon = document.getElementById("highlightHoveredItem");
    const captionFont = document.getElementById("popupUnderline");
  
    if (pencilIcon.classList.contains("bi-pencil-fill")) {
      pencilIcon.classList.add("bi-pencil");
      pencilIcon.classList.remove("bi-pencil-fill");
      captionFont.textContent = "Clicca qui per visualizzare le note di commento.";
    } else {
      pencilIcon.classList.add("bi-pencil-fill");
      pencilIcon.classList.remove("bi-pencil");
      captionFont.textContent = "Clicca qui per eliminare le note di commento.";
    }
  }
  


  function setupHoverScrolling() {
    const upperDiv = document.getElementById("upperDiv");
    const bottomDiv = document.getElementById("bottomDiv");
  
    document.addEventListener('click', function (event) {
      if (event.target.classList.contains('hover-item')) {
        const dataId = event.target.getAttribute('data-id');
  
        let upperCorrespondingElement, bottomCorrespondingElement;
        let upperStartId, upperEndId, bottomStartId, bottomEndId;
  
        const isTopCommentActive = isCommentBlockActive('upperDiv');
        const isBottomCommentActive = isCommentBlockActive('bottomDiv');
  
        // Arrays to store elements
        const upperElements = isTopCommentActive ? Array.from(upperDiv.querySelectorAll('.scroll-item')) : [];
        const bottomElements = isBottomCommentActive ? Array.from(bottomDiv.querySelectorAll('.scroll-item')) : [];
  
        // Find corresponding elements in active comments
        upperElements.forEach(el => {
          const currentId = el.getAttribute('data-related-id');
          if (currentId == dataId) {
            upperCorrespondingElement = el;
            upperStartId = currentId;
            upperEndId = el.getAttribute('data-end-id');
          }
        });
  
        bottomElements.forEach(el => {
          const currentId = el.getAttribute('data-related-id');
          if (currentId == dataId) {
            bottomCorrespondingElement = el;
            bottomStartId = currentId;
            bottomEndId = el.getAttribute('data-end-id');
          }
        });
  
        // Remove previous highlights
        upperElements.forEach(el => el.classList.remove('highlight-comment'));
        bottomElements.forEach(el => el.classList.remove('highlight-comment'));
  
        // Scroll to the corresponding comment(s)
        if (upperCorrespondingElement) {
          upperDiv.scrollTop = upperCorrespondingElement.offsetTop - upperDiv.offsetTop;
          upperCorrespondingElement.classList.add('highlight-comment');
        }
  
        if (bottomCorrespondingElement) {
          bottomDiv.scrollTop = bottomCorrespondingElement.offsetTop - bottomDiv.offsetTop;
          bottomCorrespondingElement.classList.add('highlight-comment');
        }
  
        // Highlight the text in the left column
        document.querySelectorAll('.hover-item').forEach(hoverItem => {
          const hoverItemId = hoverItem.getAttribute('data-id');
          let shouldHighlight = false;
  
          if (upperStartId !== undefined && hoverItemId >= upperStartId && hoverItemId <= upperEndId) {
            shouldHighlight = true;
          }
  
          if (bottomStartId !== undefined && hoverItemId >= bottomStartId && hoverItemId <= bottomEndId) {
            shouldHighlight = true;
          }
  
          if (shouldHighlight || hoverItemId == dataId) {
            hoverItem.classList.add('highlight-text');
          } else {
            hoverItem.classList.remove('highlight-text');
          }
        });
      }
    });
  }
  