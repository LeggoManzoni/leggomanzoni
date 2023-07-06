document.addEventListener('DOMContentLoaded', function () {
    // Constants and variables

    const defaultComment = 'Luca Badini Confalonieri';
    const defaultChapter = 'intro';
    let secondDefaultComment;

    // Fetch and display the default comment
    fetch(`/get-comment/${defaultComment}`)
        .then(response => response.text())
        .then(data => {
            const commentTopElement = document.querySelector('.text-comment-top');
            if (commentTopElement) {
                commentTopElement.innerHTML = data;
                commentTopElement.setAttribute('data-active-comment', defaultComment);
            }
        })
        .catch(console.error);

    // Fetch and display the default chapter
    fetch(`/get-chapter/${defaultChapter}`)
        .then(response => response.text())
        .then(data => {
            const chapterElement = document.querySelector('.text-chapter');
            if (chapterElement) {
                chapterElement.innerHTML = data;
            }
        })
        .catch(console.error);

    // Mutation Observer setup
    const targetNode = document.querySelector('.divisione');
    if (targetNode) {
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    secondDefaultComment = hasSingularTextClass(mutation.target) ? '' : 'Angelini';

                    fetch(`/get-comment/${secondDefaultComment}`)
                        .then(response => response.text())
                        .then(data => {
                            const commentBottomElement = document.querySelector('.text-comment-bottom');
                            if (commentBottomElement) {
                                commentBottomElement.innerHTML = data;
                                commentBottomElement.setAttribute('data-active-comment', secondDefaultComment);
                            }
                        })
                        .catch(console.error);
                }
            }
        });
        observer.observe(targetNode, { attributes: true, attributeFilter: ['class'] });
    }

    // Event listeners for chapter links
    document.querySelectorAll('.chapter-link').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const chapter = event.target.getAttribute('data-chapter');
            fetch(`/get-chapter/${chapter}`)
                .then(response => response.text())
                .then(data => {
                    const chapterElement = document.querySelector('.text-chapter');
                    if (chapterElement) {
                        chapterElement.innerHTML = data;
                    }
                })
                .catch(console.error);
        });
    });

    // Event listeners for comment links
    document.querySelectorAll('.comment-link').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const comment = event.target.getAttribute('data-comment');
            const secondDivActiveComment = document.querySelector('.text-comment-bottom').getAttribute('data-active-comment');
            if (secondDivActiveComment === comment) {
                alert('Il commento selezionato è già attivo nel secondo specchietto dedicato al commento. Scegline un altro per fare un confronto.');
                return;
            }
            fetch(`/get-comment/${comment}`)
                .then(response => response.text())
                .then(data => {
                    const commentTopElement = document.querySelector('.text-comment-top');
                    if (commentTopElement) {
                        commentTopElement.innerHTML = data;
                        commentTopElement.setAttribute('data-active-comment', comment);
                    }
                })
                .catch(console.error);
        });
    });

    // Event listeners for comment links in second div
    document.querySelectorAll('.comment-link-2').forEach(link => {
        link.addEventListener('click', event => {
            event.preventDefault();
            const comment = event.target.getAttribute('data-comment');
            const firstDivActiveComment = document.querySelector('.text-comment-top').getAttribute('data-active-comment');
            if (firstDivActiveComment === comment) {
                alert('Il commento selezionato è già attivo nel primo specchietto dedicato al commento. Scegline un altro per fare un confronto.');
                return;
            }
            fetch(`/get-comment/${comment}`)
                .then(response => response.text())
                .then(data => {
                    const commentBottomElement = document.querySelector('.text-comment-bottom');
                    if (commentBottomElement) {
                        commentBottomElement.innerHTML = data;
                        commentBottomElement.setAttribute('data-active-comment', comment);
                    }
                })
                .catch(console.error);
        });
    });

    setupHoverScrolling();

});


// Utility function to check if the target element has the specified classes
function hasSingularTextClass(target) {
    return target.classList.contains('divisione') && target.classList.contains('singularText');
}

function setupHoverScrolling() {
    var highlightedElements = []; // Store the previously highlighted element
    document.addEventListener('mouseover', function (event) {
        // Check if the clicked element has the class "hover-item"
        if (event.target.classList.contains('hover-item')) {
            // Get the data-id of the clicked element
            var dataId = event.target.getAttribute('data-id');

            // Find the corresponding element in the right column by data-related-id
            var elements = document.querySelectorAll('.scroll-item');
            // var correspondingElement = document.querySelector('.scroll-item[data-related-id="' + dataId + '"]');
            for (var i = 0; i < elements.length; i++) {
                var currentId = parseInt(elements[i].getAttribute('data-related-id'), 10);
                if (currentId >= dataId) {
                    correspondingElement = elements[i];
                    break;
                }
            }
            

            // Scroll the corresponding element into view in the right column
            if (correspondingElement) {
                for (var j = 0; j < highlightedElements.length; j++) {
                    highlightedElements[j].classList.remove('highlight');
                }
                highlightedElements = [];

                var relatedId = parseInt(correspondingElement.getAttribute('data-related-id'), 10);
                var endId = parseInt(correspondingElement.getAttribute('data-end-id'), 10);

                var hoverItems = document.querySelectorAll('.hover-item');
                for (var i = 0; i < hoverItems.length; i++) {
                    var currentId = parseInt(hoverItems[i].getAttribute('data-id'), 10);
                    if (currentId >= relatedId && currentId <= endId) {
                        highlightedElements.push(hoverItems[i]);
                }
            }

            for (var k = 0; k < highlightedElements.length; k++) {
                highlightedElements[k].classList.add('highlight');
            }
                
                setTimeout(() => {
                    correspondingElement.scrollIntoView({ behavior: 'smooth' , block: 'start', inline: 'nearest'});
                }, 100); // 100 ms delay
            }

        }
    });
}

