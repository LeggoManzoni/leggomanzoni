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

    function toggleColumn(){
        var column = document.getElementById("destra");
        var bottomDiv = document.getElementById("bottomDiv");
        var upperDiv = document.getElementById("upperDiv");
        var icon = document.getElementById("icon");
      
        if (bottomDiv.classList.contains("hide")) {
          // Show the bottom div
          bottomDiv.classList.remove("hide");
          column.classList.remove("oneText");
          upperDiv.classList.remove("singularText");
          icon.classList.remove("bi-plus-circle");
          icon.classList.add("bi-dash-circle");
        } else {
          // Hide the bottom div
          bottomDiv.classList.add("hide");
          upperDiv.classList.add("singularText");
          column.classList.add("oneText");
          icon.classList.remove("bi-dash-circle");
          icon.classList.add("bi-plus-circle");
        }
      }; 
   
    var enlargerRight = document.getElementById("enlargerRight"); // Function for enlarging the right column and hiding the left one
    enlargerRight.addEventListener("click", enlargeRightColumn);

    function enlargeRightColumn(){
        var columnToMantain = document.getElementById("colonnaD");
        var icon = document.getElementById("enlargerRight");
        var columnToDelete = document.getElementById("colonnaS");
        var i = document.getElementById("enlargerRightI");
      
        if (columnToDelete.classList.contains("hide")) {
          // Show the enlarged div
          columnToDelete.classList.remove("hide");
          columnToMantain.classList.remove("col-12");
          columnToMantain.classList.add("col-6");
          i.classList.add("bi-arrows-angle-expand");
          i.classList.remove("bi-arrows-angle-contract");
        } else {
          // Hide the bottom div
          columnToDelete.classList.add("hide");
          columnToMantain.classList.remove("col-6");
          columnToMantain.classList.add("col-12");
          i.classList.add("bi-arrows-angle-contract");
          i.classList.remove("bi-arrows-angle-expand");
        }
      }; 

    var enlargerLeft = document.getElementById("enlargerLeft"); // Function for enlarging the left column and hiding the right one
    enlargerLeft.addEventListener("click", enlargeLeftColumn);

    function enlargeLeftColumn(){
        var columnToMantain = document.getElementById("colonnaS");
        var icon = document.getElementById("enlargerLeft");
        var columnToDelete = document.getElementById("colonnaD");
        var i = document.getElementById("enlargerLeftI");
      
        if (columnToDelete.classList.contains("hide")) {
          // Show the bottom div
          columnToDelete.classList.remove("hide");
          columnToMantain.classList.remove("col-12");
          columnToMantain.classList.add("col-6");
          i.classList.add("bi-arrows-angle-expand");
          i.classList.remove("bi-arrows-angle-contract");
        } else {
          // Hide the bottom div
          columnToDelete.classList.add("hide");
          columnToMantain.classList.remove("col-6");
          columnToMantain.classList.add("col-12");
          i.classList.add("bi-arrows-angle-contract");
          i.classList.remove("bi-arrows-angle-expand");
        }
      }; 
    };

    var button = document.getElementById("splitButton");
    var popup = document.getElementById("popup");
    button.addEventListener("mouseover", function() {
    popup.style.display = "block";
    });
    button.addEventListener("mouseout", function() {
    popup.style.display = "none";
    });

    var testoButton = document.getElementById("enlargerLeft");
    var popup = document.getElementById("popupL");
    testoButton.addEventListener("mouseover", function() {
        popup.style.display = "block";
        });
        testoButton.addEventListener("mouseout", function() {
    popup.style.display = "none";
    });


    var b = document.getElementById("enlargerLeft");
    var popup = document.getElementById("popup");
    b.addEventListener("mouseover", function() {
        popupR.style.display = "block";
        });
    b.addEventListener("mouseout", function() {
    popupR.style.display = "none";
    });