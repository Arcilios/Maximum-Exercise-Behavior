  const tocWrapper = document.getElementById("toc-wrapper");
  const toggleBtn = document.getElementById("toggle-toc");

  let userToggled = false;
  let hasAutoCollapsed = false;


  toggleBtn.addEventListener("click", () => {
    tocWrapper.classList.toggle("collapsed");
    toggleBtn.textContent = tocWrapper.classList.contains("collapsed") ? "➕" : "➖";
    userToggled = true; 
  });


  function autoCollapseOnScroll() {
    if (!userToggled && !hasAutoCollapsed) {
      tocWrapper.classList.add("collapsed");
      toggleBtn.textContent = "➕";
      hasAutoCollapsed = true;
      console.log("✅ Auto-collapsed TOC on scroll");
    }
  }

  document.addEventListener("scroll", autoCollapseOnScroll);