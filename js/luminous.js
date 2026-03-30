/*** 
 * 
 * This file is intended to server as the site's main functionalism. 
 * @Author Luminal Systems
 * 
 * There is no copyright on this file. If you want to use it, go for it. 
 * If you want to modify for your own website, go for it. 
 * You can use this file however you see fit. Everything on this website is 
 * Open source and I encourage people to learn from anything they can on here. 
 * 
***/

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
  
  // Call injectFooter() at the end of each HTML file's <script>
  injectFooter();
  