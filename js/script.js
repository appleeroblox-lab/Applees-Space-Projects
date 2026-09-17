"use strict";

const header = document.querySelector(".site-header");
const menuButton = document.querySelector(".menu-toggle");
const siteMenu = document.querySelector(".site-menu");
const navLinks = document.querySelectorAll('.primary-nav a[href^="#"]');
const gameCards = document.querySelectorAll(".game-card[data-url]");

function closeMenu() {
  if (!menuButton || !siteMenu) return;

  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Open navigation");
  siteMenu.classList.remove("open");
}

if (menuButton && siteMenu) {
  menuButton.addEventListener("click", () => {
    const willOpen = menuButton.getAttribute("aria-expanded") !== "true";
    menuButton.setAttribute("aria-expanded", String(willOpen));
    menuButton.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
    siteMenu.classList.toggle("open", willOpen);
  });

  siteMenu.addEventListener("click", (event) => {
    if (event.target.closest("a")) closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) closeMenu();
  });
}

function updateHeader() {
  if (header) header.classList.toggle("is-scrolled", window.scrollY > 18);
}

updateHeader();
window.addEventListener("scroll", updateHeader, { passive: true });

const sections = [...navLinks]
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

if ("IntersectionObserver" in window && sections.length) {
  const sectionObserver = new IntersectionObserver((entries) => {
    const visibleEntry = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visibleEntry) return;

    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${visibleEntry.target.id}`);
    });
  }, {
    rootMargin: "-25% 0px -55% 0px",
    threshold: [0.05, 0.3, 0.6]
  });

  sections.forEach((section) => sectionObserver.observe(section));
}

function openGame(url) {
  const openedWindow = window.open(url, "_blank", "noopener,noreferrer");
  if (openedWindow) openedWindow.opener = null;
}

gameCards.forEach((card) => {
  card.addEventListener("click", (event) => {
    if (event.target.closest("a, button")) return;
    openGame(card.dataset.url);
  });
});
