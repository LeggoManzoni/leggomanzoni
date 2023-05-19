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

    function splitColumn() {
        var upperDiv = document.getElementById("D1");
        var bottomDiv = document.getElementById("D2");
      
        if (upperDiv.style.display === "none") {
          upperDiv.style.display = "block";
          bottomDiv.style.display = "block";
        } else {
          upperDiv.style.display = "none";
          bottomDiv.style.display = "none";
        }
      }

    var splitButton = document.getElementById("splitButton");
    splitButton.addEventListener("click", splitColumn);
    console.log("hello");
};