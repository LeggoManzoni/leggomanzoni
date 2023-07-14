/*!
* Start Bootstrap - Creative v7.0.6 (https://startbootstrap.com/theme/creative)
* Copyright 2013-2022 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-creative/blob/master/LICENSE)
*/
//
// Scripts
// 

document.addEventListener('DOMContentLoaded', () => {

  // navbarShrink();
  collectId();
  popupButtons();
  modalFunction();

});

/*Function for navbar shrink*/
let navbarShrink = () => { // Navbar shrink function
  const navbarCollapsible = document.body.querySelector('#mainNav');
  if (!navbarCollapsible) {
    return;
  }
  if (window.scrollY === 0) {
    navbarCollapsible.classList.remove('navbar-shrink')
  } else {
    navbarCollapsible.classList.add('navbar-shrink')
  }

  document.addEventListener('scroll', navbarShrink); // Shrink the navbar when page is scrolled

  const mainNav = document.body.querySelector('#mainNav'); // Activate Bootstrap scrollspy on the main nav element
  if (mainNav) {
    new bootstrap.ScrollSpy(document.body, {
      target: '#mainNav',
      offset: 74,
    });
  };

  const navbarToggler = document.body.querySelector('.navbar-toggler');  // Collapse responsive navbar when toggler is visible
  const responsiveNavItems = [].slice.call(
    document.querySelectorAll('#navbarResponsive .nav-link')
  );
  responsiveNavItems.map(function (responsiveNavItem) {
    responsiveNavItem.addEventListener('click', () => {
      if (window.getComputedStyle(navbarToggler).display !== 'none') {
        navbarToggler.click();
      }
    });
  });

  new SimpleLightbox({       // Activate SimpleLightbox plugin for portfolio items
    elements: '#portfolio a.portfolio-box'
  });
}

/* Function for collecting ids */
let collectId = () => {     // function for splitting the id content 

  fetch('/extract-ids')
    .then(response => response.json())
    .then(idArray => {
      console.log(idArray);  // Use the extracted IDs in client-side code
    })
    .catch(error => {
      console.error('Error fetching the IDs:', error);
    });
}

/*Function toggleColumn*/
let toggleColumn = () => {  // Function for modifying the right column and showing one or two comments at the same time
  var bottomDiv = document.getElementById("bottomDiv");
  var upperDiv = document.getElementById("upperDiv");
  var icon = document.getElementById("splitButton");
  var text = document.getElementById("popup");
  if (bottomDiv.classList.contains("hide")) {
    // Show the bottom div
    bottomDiv.classList.remove("hide");
    upperDiv.classList.remove("singularText");
    icon.classList.remove("bi-plus-circle");
    icon.classList.add("bi-dash-circle");
    text.textContent = "Clicca su questo bottone per visualizzare un solo commento.";
  } else {
    // Hide the bottom div
    bottomDiv.classList.add("hide");
    upperDiv.classList.add("singularText");
    icon.classList.remove("bi-dash-circle");
    icon.classList.add("bi-plus-circle");
    text.textContent = "Clicca su questo bottone per visualizzare due commenti.";
  };
};

/*Function enlargeRightColumn*/
let enlargeRightColumn = () => {     // Function for enlarging the right column and hiding the left one
  var columnToMantain = document.getElementById("colonnaD");
  var columnToDelete = document.getElementById("colonnaS");
  var i = document.getElementById("enlargerRight");
  var testo = document.getElementById("popupR");

  if (columnToDelete.classList.contains("hide")) {
    // Show the enlarged div
    columnToDelete.classList.remove("hide");
    columnToMantain.classList.remove("col-12");
    columnToMantain.classList.add("col-6");
    i.classList.add("bi-arrows-angle-expand");
    i.classList.remove("bi-arrows-angle-contract");
    testo.textContent = "Clicca su questo bottone per visualizzare il commento in modalità full-screen.";
  } else {
    // Hide the bottom div
    columnToDelete.classList.add("hide");
    columnToMantain.classList.remove("col-6");
    columnToMantain.classList.add("col-12");
    i.classList.add("bi-arrows-angle-contract");
    i.classList.remove("bi-arrows-angle-expand");
    testo.textContent = "Clicca su questo bottone per tornare alla visualizzazione su due colonne.";
  };
};

/*Function enlargeLeftColumn*/
let enlargeLeftColumn = () => {     // Function for enlarging the left column and hiding the right one
  var columnToMantain = document.getElementById("colonnaS");
  var columnToDelete = document.getElementById("colonnaD");
  var i = document.getElementById("enlargerLeft");
  var caption = document.getElementById("popupL");

  if (columnToDelete.classList.contains("hide")) {
    // Show the bottom div
    columnToDelete.classList.remove("hide");
    columnToMantain.classList.remove("col-12");
    columnToMantain.classList.add("col-6");
    i.classList.add("bi-arrows-angle-expand");
    i.classList.remove("bi-arrows-angle-contract");
    caption.textContent = "Clicca su questo bottone per visualizzare il commento in modalità full-screen.";
  } else {
    // Hide the bottom div
    columnToDelete.classList.add("hide");
    columnToMantain.classList.remove("col-6");
    columnToMantain.classList.add("col-12");
    i.classList.add("bi-arrows-angle-contract");
    i.classList.remove("bi-arrows-angle-expand");
    caption.textContent = "Clicca su questo bottone per tornare alla visualizzazione su due colonne.";
  };
};

/*Function changeFont*/
let changeFont = () => {     // Function for changing the font and switching to a more readable one
  var i = document.getElementById("fontButton");
  var styleFont = document.getElementById("normalFont");
  var captionFont = document.getElementById("popupFont");

  if (i.classList.contains("bi-file-earmark-font")) {
    // Show the bottom div
    styleFont.classList.remove("normalFont");
    styleFont.classList.add("accessibilityFont");
    i.classList.add("bi-file-earmark-font-fill");
    i.classList.remove("bi-file-earmark-font");
    captionFont.textContent = "Clicca su questo bottone per tornare al font principale.";

    // Change the font style of the body back to the main font
    document.body.style.fontFamily = "Tahoma";
    document.body.style.fontSize = "19px";
  } else {
    // Hide the bottom div
    styleFont.classList.add("normalFont");
    styleFont.classList.remove("accessibilityFont");
    i.classList.add("bi-file-earmark-font");
    i.classList.remove("bi-file-earmark-font-fill");
    captionFont.textContent = "Clicca su questo bottone per cambiare il font dei testi migliorandone la leggibilità.";

    document.body.style.fontFamily = "";
    document.body.style.fontSize = "16px";
  }
};

/*Function changePencil*/
let changePencil = () => {     // Function for changing the pencil icon for underlined content
  var i = document.getElementById("underline");
  var captionFont = document.getElementById("popupUnderline");

  if (i.classList.contains("bi-pencil-fill")) {
    // Show the bottom div
    i.classList.add("bi-pencil");
    i.classList.remove("bi-pencil-fill");
    captionFont.textContent = "Clicca su questo bottone per eliminare le note di commento.";

  } else {
    // Hide the bottom div
    i.classList.add("bi-pencil-fill");
    i.classList.remove("bi-pencil");
    captionFont.textContent = "Clicca su questo bottone per visualizzare le note di commento.";

  }
};

/*Function popupButtons*/
let popupButtons = () => {     //Functions for showing through a popup the meaning of the buttons in the reading area: 

  // 1) popup for splitting in two comments or one;
  var button = document.getElementById("splitButton");
  var popup = document.getElementById("popup");
  button.addEventListener("mouseover", function () {
    popup.style.display = "block";
  });
  button.addEventListener("mouseout", function () {
    popup.style.display = "none";
  });
  // 2) popup for enlarging the left column
  var testoButton = document.getElementById("enlargerLeft");
  var popupL = document.getElementById("popupL");
  testoButton.addEventListener("mouseover", function () {
    popupL.style.display = "block";
  });
  testoButton.addEventListener("mouseout", function () {
    popupL.style.display = "none";
  });
  // 3) popup for enlarging the right column 
  var b = document.getElementById("enlargerRight");
  var popupR = document.getElementById("popupR");
  b.addEventListener("mouseover", function () {
    popupR.style.display = "block";
  });
  b.addEventListener("mouseout", function () {
    popupR.style.display = "none";
  });
  // 4) popup for blocking authomatic redirection for comment 1
  var toggleB = document.getElementById("scrollAuto");
  var popupScroll = document.getElementById("popupScroll");
  toggleB.addEventListener("mouseover", function () {
    popupScroll.style.display = "block";
  });
  toggleB.addEventListener("mouseout", function () {
    popupScroll.style.display = "none";
  });
  // 5) popup for blocking authomatic redirection for comment 2
  var toggleSecond = document.getElementById("scrollAuto2");
  var popupScroll2 = document.getElementById("popupScroll2");
  toggleSecond.addEventListener("mouseover", function () {
    popupScroll2.style.display = "block";
  });
  toggleSecond.addEventListener("mouseout", function () {
    popupScroll2.style.display = "none";
  });

}

/*Function modalFunction*/
let modalFunction = () => {
  var currentPageUrl = window.location.href;

  // Update 'reader.ejs' with the specific page you want the modal to appear
  if (currentPageUrl.includes('reader')) {
    var modal = document.getElementById("myModal");
    var closeButton = document.getElementsByClassName("close")[0];

    modal.style.display = "block";

    closeButton.onclick = function () {
      modal.style.display = "none";
    }

    window.onclick = function (event) {
      if (event.target == modal) {
        modal.style.display = "none";
      };
    };
  };
}

/*Function arrowCommenti*/
let arrowCommenti = () => {
  // Function for switching the toggle into opened and closed in the Commenti page and to switch consequently the arrow icon up and down  
  var toggleBtns = document.querySelectorAll(".toggleBtn");

  toggleBtns.forEach(function (toggleBtn) {
    toggleBtn.addEventListener("click", function () {
      var dropdownContent = this.querySelector(".dropdownContent");
      var caretDown = this.querySelector(".bi-caret-down-fill");
      var caretUp = this.querySelector(".bi-caret-up-fill");

      var isHidden = dropdownContent.classList.contains("hidden");

      if (isHidden) {
        dropdownContent.style.display = "none";
        dropdownContent.classList.remove("hidden");
        caretUp.classList.remove("bi-caret-up-fill");
        caretUp.classList.add("bi-caret-down-fill");
      } else {
        dropdownContent.style.display = "block";
        dropdownContent.classList.add("hidden");
        caretDown.classList.remove("bi-caret-down-fill");
        caretDown.classList.add("bi-caret-up-fill");
      }
    });
  });
};

/*Function orderByTimeOrName*/
let orderByTimeOrName = () => {
  var toggleBtns = document.querySelectorAll(".toggleBtn");
  var dictionary = {};

  toggleBtns.forEach(function (toggleBtn) {
    var nameElement = toggleBtn.firstChild;
    var name = nameElement.textContent.trim();
    var yearElement = toggleBtn.querySelector(".dropdownContent .list-group-item:nth-child(6)");
    var year = parseInt(yearElement.textContent.trim().replace("Anno: ", ""));

    dictionary[name] = year;
  });

  var items = Object.entries(dictionary).map(function ([name, year]) {
    return { name: name, year: year };
  });

  var button = document.getElementById("chronologicalBtn");
  button.addEventListener("click", function () {
    items.sort(function (a, b) {
      return a.year - b.year;
    });

    var listGroup = document.querySelector(".list-group.comment-list-items");
    listGroup.innerHTML = "";

    items.forEach(function (item) {
      for (var i = 0; i < toggleBtns.length; i++) {
        var toggleBtn = toggleBtns[i];
        var nameElement = toggleBtn.firstChild;
        var name = nameElement.textContent.trim();

        if (name === item.name) {
          listGroup.appendChild(toggleBtn);
          break;
        }
      }
    });
  });

  var antichronologicalBtn = document.getElementById("antichronologicalBtn");
  antichronologicalBtn.addEventListener("click", function () {
    items.sort(function (a, b) {
      return b.year - a.year;
    });

    var listGroup = document.querySelector(".list-group.comment-list-items");
    listGroup.innerHTML = "";

    items.forEach(function (item) {
      for (var i = 0; i < toggleBtns.length; i++) {
        var toggleBtn = toggleBtns[i];
        var nameElement = toggleBtn.firstChild;
        var name = nameElement.textContent.trim();

        if (name === item.name) {
          listGroup.appendChild(toggleBtn);
          break;
        }
      }
    });
  });

  var alphabeticalBtn = document.getElementById("alphabeticalBtn");
  alphabeticalBtn.addEventListener("click", function () {
    var listGroup = document.querySelector(".list-group.comment-list-items");
    listGroup.innerHTML = "";

    toggleBtns.forEach(function (toggleBtn) {
      listGroup.appendChild(toggleBtn);
    });
  });
};

/*Function of all Comments*/
let comments = () => {
  arrowCommenti();
  orderByTimeOrName();
};

/* TRY */
/* function loadTextFile(url, callback) {
  var xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      callback(xhr.responseText);
    }
  };
  xhr.open('GET', url, true);
  xhr.send();
}

function createHighlighter(text1, text2) {
  var words = text1.getElementsByTagName('w');
  var note = text2.getElementsByTagName('note')[0];

  function handleMouseOver() {
    var wordId = this.getAttribute('xml:id');
    var refId = note.getAttribute('target');
    var refEndId = note.getAttribute('targetEnd');

    if (wordId && refId && refEndId) {
      var refStartWord = text1.getElementById(refId);
      var refEndWord = text1.getElementById(refEndId);

      if (refStartWord && refEndWord) {
        var isBetweenWords = isBetween(this, refStartWord, refEndWord);

        if (isBetweenWords) {
          note.classList.add('highlight');
        } else {
          note.classList.remove('highlight');
        }
      }
    }
  }

  function isBetween(element, start, end) {
    var current = element;
    while (current && current !== end) {
      if (current === start) {
        return true;
      }
      current = current.nextElementSibling;
    }
    return false;
  }

  for (var i = 0; i < words.length; i++) {
    words[i].addEventListener('mouseover', handleMouseOver);
  }
}

window.addEventListener('DOMContentLoaded', function () {
  var text1Div = document.getElementById('sinistra');
  var text2Div = document.getElementById('destra');

  loadTextFile('cap1.html', function (data) {
    text1Div.innerHTML = data;

    loadTextFile('Benucci.html', function (data) {
      text2Div.innerHTML = data;

      createHighlighter(text1Div, text2Div);
    });
  });
}); */
/* / */


//try a small function that connects all the elements highlighting the same span id on the screen 
//not working at the moment

/*
function highlightConnectedElements() {
  var text1 = document.getElementById('text1');
  var text2 = document.getElementById('text2');

  var spans1 = text1.getElementsByTagName('span');
  var spans2 = text2.getElementsByTagName('span');

  for (var i = 0; i < spans1.length; i++) {
    var spanId = spans1[i].id;
    var correspondingElement = text2.querySelector('[id="' + spanId + '"]');

    if (correspondingElement) {
      spans1[i].classList.add('highlight');
      correspondingElement.classList.add('highlight');
    }
  }
}

window.addEventListener('DOMContentLoaded', function() {
  highlightConnectedElements();
});
*/


