const defaults = {
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
      ...defaults,
      ...JSON.parse(localStorage.getItem("velarState") || "{}"),
    };
  } catch {
    return defaults;
  }
};
const readRequests = () => {
  try {
    return JSON.parse(localStorage.getItem("velarRequests") || "[]");
  } catch {
    return [];
  }
};
let state = readState();
let requests = readRequests();
const toast = document.querySelector(".toast");
const notify = (text) => {
  toast.textContent = text;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
};
const showTab = (name) => {
  document
    .querySelectorAll("[data-view]")
    .forEach((v) => v.classList.toggle("active", v.dataset.view === name));
  document
    .querySelectorAll("[data-tab]")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
  document.querySelector("[data-title]").textContent = {
    dashboard: "Обзор",
    requests: "Заявки",
    services: "Услуги и цены",
    settings: "Контакты",
  }[name];
  document.querySelector(".sidebar").classList.remove("open");
  if (name === "requests") renderRequests();
};
document
  .querySelectorAll("[data-tab]")
  .forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));
document
  .querySelector("[data-tab-jump]")
  ?.addEventListener("click", (e) => showTab(e.target.dataset.tabJump));
document
  .querySelector(".menu")
  ?.addEventListener("click", () =>
    document.querySelector(".sidebar").classList.toggle("open"),
  );
const renderDashboard = () => {
  requests = readRequests();
  document.querySelector("[data-total]").textContent = requests.length;
  document.querySelector("[data-new]").textContent = requests.filter(
    (x) => x.status === "Новая",
  ).length;
  document.querySelector("[data-appointments]").textContent = requests.filter(
    (x) => x.type === "appointment",
  ).length;
  document.querySelector("[data-callbacks]").textContent = requests.filter(
    (x) => x.type === "callback",
  ).length;
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return d;
  });
  const counts = days.map(
    (day) =>
      requests.filter(
        (x) => new Date(x.createdAt).toDateString() === day.toDateString(),
      ).length,
  );
  const max = Math.max(1, ...counts);
  document.querySelector("[data-bars]").innerHTML = days
    .map(
      (d, i) =>
        `<div class="bar" style="--height:${Math.max(3, (counts[i] / max) * 100)}%"><b>${counts[i]}</b><i></i><span>${d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}</span></div>`,
    )
    .join("");
  const appointments = requests.filter((x) => x.type === "appointment").length;
  const ratio = requests.length ? (appointments / requests.length) * 100 : 0;
  const donut = document.querySelector("[data-donut]");
  donut.style.setProperty("--value", `${ratio}%`);
  donut.querySelector("span").textContent = requests.length;
  document.querySelector("[data-recent]").innerHTML =
    requests
      .slice(0, 5)
      .map(
        (x) =>
          `<div class="recent-row"><small>${new Date(x.createdAt).toLocaleString("ru-RU")}</small><b>${escapeText(x.name || "Без имени")}</b><span>${x.type === "appointment" ? "Запись на услугу" : "Обратный звонок"}</span><small>${escapeText(x.status)}</small></div>`,
      )
      .join("") || '<div class="empty">Новых обращений нет</div>';
};
const escapeText = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[char],
  );
const statuses = ["Новая", "Подтверждена", "В работе", "Завершена", "Отменена"];
const renderRequests = () => {
  requests = readRequests();
  const q = document.querySelector("[data-search]").value.toLowerCase();
  const f = document.querySelector("[data-filter]").value;
  const list = requests.filter(
    (x) =>
      (!f || x.status === f) && JSON.stringify(x).toLowerCase().includes(q),
  );
  document.querySelector("[data-empty]").hidden = list.length > 0;
  document.querySelector("[data-requests]").innerHTML = list
    .map(
      (x) =>
        `<tr><td>${new Date(x.createdAt).toLocaleString("ru-RU")}</td><td>${x.type === "appointment" ? "Запись" : "Звонок"}</td><td>${escapeText(x.name)}</td><td>${escapeText(x.phone)}</td><td>${escapeText(x.vehicle || x.preferredTime || "—")}</td><td><select data-status="${x.id}">${statuses.map((s) => `<option ${s === x.status ? "selected" : ""}>${s}</option>`).join("")}</select></td><td><button class="delete" data-delete="${x.id}">Удалить</button></td></tr>`,
    )
    .join("");
  document.querySelectorAll("[data-status]").forEach((select) =>
    select.addEventListener("change", () => {
      const item = requests.find((x) => x.id === select.dataset.status);
      if (item) item.status = select.value;
      localStorage.setItem("velarRequests", JSON.stringify(requests));
      renderDashboard();
      notify("Статус обновлён");
    }),
  );
  document.querySelectorAll("[data-delete]").forEach((button) =>
    button.addEventListener("click", () => {
      if (!confirm("Удалить заявку?")) return;
      requests = requests.filter((x) => x.id !== button.dataset.delete);
      localStorage.setItem("velarRequests", JSON.stringify(requests));
      renderRequests();
      renderDashboard();
    }),
  );
};
document
  .querySelector("[data-search]")
  .addEventListener("input", renderRequests);
document
  .querySelector("[data-filter]")
  .addEventListener("change", renderRequests);
document.querySelector("[data-export]").addEventListener("click", () => {
  const rows = [
    ["Дата", "Тип", "Имя", "Телефон", "Статус"],
    ...readRequests().map((x) => [
      x.createdAt,
      x.type,
      x.name || "",
      x.phone || "",
      x.status,
    ]),
  ];
  const csv =
    "\uFEFF" +
    rows
      .map((r) =>
        r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";"),
      )
      .join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = "velar-requests.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});
const serviceEditor = document.querySelector("[data-service-editor]");
serviceEditor.innerHTML = state.services
  .map(
    (x, i) =>
      `<label class="service-edit"><span>${String(i + 1).padStart(2, "0")}</span><input data-service-name-input="${i}" value="${escapeText(x.name)}"><input data-service-price-input="${i}" value="${escapeText(x.price)}"></label>`,
  )
  .join("");
document.querySelector("[data-save-services]").addEventListener("click", () => {
  state.services = state.services.map((x, i) => ({
    name:
      document.querySelector(`[data-service-name-input="${i}"]`).value.trim() ||
      x.name,
    price:
      document
        .querySelector(`[data-service-price-input="${i}"]`)
        .value.trim() || x.price,
  }));
  localStorage.setItem("velarState", JSON.stringify(state));
  notify("Услуги сохранены");
});
const settingsForm = document.querySelector("[data-settings]");
Object.entries(state.settings).forEach(([key, value]) => {
  settingsForm.elements[key].value = value;
});
settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  state.settings = Object.fromEntries(new FormData(settingsForm));
  localStorage.setItem("velarState", JSON.stringify(state));
  notify("Контакты сохранены");
});
document.querySelector("[data-clear]").addEventListener("click", () => {
  if (!confirm("Удалить все локальные заявки и вернуть стандартные настройки?"))
    return;
  localStorage.removeItem("velarRequests");
  localStorage.removeItem("velarState");
  location.reload();
});
renderDashboard();
renderRequests();
