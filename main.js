// Point every download link at the real file of the latest release, and the
// hero button at the build for this computer. Without JS, or if the GitHub API
// call fails, links stay on the releases/latest page.

const FILES = {
  "mac-arm": /_aarch64\.dmg$/,
  "mac-intel": /_x64\.dmg$/,
  appimage: /_amd64\.AppImage$/,
  deb: /_amd64\.deb$/,
  rpm: /\.x86_64\.rpm$/,
  exe: /_x64-setup\.exe$/,
};

const DOWNLOAD_BASE = "https://github.com/rendyuwu/tervia/releases/download/";

const PLATFORMS = {
  // Browsers report Apple silicon Macs as Intel, so say which build this is.
  mac: { name: "macOS (Apple silicon)", file: "mac-arm" },
  linux: { name: "Linux", file: "appimage" },
  windows: { name: "Windows", file: "exe" },
};

function detectOs() {
  const ua = navigator.userAgent;
  const p = (navigator.userAgentData?.platform || navigator.platform || ua).toLowerCase();
  if (/android|iphone|ipad/i.test(ua)) return null;
  // iPad Safari asks for desktop sites and reports itself as a Mac.
  if (p.includes("mac") && navigator.maxTouchPoints > 1) return null;
  if (p.includes("mac")) return "mac";
  if (p.includes("win")) return "windows";
  if (p.includes("linux")) return "linux";
  return null;
}

const os = detectOs();
const primary = document.querySelector("[data-primary]");
const primaryFile = document.querySelector("[data-primary-file]");

if (os) {
  primary.textContent = `Download for ${PLATFORMS[os].name}`;
  document.querySelector(`[data-os="${os}"]`)?.classList.add("is-yours");
} else {
  primary.href = "#download";
}

fetch("https://api.github.com/repos/rendyuwu/tervia/releases/latest")
  .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
  .then((release) => {
    const found = {};
    for (const [key, re] of Object.entries(FILES)) {
      const asset = release.assets.find(
        (a) => re.test(a.name) && a.browser_download_url.startsWith(DOWNLOAD_BASE),
      );
      if (!asset) continue;
      found[key] = asset;
      const size = `${Math.round(asset.size / 1e6)} MB`;
      for (const a of document.querySelectorAll(`[data-file="${key}"]`)) {
        a.href = asset.browser_download_url;
        a.title = asset.name;
        a.dataset.size = size;
      }
    }

    for (const el of document.querySelectorAll("[data-version]")) {
      el.textContent = `Tervia ${release.tag_name}`;
    }

    const asset = os && found[PLATFORMS[os].file];
    if (asset) {
      primary.href = asset.browser_download_url;
      primaryFile.innerHTML = `<code></code>, ${Math.round(asset.size / 1e6)} MB`;
      primaryFile.firstChild.textContent = asset.name;
    }
  })
  .catch(() => {});

// Theme button: the page is dark by default; the button switches to light and
// remembers it. Switching back to dark forgets the choice.
const root = document.documentElement;
const toggle = document.querySelector("[data-theme-toggle]");
const isDark = () => root.dataset.theme !== "light";
const syncToggle = () => toggle.setAttribute("aria-pressed", String(isDark()));

toggle.hidden = false;
toggle.addEventListener("click", () => {
  const light = isDark();
  try {
    if (light) localStorage.setItem("tervia-theme", "light");
    else localStorage.removeItem("tervia-theme");
  } catch {}
  if (light) root.dataset.theme = "light";
  else delete root.dataset.theme;
  syncToggle();
});
syncToggle();

// Screenshot viewer: click a screenshot to see it at full size, click
// anywhere or press Esc to close.
const viewer = document.querySelector(".viewer");
const viewerImg = new Image();
viewer.prepend(viewerImg);

// Each .zoom is a link to the image file, so without JS it still opens it.
for (const link of document.querySelectorAll(".zoom")) {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const img = link.querySelector("img");
    viewerImg.src = img.currentSrc || img.src;
    viewerImg.alt = img.alt;
    viewer.showModal();
  });
}
viewer.addEventListener("click", () => viewer.close());
