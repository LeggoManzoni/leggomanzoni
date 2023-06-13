/*!
* Start Bootstrap - Creative v7.0.6 (https://startbootstrap.com/theme/creative)
* Copyright 2013-2022 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-creative/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded',  () => {

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }

    };

    //Shring the navbar
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    // Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            offset: 74,
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
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

    // Activate SimpleLightbox plugin for portfolio items
    new SimpleLightbox({
        elements: '#portfolio a.portfolio-box'
    });

    function changepage(){
    var page = document.getElementById('whichpage').getAttribute("href"); //adpat to our different filenames
    };
  
    collectId();
    });

    /* collect id */
    let collectId = () => {
    // function for splitting the id content 
    fetch('/extract-ids')
    .then(response => response.json())
    .then(idArray => {
        console.log(idArray);
        // Use the extracted IDs in client-side code
    })
    .catch(error => {
        console.error('Error fetching the IDs:', error);
    });

    var splitButton = document.getElementById("splitButton");
    splitButton.addEventListener("click", toggleColumn);
    
    // Function for modifying the right column and showing one or two comments at the same time
    function toggleColumn(){
        var column = document.getElementById("destra");
        var bottomDiv = document.getElementById("bottomDiv");
        var upperDiv = document.getElementById("upperDiv");
        var icon = document.getElementById("icon");
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
        }
      }; 
   
    // Function for enlarging the right column and hiding the left one
    var enlargerRight = document.getElementById("enlargerRight"); 
    enlargerRight.addEventListener("click", enlargeRightColumn);

    function enlargeRightColumn(){
        var columnToMantain = document.getElementById("colonnaD");
        var icon = document.getElementById("enlargerRight");
        var columnToDelete = document.getElementById("colonnaS");
        var i = document.getElementById("enlargerRightI");
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
        }
      }; 
    
    // Function for enlarging the left column and hiding the right one
    var enlargerLeft = document.getElementById("enlargerLeft"); 
    enlargerLeft.addEventListener("click", enlargeLeftColumn);

    function enlargeLeftColumn(){
        var columnToMantain = document.getElementById("colonnaS");
        var icon = document.getElementById("enlargerLeft");
        var columnToDelete = document.getElementById("colonnaD");
        var i = document.getElementById("enlargerLeftI");
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
        }
      }; 
    
    //vedi riga 79 come uniformare con class e query selector all perché per questi due scroll automatici può essere utile 
    // Function for changing the toggle button and blocking authomatic redirection, to be done later (for the first or only comment)
    var scrollAuto = document.getElementById("scrollAuto"); 
    scrollAuto.addEventListener("click", blockRedirection);

    function blockRedirection(){
        var i = document.getElementById("scrollAutomatico");
        var testo1 =document.getElementById("popupScroll");
      
        if (i.classList.contains("bi-toggle-on")) {
          // Show the bottom div
          i.classList.remove("bi-toggle-on");
          i.classList.add("bi-toggle-off");
          testo1.textContent = "Il reindirizzamento automatico tra testo e commento è disattivato. Clicca per attivare.";
        } else {
          // Hide the bottom div
          i.classList.remove("bi-toggle-off");
          i.classList.add("bi-toggle-on");
          testo1.textContent = "Il reindirizzamento automatico tra testo e commento è attivo. Clicca per disattivare.";
        }
      }; 

    
    // Function for changing the toggle button and blocking authomatic redirection, to be done later (for the second comment)
    var scrollAuto2 = document.getElementById("scrollAuto2"); 
    scrollAuto2.addEventListener("click", blockSecondRedirection);

    function blockSecondRedirection(){
        var i2 = document.getElementById("scrollAutomatico2");
        var testo2 =document.getElementById("popupScroll2");
      
        if (i2.classList.contains("bi-toggle-on")) {
          // Show the bottom div
          i2.classList.remove("bi-toggle-on");
          i2.classList.add("bi-toggle-off");
          testo2.textContent = "Il reindirizzamento automatico tra testo e commento è disattivato. Clicca per attivare.";
        } else {
          // Hide the bottom div
          i2.classList.remove("bi-toggle-off");
          i2.classList.add("bi-toggle-on");
          testo2.textContent = "Il reindirizzamento automatico tra testo e commento è attivo. Clicca per disattivare.";
        }
      }; 

    //Functions for showing through a popup the meaning of the buttons in the reading area: 
   
       // 1) popup for splitting in two comments or one;
      var button = document.getElementById("splitButton");
      var popup = document.getElementById("popup");
      button.addEventListener("mouseover", function() {
      popup.style.display = "block";
      });
      button.addEventListener("mouseout", function() {
      popup.style.display = "none";
      });

      // 2) popup for enlarging the left column
      var testoButton = document.getElementById("enlargerLeft");
      var popupL = document.getElementById("popupL");
      testoButton.addEventListener("mouseover", function() {
          popupL.style.display = "block";
          });
          testoButton.addEventListener("mouseout", function() {
      popupL.style.display = "none";
      });

      // 3) popup for enlarging the right column 
      var b = document.getElementById("enlargerRight");
      var popupR = document.getElementById("popupR");
      b.addEventListener("mouseover", function() {
          popupR.style.display = "block";
          });
      b.addEventListener("mouseout", function() {
      popupR.style.display = "none";
      });

      // 4) popup for blocking authomatic redirection for comment 1
      var toggleB = document.getElementById("scrollAuto");
      var popupScroll = document.getElementById("popupScroll");
      toggleB.addEventListener("mouseover", function() {
          popupScroll.style.display = "block";
          });
      toggleB.addEventListener("mouseout", function() {
      popupScroll.style.display = "none";
      });

      // 5) popup for blocking authomatic redirection for comment 2
      var toggleSecond = document.getElementById("scrollAuto2");
      var popupScroll2 = document.getElementById("popupScroll2");
      toggleSecond.addEventListener("mouseover", function() {
          popupScroll2.style.display = "block";
          });
      toggleSecond.addEventListener("mouseout", function() {
      popupScroll2.style.display = "none";
      });      
  };


  var currentPageUrl = window.location.href;

  // Update 'reader.ejs' with the specific page you want the modal to appear
  if (currentPageUrl.includes('reader')) {
    var modal = document.getElementById("myModal");
    var closeButton = document.getElementsByClassName("close")[0];

    modal.style.display = "block";

    closeButton.onclick = function() {
      modal.style.display = "none";
    }

    window.onclick = function(event) {
      if (event.target == modal) {
        modal.style.display = "none";
      }
    }
  }

  // Function for switching the toggle into opened and closed in the Commenti page and to switch consequently the arrow icon up and down 
  document.addEventListener("DOMContentLoaded", function() {
    var toggleBtns = document.querySelectorAll(".toggleBtn");
  
    toggleBtns.forEach(function(toggleBtn) {
      toggleBtn.addEventListener("click", function() {
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
  });
  
  function extractYearFromToggleBtn(toggleBtn) {
    const text = toggleBtn.innerText.trim();
    const regex = /\((\d+)\)/;
    const match = regex.exec(text);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    return 0;
  }
  
  function sortListItemsByYear(ascending) {
    const toggleBtns = document.getElementsByClassName("toggleBtn");
    const commentList = document.querySelector(".comment-list-items");
  
    const sortedList = Array.from(toggleBtns)
      .sort((a, b) => {
        const yearA = extractYearFromToggleBtn(a);
        const yearB = extractYearFromToggleBtn(b);
        return ascending ? yearA - yearB : yearB - yearA;
      })
      .map((toggleBtn) => toggleBtn.parentNode);
  
    commentList.innerHTML = "";
    sortedList.forEach((item) => {
      const clonedItem = item.cloneNode(true);
      commentList.appendChild(clonedItem);
    });
  }
  
  document.addEventListener("DOMContentLoaded", () => {
    const orderButtons = document.getElementsByClassName("order-button");
    const toggleBtns = document.getElementsByClassName("toggleBtn");
    const commentList = document.querySelector(".comment-list-items");
  
    const originalOrder = Array.from(toggleBtns)
      .map((toggleBtn) => toggleBtn.parentNode)
      .map((item) => item.cloneNode(true));
  
    let isChronological = true;
    let isAscending = true;
  
    function resetCommentList() {
      commentList.innerHTML = "";
      originalOrder.forEach((item) => {
        const clonedItem = item.cloneNode(true);
        commentList.appendChild(clonedItem);
      });
    }
  
    Array.from(orderButtons).forEach((button) => {
      button.addEventListener("click", () => {
        const order = button.getAttribute("data-order");
        if (order === "chronological") {
          if (!isChronological) {
            isChronological = true;
            isAscending = true;
            resetCommentList();
          }
        } else if (order === "descendant") {
          if (isChronological || isAscending) {
            isChronological = false;
            isAscending = false;
            sortListItemsByYear(false);
          }
        } else if (order === "ascendant") {
          if (isChronological || !isAscending) {
            isChronological = false;
            isAscending = true;
            sortListItemsByYear(true);
          }
        } else if (order === "alphabetical") {
          isChronological = false;
          isAscending = true;
          sortListItemsByYear(true);
        }
      });
    });
  });
  