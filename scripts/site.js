if (new URLSearchParams(location.search).has("capture"))
  document.documentElement.classList.add("capture-mode");
const defaultState = {
  settings: {
    phone: "+7 (495) 120-45-80",
    address: "Москва, 2-й Магистральный тупик, 7А",
    hours: "Пн–Сб, 09:00–20:00",
  },
  services: [
    { name: "Детейлинг-мойка", price: "от 6 900 ₽" },
    { name: "Коррекция и полировка", price: "от 34 900 ₽" },
    { name: "Керамическое покрытие", price: "от 42 900 ₽" },
    { name: "Химчистка салона", price: "от 24 900 ₽" },
    { name: "Защитная плёнка", price: "от 79 900 ₽" },
    { name: "Защита дисков и стёкол", price: "от 12 900 ₽" },
  ],
};
const readState = () => {
  try {
    return {
      ...defaultState,
      ...JSON.parse(localStorage.getItem("velarState") || "{}"),
    };
  } catch {
    return defaultState;
  }
};
const state = readState();
document.querySelectorAll("[data-setting]").forEach((node) => {
  const value = state.settings?.[node.dataset.setting];
  if (value) {
    node.textContent = value;
    if (node.dataset.setting === "phone" && node.tagName === "A")
      node.href = `tel:${value.replace(/[^+\d]/g, "")}`;
  }
});
document.querySelectorAll("[data-service-card]").forEach((card) => {
  const service = state.services?.[Number(card.dataset.serviceCard)];
  if (!service) return;
  card.querySelector("[data-service-name]").textContent = service.name;
  card.querySelector("[data-service-price]").textContent = service.price;
});
const menuButton = document.querySelector(".menu-toggle");
const mobileMenu = document.querySelector(".mobile-menu");
menuButton?.addEventListener("click", () => {
  const open = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!open));
  mobileMenu.hidden = open;
});
mobileMenu?.querySelectorAll("a").forEach((link) =>
  link.addEventListener("click", () => {
    mobileMenu.hidden = true;
    menuButton?.setAttribute("aria-expanded", "false");
  }),
);
document.querySelectorAll("[data-open]").forEach((button) =>
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.open);
    if (button.dataset.service) {
      const select = dialog?.querySelector('[name="serviceId"]');
      if (select) select.value = button.dataset.service;
    }
    dialog?.showModal();
  }),
);
document
  .querySelectorAll(".dialog-close")
  .forEach((button) =>
    button.addEventListener("click", () => button.closest("dialog")?.close()),
  );
document.querySelectorAll(".form-dialog").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  }),
);
const formatPhone = (value) => {
  const digits = value.replace(/\D/g, "").replace(/^8/, "7").slice(0, 11);
  const n = digits.startsWith("7") ? digits.slice(1) : digits;
  let result = "+7";
  if (n.length) result += ` (${n.slice(0, 3)}`;
  if (n.length >= 3) result += ")";
  if (n.length > 3) result += ` ${n.slice(3, 6)}`;
  if (n.length > 6) result += `-${n.slice(6, 8)}`;
  if (n.length > 8) result += `-${n.slice(8, 10)}`;
  return result;
};
document.querySelectorAll('input[name="phone"]').forEach((input) =>
  input.addEventListener("input", () => {
    input.value = formatPhone(input.value);
  }),
);
const toast = document.querySelector(".toast");
const notify = (message) => {
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 5000);
};
document.querySelectorAll("form[data-ajax]").forEach((form) =>
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const booking = Boolean(form.closest("#booking"));
    const requests = JSON.parse(localStorage.getItem("velarRequests") || "[]");
    requests.unshift({
      id: crypto.randomUUID(),
      type: booking ? "appointment" : "callback",
      status: "Новая",
      createdAt: new Date().toISOString(),
      ...data,
    });
    localStorage.setItem("velarRequests", JSON.stringify(requests));
    form.reset();
    form.closest("dialog")?.close();
    notify(
      booking
        ? "Запись сохранена и появилась в локальной панели."
        : "Запрос сохранён и появился в локальной панели.",
    );
  }),
);
const reveals = document.querySelectorAll(".reveal");
if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.12 },
  );
  reveals.forEach((item) => observer.observe(item));
} else reveals.forEach((item) => item.classList.add("visible"));
const cards = [...document.querySelectorAll(".gallery-card")];
const lightbox = document.querySelector(".lightbox");
let active = 0;
const show = (index) => {
  active = (index + cards.length) % cards.length;
  const source = cards[active].querySelector("img");
  lightbox.querySelector("img").src = source.src;
  lightbox.querySelector("img").alt = source.alt;
  lightbox.querySelector("div").textContent =
    cards[active].querySelector("b").textContent;
};
cards.forEach((card, index) =>
  card.addEventListener("click", () => {
    show(index);
    lightbox.showModal();
  }),
);
lightbox
  ?.querySelector(".lightbox__close")
  ?.addEventListener("click", () => lightbox.close());
lightbox
  ?.querySelector(".lightbox__prev")
  ?.addEventListener("click", () => show(active - 1));
lightbox
  ?.querySelector(".lightbox__next")
  ?.addEventListener("click", () => show(active + 1));
lightbox?.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") show(active - 1);
  if (event.key === "ArrowRight") show(active + 1);
});
document
  .querySelector("[data-cookie-settings]")
  ?.addEventListener("click", () =>
    notify(
      "Сайт не использует рекламные cookie. Локальные данные нужны только для демонстрации панели.",
    ),
  );

const updateScrollEffects = () => {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const progress = max > 0 ? window.scrollY / max : 0;
  document
    .querySelector(".scroll-progress")
    ?.style.setProperty("--progress", `${progress * 100}%`);
  document.body.classList.toggle("has-scrolled", window.scrollY > 24);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const car = document.querySelector(".hero-image img");
    if (car && window.innerWidth > 760)
      car.style.transform = `translate3d(0, ${Math.min(window.scrollY * 0.055, 24)}px, 0) scale(1.01)`;
  }
};
let scrollFrame = 0;
addEventListener(
  "scroll",
  () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      updateScrollEffects();
      scrollFrame = 0;
    });
  },
  { passive: true },
);
document.querySelectorAll('a[href^="#"]').forEach((link) =>
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
      block: "start",
    });
  }),
);
updateScrollEffects();
