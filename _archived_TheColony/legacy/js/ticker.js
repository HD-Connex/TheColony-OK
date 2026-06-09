// Duplicates ticker content so the scroll animation loops seamlessly
export function initTicker() {
  const track = document.querySelector('.ticker__track');
  if (!track) return;

  const clone = track.cloneNode(true);
  track.parentElement.appendChild(clone);
}
