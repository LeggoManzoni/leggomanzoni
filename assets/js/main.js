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
        var icon = document.getElementById("icon");
      
        if (bottomDiv.classList.contains("hide")) {
          // Show the bottom div
          bottomDiv.classList.remove("hide");
          column.classList.remove("col-6");
          column.classList.add("col-12");
          icon.classList.remove("fa-plus");
          icon.classList.add("fa-minus");
        } else {
          // Hide the bottom div
          bottomDiv.classList.add("hide");
          column.classList.remove("col-12");
          column.classList.add("col-6");
          icon.classList.remove("fa-minus");
          icon.classList.add("fa-plus");
        }
      }; 
    adjustFlexProperties();
    }

    function adjustFlexProperties() {
    var column = document.getElementById("destra");
    var bottomDiv = document.getElementById("bottomDiv");

    if (bottomDiv.classList.contains("hide")) {
        column.style.flex = "1"; // Set the first div to occupy 100% height
    } else {
        column.style.flex = ""; // Reset the flex property
    }
    };
