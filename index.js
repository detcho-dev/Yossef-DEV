// Header scroll effect
document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector(".computer-header");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  });

  // Mobile menu functionality
  const menuToggle = document.getElementById("menuToggle");
  const closeMenu = document.getElementById("closeMenu");
  const menuOverlay = document.getElementById("menuOverlay");
  const mobileMenu = document.getElementById("mobileMenu");

  const openMenu = () => {
    mobileMenu.classList.add("active");
    menuOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
  };

  const closeMenuFunc = () => {
    mobileMenu.classList.remove("active");
    menuOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
  };

  menuToggle.addEventListener("click", openMenu);
  closeMenu.addEventListener("click", closeMenuFunc);
  menuOverlay.addEventListener("click", closeMenuFunc);

  // Close menu when clicking on a nav link
  document
    .querySelectorAll(".mobile-nav-link, .nav-link")
    .forEach((link) => {
      link.addEventListener("click", closeMenuFunc);
    });

  // Close menu with ESC key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && mobileMenu.classList.contains("active")) {
      closeMenuFunc();
    }
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href");
      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 100,
          behavior: "smooth",
        });
      }
    });
  });

  // Active section detection
  const sections = document.querySelectorAll(".section");
  const navLinks = document.querySelectorAll(
    ".nav-link, .mobile-nav-link"
  );

  window.addEventListener("scroll", () => {
    let current = "";

    sections.forEach((section) => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (pageYOffset >= sectionTop - 200) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      link.classList.remove("active");
      if (link.getAttribute("href").substring(1) === current) {
        link.classList.add("active");
      }
    });
  });

  // Initialize animations on scroll
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.1,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Add fade-in animation to cards
  document.querySelectorAll(".card").forEach((card) => {
    card.style.opacity = 0;
    card.style.transform = "translateY(20px)";
    card.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(card);
  });

  // Add fade-in animation to section titles
  document.querySelectorAll(".section-title").forEach((title) => {
    title.style.opacity = 0;
    title.style.transform = "translateY(30px)";
    title.style.transition = "opacity 0.7s ease, transform 0.7s ease";
    observer.observe(title);
  });
});
