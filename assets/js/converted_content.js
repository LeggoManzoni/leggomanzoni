document.addEventListener('DOMContentLoaded', function () {
    // Set the default comment
    let firstDefaultComment = 'Badini_Confalonieri';

    // Fetch and display the first default comment
    fetch('/get-comment/' + firstDefaultComment)
        .then(response => response.text())
        .then(data => {
            const commentTopElement = document.querySelector('.text-comment-top');
            if (commentTopElement) {
                commentTopElement.innerHTML = data;
                commentTopElement.setAttribute('data-active-comment', firstDefaultComment);
                console.log('Active comment in the first div:', firstDefaultComment);
            }
        })
        .catch(error => console.error(error));

    var defaultChapter = "intro";

    // Fetch and display the default chapter
    fetch('/get-chapter/' + defaultChapter)
        .then(response => response.text())
        .then(data => {
            const chapterElement = document.querySelector('.text-chapter');
            if (chapterElement) {
                chapterElement.innerHTML = data;
            }
        })
        .catch(error => console.error(error));

    // Function to check if the target element has the class 'bi-dash-circle'
    function hasDashCircleClass(target) {
        return target.classList.contains('bi') && target.classList.contains('bi-dash-circle');
    }

    // Variable to store the second default comment
    let secondDefaultComment = 'initialValue'; // Consider setting an initial value

    // Select the element you want to watch for changes
    var targetNode = document.querySelector('.bi');

    if (!targetNode) {
        console.error('Target node not found');
        return;
    }

    // Options for the observer (which mutations to observe)
    var config = { attributes: true, attributeFilter: ['class'] };

    // Callback function to execute when mutations are observed
    var callback = function (mutationsList, observer) {
        for (var mutation of mutationsList) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                if (hasDashCircleClass(mutation.target)) {
                    console.log('Element now has "bi-dash-circle" class.');
                    secondDefaultComment = '';
                } else {
                    console.log('Element no longer has "bi-dash-circle" class.');
                    secondDefaultComment = 'Angelini';
                }

                // Fetch and display the default comment
                fetch('/get-comment/' + secondDefaultComment)
                    .then(response => response.text())
                    .then(data => {
                        const commentBottomElement = document.querySelector('.text-comment-bottom');
                        if (commentBottomElement) {
                            commentBottomElement.innerHTML = data;
                            commentBottomElement.setAttribute('data-active-comment', secondDefaultComment);
                            console.log('Active comment in the second div:', secondDefaultComment);
                        }
                    })
                    .catch(error => console.error('Fetch Error:', error));
            }
        }
    };

    // Create an observer instance linked to the callback function
    var observer = new MutationObserver(callback);

    // Start observing the target node for configured mutations
    observer.observe(targetNode, config);
});



document.querySelectorAll('.chapter-link').forEach(function (link) {
    link.addEventListener('click', function (event) {
        event.preventDefault(); // prevent the browser from following the link
        const chapter = event.target.getAttribute('data-chapter');

        fetch('/get-chapter/' + chapter)
            .then(response => response.text())
            .then(data => {
                document.querySelector('.text-chapter').innerHTML = data;
            })
            .catch(error => console.error(error));
    });
});


document.querySelectorAll('.comment-link').forEach(function (link) {
    link.addEventListener('click', function (event) {
        event.preventDefault(); // prevent the browser from following the link
        const comment = event.target.getAttribute('data-comment');

        // Check if the same comment is already active in the second div
        const secondDivActiveComment = document.querySelector('.text-comment-bottom').getAttribute('data-active-comment');
        if (secondDivActiveComment === comment) {
            window.alert('Il commento selezionato è già attivo nel secondo specchietto dedicato al commento. Scegline un altro per fare un confronto.');
            return;
        }

        fetch('/get-comment/' + comment)
            .then(response => response.text())
            .then(data => {
                document.querySelector('.text-comment-top').innerHTML = data;
                document.querySelector('.text-comment-top').setAttribute('data-active-comment', comment);
                console.log('Active comment in the first div:', comment);
            })
            .catch(error => console.error(error));
    });
});


document.querySelectorAll('.comment-link-2').forEach(function (link) {
    link.addEventListener('click', function (event) {
        event.preventDefault();
        const comment = event.target.getAttribute('data-comment');
        const firstDivActiveComment = document.querySelector('.text-comment-top').getAttribute('data-active-comment');
        if (firstDivActiveComment === comment) {
            window.alert('Il commento selezionato è già attivo nel primo specchietto dedicato al commento. Scegline un altro per fare un confronto.');
            return;
        }

        fetch('/get-comment/' + comment)
            .then(response => response.text())
            .then(data => {
                document.querySelector('.text-comment-bottom').innerHTML = data;
                document.querySelector('.text-comment-bottom').setAttribute('data-active-comment', comment);
                console.log('Active comment in the second div:', comment);
            })
            .catch(error => console.error(error));
    });
});