/* Cosmetic gemstone switching; does not alter artwork, purchases or roll outcomes. */
export const BACKGROUND_GEMS = Object.freeze({
  "moonlit-citadel":"sapphire",
  "ancient-ruins":"emerald",
  "enchanted-forest":"aquamarine",
  "dragons-crag":"ruby",
  "shadow-marsh":"amethyst",
  "celestial-plains":"emerald",
  "crystal-caverns":"amethyst",
  "elder-grove":"emerald",
  "mystic-lake":"sapphire",
  "eternal-keep":"citrine"
});
export const GEM_TYPES = Object.freeze(["sapphire","emerald","ruby","aquamarine","amethyst","citrine"]);
export function gemForBackground(slug) {
  const key = String(slug || "").trim().toLowerCase().replaceAll("_","-");
  return BACKGROUND_GEMS[key] || "sapphire";
}
export function selectedBackgroundSlug(doc) {
  const store = doc.querySelector(".store-page");
  if (store && store.querySelector('[data-store-category="backgrounds"].store-category-current')) {
    const selected = store.querySelector('.store-background-tile[aria-pressed="true"], .store-background-tile.selected');
    const slug = selected?.getAttribute("data-store-background");
    if (slug && Object.hasOwn(BACKGROUND_GEMS,slug)) return slug;
  }
  // Only a verified, applied background becomes the permanent global theme.
  // Previewing a paid store background never grants ownership or applies it.
  const applied = doc.body?.getAttribute("data-store-paid-background");
  if (applied && Object.hasOwn(BACKGROUND_GEMS,applied)) return applied;
  const activeImage = doc.body?.style?.getPropertyValue("--oathkeeper-paid-background") || "";
  const match = activeImage.match(/store-backgrounds\/([a-z0-9-]+)\.(?:webp|svg|png)/);
  if (match && Object.hasOwn(BACKGROUND_GEMS,match[1])) return match[1];
  return "moonlit-citadel";
}
export function updateGemTheme(doc) {
  const gem = gemForBackground(selectedBackgroundSlug(doc));
  const html = doc.documentElement;
  if (html.getAttribute("data-oath-gem-theme") !== gem) html.setAttribute("data-oath-gem-theme",gem);
  return gem;
}
export function startGemTheme(doc) {
  if (!doc?.documentElement || !doc?.body) return null;
  updateGemTheme(doc);
  let pending = false;
  const observer = new MutationObserver(mutations => {
    const relevant = mutations.some(m =>
      m.type === "childList" ||
      (m.type === "attributes" &&
       (m.target === doc.body || m.target.matches?.(".store-background-tile, [data-store-category]")))
    );
    if (!relevant || pending) return;
    pending = true;
    queueMicrotask(() => {pending = false; updateGemTheme(doc);});
  });
  observer.observe(doc.documentElement,{
    subtree:true,childList:true,attributes:true,
    attributeFilter:["data-store-paid-background","style","class","aria-pressed"]
  });
  return observer;
}
if (typeof document !== "undefined" && typeof MutationObserver !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded",()=>startGemTheme(document),{once:true});
  } else {
    startGemTheme(document);
  }
}
