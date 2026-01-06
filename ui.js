function addClass(id, className) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.add(className);
}

function removeClass(id, className) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove(className);
}

function toggleClass(id, className) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle(className);
}

function setText(id, text) {

  const el = document.getElementById(id);

  if (el) {
    el.textContent = text;
  }

}

function setStatus(s) {
  setText('status-text', s);
}
