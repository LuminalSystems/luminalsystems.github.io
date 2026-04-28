/*** 
 * 
 * This file is intended to serve as the site's main functionalism. 
 * @Author Luminal Systems
 * 
 * There is no copyright on this file. If you want to use it, go for it. 
 * If you want to modify for your own website, go for it. 
 * You can use this file however you see fit. Everything on this website is 
 * Open source and I encourage people to learn from anything they can on here. 
 * 
***/

// Injects the navbar for navigation. Prevents me from having to copy paste 
// or write it out a dozen and one times. Also means less updates if I change the nav. 
function injectNav() {
  const baseURL = "https://luminalsystems.github.io";
  const navbarHTML = `
  <nav>
    <a href="/">Home</a>
    <a href="/papers/">Papers</a>
    <a href="/projects/">Projects</a>
    <a href="/code/">Code</a>
    <a href="${baseURL}/blog.html">Blog</a>
    <a href="${baseURL}/playground.html">Playground</a>
    <a href="${baseURL}/about.html">About</a>
    <a href="${baseURL}/contact.html">Contact Us</a>
  </nav>
  `;
  const container = document.getElementById('nav-bar');
  if (container) container.innerHTML = navbarHTML;
}

// Injects a footer at the bottom of every page so you don't have to 
// Manually change every single page with a footer if you ever change it. 
function injectFooter() {
  const footerHTML = `
    <footer>
      <p class="footer-line">
        © 2025 Luminal Systems. All rights reserved.
      </p>
    </footer>
  `;
  const container = document.getElementById('footer-container');
  if (container) container.innerHTML = footerHTML;
}


// Function to generate camera reel for images using 
// {directory} as a catch all for whatever dir it sits in
// and the universal prefix "image-#" to call and loop through images
function generateReel(directory, length) {
  const depths = Array.from({length: length}, (_, i) => 
    `${directory}image-${i+1}.png`); 

  const reel = document.getElementById('scroll-reel');

  depths.forEach(src => {
    const img = document.createElement('img');
    img.src = src;
    img.className = 'reel-image';

    img.onclick = () => {
      window.open(src, '_blank');
    };

    reel.appendChild(img);
  });
}


  // This is the cite engine for citing papers on Luminal Systems, The Luminous Library. 
  // This function will be changed and updated/upgraded in the coming future. 
function cite(paperTitle, authors, year, link) {
    return `
      <cite>
        ${authors} (${year}). <em>${paperTitle}</em>. 
        Retrieved from <a href="${link}" target="_blank">${link}</a>
      </cite>
    `;
  }
  

  // Call injectNav at the end of each HTML page. 
  injectNav();
  // Call injectFooter() at the end of each HTML file's <script>
  injectFooter();
