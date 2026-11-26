const PRODUCTS = [
  {
    id: "caffe-latte",
    name: "Caffe Latte",
    description: "Espresso dengan susu lembut, diracik untuk teman santai.",
    price: 23000,
    image: "foto kopsteng/latte.webp",
    category: "Minuman"
  },
  {
    id: "americano",
    name: "Americano",
    description: "Kopi dengan karakter rasa yang ringan dan menyegarkan.",
    price: 18000,
    image: "foto kopsteng/americano.webp",
    category: "Minuman"
  },
  {
    id: "kenyang-enak-katsu",
    name: "Kenyang Enak Katsu",
    description: "Ayam katsu renyah dengan nasi dan pelengkap segar.",
    price: 25000,
    image: "foto kopsteng/ayam katsu.webp",
    category: "Makanan"
  },
  {
    id: "mix-fries",
    name: "Mix Fries",
    description: "Aneka camilan gurih untuk dinikmati bersama.",
    price: 20000,
    image: "foto kopsteng/mix platter.webp",
    category: "Makanan"
  },
  {
    id: "nasi-goreng",
    name: "Nasi Goreng",
    description: "Nasi goreng hangat dengan telur dan pelengkap.",
    price: 15000,
    image: "foto kopsteng/nasi goreng.webp",
    category: "Makanan"
  },
  {
    id: "mie-goreng",
    name: "Indomie Goreng",
    description: "Mie goreng dengan telur, disajikan hangat.",
    price: 15000,
    image: "foto kopsteng/mie goreng.jpg",
    category: "Makanan"
  }
];

// Opening hours (0 = Minggu). The visit block, the footer and the contact page read these.
const HOURS = [
  { days: [1, 2, 3, 4, 5, 6], label: "Senin–Sabtu", open: 9, close: 23 },
  { days: [0], label: "Minggu", open: 16, close: 23 }
];

// Suggested pairs from the menu; the total is always the sum of the menu prices.
const PAIRS = [
  { name: "Pagi santai", items: ["caffe-latte", "nasi-goreng"] },
  { name: "Makan siang", items: ["americano", "kenyang-enak-katsu"] },
  { name: "Nongkrong sore", items: ["caffe-latte", "mix-fries"] }
];

const CART_KEY = "kopsteng-cart";
const formatRupiah = (amount) => `Rp ${amount.toLocaleString("id-ID")}`;
const ARROW = '<svg class="i-arrow" viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10h11m-4-5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const BAG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9L5 8Z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>';

function loadCart() {
  const savedCart = localStorage.getItem(CART_KEY);
  if (!savedCart) return [];

  const parsedCart = JSON.parse(savedCart);
  if (!Array.isArray(parsedCart)) {
    throw new Error("Data keranjang tidak valid.");
  }
  return parsedCart.filter((entry) =>
    PRODUCTS.some((product) => product.id === entry.id) &&
    Number.isInteger(entry.quantity) &&
    entry.quantity > 0
  );
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartCount(cart);
}

function updateCartCount(cart = loadCart()) {
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll("[data-cart-count]").forEach((badge) => {
    badge.textContent = count;
  });
}

function addToCart(productId) {
  const cart = loadCart();
  const existingItem = cart.find((item) => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({ id: productId, quantity: 1 });
  }
  saveCart(cart);
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasGsap = () => typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined" && typeof window.SplitText !== "undefined";
let lenis = null;

/* ---------------------------------------------------------------- hours */
const hourLabel = (hour) => `${String(hour).padStart(2, "0")}.00`;
const hoursFor = (date) => HOURS.find((entry) => entry.days.includes(date.getDay()));

function openStatus(now = new Date()) {
  const today = hoursFor(now);
  const hour = now.getHours() + now.getMinutes() / 60;
  if (hour >= today.open && hour < today.close) return { open: true, label: "Buka sekarang", detail: `sampai ${hourLabel(today.close)}` };
  if (hour < today.open) return { open: false, label: "Belum buka", detail: `buka ${hourLabel(today.open)}` };
  const tomorrow = hoursFor(new Date(now.getTime() + 86400000));
  return { open: false, label: "Sudah tutup", detail: `besok buka ${hourLabel(tomorrow.open)}` };
}

function renderHours() {
  const today = hoursFor(new Date());
  const status = openStatus();
  document.querySelectorAll("[data-hours]").forEach((list) => {
    list.innerHTML = HOURS.map((entry) => `<li${entry === today ? ' class="is-today"' : ""}><span>${entry.label}</span><span>${hourLabel(entry.open)}–${hourLabel(entry.close)}</span></li>`).join("");
  });
  document.querySelectorAll("[data-open-status]").forEach((pill) => {
    pill.querySelector(".status-dot")?.classList.toggle("is-closed", !status.open);
    pill.querySelector("[data-status-text]").textContent = status.label;
    pill.querySelector("[data-status-detail]").textContent = status.detail;
  });
  document.querySelectorAll("[data-today-open]").forEach((el) => { el.textContent = hourLabel(today.open); });
  document.querySelectorAll("[data-today-close]").forEach((el) => { el.textContent = hourLabel(today.close); });
}

/* ---------------------------------------------------------------- add-to-cart feedback */
// The button turns green, the photo flies to the bag, the count bumps, a note slides up.
function celebrateAdd(button, ids) {
  const names = ids.map((id) => PRODUCTS.find((entry) => entry.id === id).name);
  const label = button.querySelector("[data-add-label]");
  window.clearTimeout(button.addedTimer);
  button.classList.add("is-added");
  if (label) label.textContent = "Ditambahkan";
  button.addedTimer = window.setTimeout(() => {
    button.classList.remove("is-added");
    if (label) label.textContent = label.dataset.addLabel;
  }, 1400);
  flyToCart(button.closest(".product-card, .spot-card, .pair")?.querySelector("img"));
  showToast(`${names.join(" + ")} masuk keranjang`);
}

function flyToCart(image) {
  const nav = document.querySelector(".nav");
  const target = document.querySelector(".cart-btn svg");
  const badge = document.querySelector(".cart-badge");
  const bump = () => {
    badge?.classList.remove("is-bump");
    void badge?.offsetWidth; // restart the bump when items are added quickly
    badge?.classList.add("is-bump");
  };
  nav?.classList.remove("is-hidden");
  const from = image?.getBoundingClientRect();
  if (!target || !from?.width || !image.complete || !image.naturalWidth || reducedMotion() || !image.animate) return bump();

  const to = target.getBoundingClientRect();
  const navShift = nav ? nav.getBoundingClientRect().top : 0; // the nav may still be sliding back in
  const ghost = image.cloneNode();
  ghost.className = "fly-ghost";
  ghost.removeAttribute("loading");
  Object.assign(ghost.style, { left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  document.body.append(ghost);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top - navShift + to.height / 2 - (from.top + from.height / 2);
  const end = 24 / from.width;
  ghost.animate([
    { transform: "translate(0, 0) scale(1)", opacity: 1, borderRadius: "16px" },
    { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 80}px) scale(${(1 + end) / 2.4})`, opacity: 0.95, offset: 0.5 },
    { transform: `translate(${dx}px, ${dy}px) scale(${end})`, opacity: 0.3, borderRadius: "50%" }
  ], { duration: 820, easing: "cubic-bezier(.5, 0, .25, 1)" }).finished.then(() => {
    ghost.remove();
    bump();
  });
}

function showToast(message) {
  const toast = document.querySelector(".toast-k");
  if (!toast) return;
  toast.querySelector("[data-toast-text]").textContent = message;
  toast.classList.add("is-on");
  window.clearTimeout(toast.hideTimer);
  toast.hideTimer = window.setTimeout(() => toast.classList.remove("is-on"), 2600);
}

/* ---------------------------------------------------------------- templates */
function productCard(product, index) {
  return `
    <article class="product-card" data-category="${product.category}">
      <button type="button" class="photo-trigger product-card__media" data-cursor="Lihat" data-photo-src="${product.image}" data-photo-alt="${product.name}" aria-label="Perbesar foto ${product.name}">
        <span class="product-card__fallback" aria-hidden="true">${product.name}</span>
        <img src="${product.image}" alt="" loading="lazy" onerror="this.parentElement.disabled = true; this.parentElement.removeAttribute('data-cursor'); this.remove()">
      </button>
      <span class="product-card__no" aria-hidden="true">${String(index + 1).padStart(2, "0")}</span>
      <div class="product-card__body">
        <span class="tag">${product.category}</span>
        <h3 class="product-card__title">${product.name}</h3>
        <p class="product-card__desc">${product.description}</p>
        <div class="product-card__foot">
          <span class="product-price">${formatRupiah(product.price)}</span>
          <button type="button" class="btn btn-gold btn-sm btn-add" data-add-to-cart="${product.id}"><span data-add-label="Tambah">Tambah</span></button>
        </div>
      </div>
    </article>`;
}

function renderProducts(target, products) {
  const container = document.getElementById(target);
  if (container) container.innerHTML = products.map(productCard).join("");
}

function renderPairs() {
  const container = document.getElementById("pairs");
  if (!container) return;
  container.innerHTML = PAIRS.map((pair) => {
    const items = pair.items.map((id) => PRODUCTS.find((product) => product.id === id));
    const total = items.reduce((sum, product) => sum + product.price, 0);
    return `
      <article class="pair">
        <div class="pair__pics">${items.map((product) => `<img src="${product.image}" alt="" width="96" height="96" loading="lazy">`).join("")}</div>
        <p class="pair__name">${pair.name}</p>
        <h3 class="pair__items">${items.map((product) => product.name).join(" + ")}</h3>
        <div class="pair__foot">
          <span class="pair__total">${formatRupiah(total)}</span>
          <button type="button" class="btn btn-glass btn-sm btn-add" data-add-to-cart="${pair.items.join(",")}"><span data-add-label="Tambah keduanya">Tambah keduanya</span></button>
        </div>
      </article>`;
  }).join("");
}

function renderBoard() {
  const container = document.getElementById("menu-board");
  if (!container) return;
  const categories = [...new Set(PRODUCTS.map((product) => product.category))];
  container.innerHTML = categories.map((category) => `
    <div class="board__group">
      <h3>${category}</h3>
      ${PRODUCTS.filter((product) => product.category === category).map((product) => `
        <div class="board__item">
          <div class="board__row"><span class="board__name">${product.name}</span><span class="board__dots" aria-hidden="true"></span><span class="board__price">${formatRupiah(product.price)}</span></div>
          <p class="board__desc">${product.description}</p>
        </div>`).join("")}
    </div>`).join("");
}

function renderCart() {
  const container = document.getElementById("cart-content");
  if (!container) return;

  const cart = loadCart();
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon" aria-hidden="true">${BAG}</span>
        <h2>Keranjangmu masih kosong</h2>
        <p>Yuk, pilih menu yang ingin kamu nikmati.</p>
        <a class="btn btn-gold" href="produk.html">Lihat menu ${ARROW}</a>
      </div>`;
    return;
  }

  const cartRows = cart.map((item) => {
    const product = PRODUCTS.find((entry) => entry.id === item.id);
    return `
      <div class="cart-row" data-cart-row="${product.id}">
        <img class="cart-image" src="${product.image}" alt="${product.name}">
        <div>
          <h2 class="cart-row__name">${product.name}</h2>
          <span class="muted small">${formatRupiah(product.price)} / item</span>
        </div>
        <div>
          <label class="visually-hidden" for="quantity-${product.id}">Jumlah ${product.name}</label>
          <input id="quantity-${product.id}" class="form-control cart-quantity" type="number" min="1" step="1" inputmode="numeric" value="${item.quantity}" data-cart-quantity="${product.id}">
        </div>
        <span class="cart-row__total">${formatRupiah(product.price * item.quantity)}</span>
        <button type="button" class="icon-btn" aria-label="Hapus ${product.name}" data-remove-from-cart="${product.id}"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9m0-9-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      </div>`;
  }).join("");
  const total = cart.reduce((sum, item) => {
    const product = PRODUCTS.find((entry) => entry.id === item.id);
    return sum + product.price * item.quantity;
  }, 0);

  container.innerHTML = `
    <div class="cart-layout">
      <div class="cart-list">${cartRows}</div>
      <aside class="panel panel--glow summary-card" aria-labelledby="cart-summary-title">
        <h2 id="cart-summary-title" class="panel__title">Ringkasan</h2>
        <div class="summary-line summary-line--total"><span>Total pesanan</span><strong>${formatRupiah(total)}</strong></div>
        <a href="checkout.html" class="btn btn-gold btn-lg w-100">Lanjut ke checkout ${ARROW}</a>
        <a href="produk.html" class="btn btn-glass w-100">Tambah menu</a>
        <p class="small muted mb-0">Pesanan dapat ditinjau kembali sebelum dikonfirmasi.</p>
      </aside>
    </div>`;
}

function renderCheckout() {
  const container = document.getElementById("checkout-content");
  if (!container) return;

  const cart = loadCart();
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state__icon" aria-hidden="true">${BAG}</span>
        <h2>Belum ada pesanan untuk di-checkout</h2>
        <p>Tambahkan menu ke keranjang untuk melanjutkan.</p>
        <a class="btn btn-gold" href="produk.html">Pilih menu ${ARROW}</a>
      </div>`;
    return;
  }

  const items = cart.map((item) => {
    const product = PRODUCTS.find((entry) => entry.id === item.id);
    return `
      <div class="summary-line">
        <span>${product.name} <span class="muted">× ${item.quantity}</span></span>
        <span class="text-nowrap">${formatRupiah(product.price * item.quantity)}</span>
      </div>`;
  }).join("");
  const total = cart.reduce((sum, item) => {
    const product = PRODUCTS.find((entry) => entry.id === item.id);
    return sum + product.price * item.quantity;
  }, 0);

  container.innerHTML = `
    <div class="row g-4 align-items-start">
      <div class="col-lg-7">
        <form id="checkout-form" class="panel">
          <h2 class="panel__title">Informasi penerima</h2>
          <div class="mb-3">
            <label for="checkout-name" class="form-label">Nama lengkap</label>
            <input id="checkout-name" name="name" class="form-control" autocomplete="name" required>
          </div>
          <div class="mb-3">
            <label for="checkout-phone" class="form-label">Nomor telepon</label>
            <input id="checkout-phone" name="phone" type="tel" class="form-control" autocomplete="tel" required>
          </div>
          <div class="mb-4">
            <label for="checkout-address" class="form-label">Alamat pengiriman</label>
            <textarea id="checkout-address" name="address" class="form-control" rows="3" autocomplete="street-address" required></textarea>
          </div>
          <fieldset class="mb-4">
            <legend class="mini-title">Metode pembayaran</legend>
            <label class="pay-option" for="payment-cod">
              <input type="radio" name="payment" id="payment-cod" value="Bayar di tempat (COD)" checked>
              <span class="pay-option__dot" aria-hidden="true"></span>
              <span><b>Bayar di tempat (COD)</b><small>Bayar saat pesanan diterima</small></span>
            </label>
            <label class="pay-option" for="payment-transfer">
              <input type="radio" name="payment" id="payment-transfer" value="Transfer bank (simulasi)">
              <span class="pay-option__dot" aria-hidden="true"></span>
              <span><b>Transfer bank</b><small>Simulasi pembayaran, tanpa memasukkan data rekening</small></span>
            </label>
            <label class="pay-option" for="payment-wallet">
              <input type="radio" name="payment" id="payment-wallet" value="E-wallet (simulasi)">
              <span class="pay-option__dot" aria-hidden="true"></span>
              <span><b>E-wallet</b><small>Simulasi pembayaran, tanpa memasukkan data akun</small></span>
            </label>
          </fieldset>
          <button type="submit" class="btn btn-gold btn-lg w-100">Buat pesanan</button>
        </form>
      </div>
      <aside class="col-lg-5">
        <div class="panel panel--glow summary-card">
          <h2 class="panel__title">Ringkasan pesanan</h2>
          <div class="order-items">${items}</div>
          <div class="summary-line summary-line--total">
            <span>Total pembayaran</span>
            <strong>${formatRupiah(total)}</strong>
          </div>
          <p class="small muted mb-0">Biaya pengiriman dihitung saat pesanan diproses.</p>
          <div class="alert alert-warning mb-0 small" role="note">Mode demo: pesanan dan pembayaran disimulasikan, tidak ada transaksi nyata.</div>
        </div>
      </aside>
    </div>`;
}

function showOrderConfirmation(container, orderId, total, paymentMethod) {
  container.innerHTML = `
    <div class="confirm">
      <svg class="confirm__check" viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24"/><path d="M15 27l7 7 15-15"/></svg>
      <p class="kicker"><b>(Selesai)</b> Pesanan berhasil dibuat</p>
      <h2>Pesananmu sedang diproses</h2>
      <p class="muted">Terima kasih sudah memesan di Kopsteng.</p>
      <div class="order-summary">
        <div class="summary-line"><span>Nomor pesanan</span><strong>${orderId}</strong></div>
        <div class="summary-line"><span>Metode pembayaran</span><strong>${paymentMethod}</strong></div>
        <div class="summary-line"><span>Total</span><strong>${formatRupiah(total)}</strong></div>
      </div>
      <p class="alert alert-info small" role="status">Status: sedang diproses. Ini simulasi checkout, bukan transaksi sungguhan.</p>
      <a class="btn btn-gold" href="produk.html">Kembali ke menu</a>
    </div>`;
}

function renderLayout() {
  const page = document.body.dataset.page;
  const links = [
    { href: "index.html", label: "Beranda", page: "home" },
    { href: "produk.html", label: "Menu", page: "products" },
    { href: "tentang.html", label: "Tentang", page: "about" },
    { href: "kontak.html", label: "Kontak", page: "contact" }
  ];
  const current = (link) => (page === link.page ? ' aria-current="page"' : "");
  const pills = links.map((link) => `<a class="pill" href="${link.href}"${current(link)}>${link.label}</a>`).join("");
  const overlayLinks = [...links, { href: "keranjang.html", label: "Keranjang", page: "cart" }]
    .map((link, index) => `<li><a href="${link.href}"${current(link)}>${link.label}<small>0${index + 1}</small></a></li>`).join("");
  const footerLinks = links.map((link) => `<li><a href="${link.href}">${link.label}</a></li>`).join("");
  const footerMenu = PRODUCTS.slice(0, 4).map((product) => `<li><a href="produk.html">${product.name}</a></li>`).join("");

  document.getElementById("site-header").innerHTML = `
    <a class="skip-link" href="#konten">Lewati ke konten</a>
    <header class="nav">
      <div class="shell nav__inner" data-hero-anim>
        <a class="brand" href="index.html"><span class="logo-badge" aria-hidden="true"><img src="foto kopsteng/logo.webp" alt="" width="512" height="512"></span>Kopsteng</a>
        <nav class="nav__pills" aria-label="Navigasi utama">${pills}</nav>
        <a class="pill cart-btn" href="keranjang.html"${page === "cart" ? ' aria-current="page"' : ""} data-magnetic>
          ${BAG}
          <span class="cart-btn__label">Keranjang</span>
          <span class="cart-badge"><span class="visually-hidden">Isi keranjang: </span><span data-cart-count>0</span></span>
        </a>
        <button class="nav__menu-btn" type="button" aria-expanded="false" aria-controls="mobile-menu"><span>Menu</span><i aria-hidden="true"></i></button>
      </div>
    </header>
    <div class="menu-overlay" id="mobile-menu" inert>
      <nav aria-label="Navigasi utama"><ul>${overlayLinks}</ul></nav>
      <div class="menu-overlay__foot">
        <p class="mb-1"><b>Senin–Sabtu</b> 09.00–23.00</p>
        <p class="mb-0"><b>Minggu</b> 16.00–23.00</p>
      </div>
    </div>`;
  document.getElementById("site-footer").innerHTML = `
    <footer class="site-footer">
      <div class="shell">
        <div class="footer-top">
          <div>
            <p class="footer-tag">Singgah sebentar, <em>betah lebih lama.</em></p>
            <a class="btn btn-gold" href="produk.html" data-magnetic>Lihat menu ${ARROW}</a>
          </div>
          <nav aria-label="Navigasi bawah">
            <h2 class="footer-h">Halaman</h2>
            <ul class="footer-links">${footerLinks}<li><a href="keranjang.html">Keranjang</a></li></ul>
          </nav>
          <div>
            <h2 class="footer-h">Menu andalan</h2>
            <ul class="footer-links">${footerMenu}</ul>
          </div>
          <div>
            <h2 class="footer-h">Jam operasional</h2>
            <ul class="hours" data-hours>
              <li><span>Senin–Sabtu</span><span>09.00–23.00</span></li>
              <li><span>Minggu</span><span>16.00–23.00</span></li>
            </ul>
          </div>
        </div>
        <p class="footer-word" aria-hidden="true"><span>Kopsteng</span></p>
        <div class="footer-bottom">
          <span>© ${new Date().getFullYear()} Kopsteng</span>
          <span>Coffee, comfort food &amp; home cafe</span>
        </div>
      </div>
    </footer>
    <dialog id="photo-lightbox" class="photo-lightbox" aria-label="Pratinjau foto">
      <button type="button" class="photo-lightbox-close" data-close-photo aria-label="Tutup foto"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 3.5l9 9m0-9-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>
      <figure>
        <img alt="">
        <figcaption></figcaption>
      </figure>
    </dialog>
    <div class="toast-k" role="status" aria-live="polite"><span data-toast-text></span><a href="keranjang.html">Lihat keranjang</a></div>`;
}

function updateCartItem(productId, quantity) {
  const cart = loadCart();
  const item = cart.find((entry) => entry.id === productId);
  if (!item) return;

  if (!Number.isInteger(quantity) || quantity < 1) {
    renderCart();
    return;
  }
  item.quantity = quantity;
  saveCart(cart);
  renderCart();
}

function removeCartItem(productId) {
  saveCart(loadCart().filter((item) => item.id !== productId));
  renderCart();
}

/* ---------------------------------------------------------------- navigation chrome (works without GSAP) */
function initNav() {
  const nav = document.querySelector(".nav");
  const button = document.querySelector(".nav__menu-btn");
  const overlay = document.getElementById("mobile-menu");
  const setMenu = (open) => {
    overlay.classList.toggle("is-open", open);
    overlay.inert = !open;
    button.setAttribute("aria-expanded", String(open));
    button.querySelector("span").textContent = open ? "Tutup" : "Menu";
    document.body.classList.toggle("is-locked", open);
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  button.addEventListener("click", () => setMenu(!overlay.classList.contains("is-open")));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) {
      setMenu(false);
      button.focus();
    }
  });
  window.matchMedia("(min-width: 992px)").addEventListener("change", (event) => event.matches && setMenu(false));

  // the nav steps away while reading down and returns on the way up
  let last = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle("is-solid", y > 40);
    if (!overlay.classList.contains("is-open")) nav.classList.toggle("is-hidden", y > last && y > 320);
    last = y;
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  nav.addEventListener("focusin", () => nav.classList.remove("is-hidden"));
}

/* ---------------------------------------------------------------- motion (GSAP + ScrollTrigger + SplitText + Lenis) */
function placeHeroStage() {
  // keep the hotspots on their objects: match the stage to the photo's object-fit: cover box
  const frame = document.querySelector(".hero__frame");
  const stage = frame?.querySelector(".hero__stage");
  const img = frame?.querySelector(".hero__img");
  if (!stage || !img) return;
  const w = frame.offsetWidth;
  const h = frame.offsetHeight;
  const iw = img.naturalWidth || Number(img.getAttribute("width"));
  const ih = img.naturalHeight || Number(img.getAttribute("height"));
  const scale = Math.max(w / iw, h / ih);
  stage.style.inset = "auto"; // first: the shorthand would reset left and top
  Object.assign(stage.style, {
    left: `${(w - iw * scale) / 2}px`,
    top: `${(h - ih * scale) / 2}px`,
    width: `${iw * scale}px`,
    height: `${ih * scale}px`
  });
}

function playIntro(onDone) {
  const html = document.documentElement;
  const intro = document.querySelector(".intro");
  if (!html.classList.contains("intro-on") || !intro) return onDone();
  sessionStorage.setItem("ks-intro", "1");
  lenis?.stop();
  const count = intro.querySelector(".intro__count");
  const letters = intro.querySelectorAll(".intro__word > span");
  const counter = { value: 0 };
  gsap.timeline({ onComplete: () => { html.classList.remove("intro-on"); lenis?.start(); } })
    .from(letters, { yPercent: 115, duration: 1.1, stagger: 0.07, ease: "expo.out" })
    .to(counter, { value: 100, duration: 1.5, ease: "power2.inOut", onUpdate: () => { count.textContent = String(Math.round(counter.value)).padStart(3, "0"); } }, 0)
    .to(intro.querySelector(".intro__bar"), { scaleX: 1, duration: 1.5, ease: "power2.inOut" }, 0)
    .to(letters, { yPercent: -115, duration: 0.7, stagger: 0.04, ease: "expo.in" }, 1.55)
    .to(intro, { yPercent: -100, duration: 1.05, ease: "expo.inOut" }, 1.8)
    .add(onDone, 2.15);
}

function arrive(onDone) {
  const html = document.documentElement;
  const curtain = document.querySelector(".curtain");
  if (!html.classList.contains("is-arriving") || !curtain) return onDone();
  // a long, soft fade; the page's own entrance starts underneath it so the two blend
  gsap.fromTo(curtain, { opacity: 1 }, {
    opacity: 0,
    duration: 1.3,
    ease: "sine.inOut",
    onComplete: () => html.classList.remove("is-arriving")
  });
  gsap.to(curtain.querySelector(".curtain__inner"), { scale: 1.04, duration: 1.3, ease: "sine.inOut" });
  gsap.delayedCall(0.2, onDone);
}

function buildEntrance() {
  const tl = gsap.timeline({ paused: true, defaults: { ease: "expo.out" } });
  const nav = document.querySelector(".nav__inner");
  if (nav) tl.from(nav, { autoAlpha: 0, yPercent: -60, duration: 1.2 }, 0.35);

  const hero = document.querySelector(".hero");
  if (hero) {
    const chars = SplitText.create(hero.querySelector("[data-hero-chars]"), { type: "chars", tag: "span" }).chars;
    tl.fromTo(hero.querySelector(".hero__frame"), { scale: 1.25 }, { scale: 1, duration: 3, ease: "expo.out" }, 0)
      .from(chars, { yPercent: 118, duration: 1.4, stagger: 0.05 }, 0.1)
      .from(hero.querySelector(".hero__title-line--serif > span"), { yPercent: 118, duration: 1.4 }, 0.45)
      .from(hero.querySelectorAll("[data-hero-fade]"), { autoAlpha: 0, y: 30, duration: 1.2, stagger: 0.1 }, 0.8)
      .from(hero.querySelectorAll(".spot__dot"), { scale: 0, duration: 0.9, stagger: 0.25, ease: "back.out(2.2)" }, 1.35)
      .from(hero.querySelectorAll(".spot__line"), { scaleY: 0, duration: 0.8, stagger: 0.25 }, 1.55)
      .from(hero.querySelectorAll(".spot-card"), { autoAlpha: 0, y: 18, filter: "blur(10px)", duration: 1.1, stagger: 0.25 }, 1.7)
      .from(hero.querySelector(".scroll-cue"), { autoAlpha: 0, scale: 0.6, rotate: -90, duration: 1.3 }, 1.2);
  }

  const pageHero = document.querySelector(".page-hero");
  if (pageHero) {
    const title = pageHero.querySelector("[data-split-hero]");
    const lines = SplitText.create(title, { type: "lines", mask: "lines" }).lines;
    tl.from(lines, { yPercent: 115, duration: 1.4, stagger: 0.1 }, 0.1)
      .from(pageHero.querySelectorAll("[data-hero-fade]"), { autoAlpha: 0, y: 26, duration: 1.2, stagger: 0.1 }, 0.4);
  }
  return tl;
}

function initScrollMotion() {
  const mm = gsap.matchMedia();
  const hero = document.querySelector(".hero");

  if (hero) {
    const scrub = { trigger: hero, start: "top top", end: "bottom top", scrub: true };
    gsap.to(".hero__media", { yPercent: 14, ease: "none", scrollTrigger: scrub });
    gsap.to(".hero__title", { yPercent: -30, opacity: 0.15, ease: "none", scrollTrigger: scrub });
    gsap.to(".hero__bottom", { y: -70, opacity: 0, ease: "none", scrollTrigger: { trigger: hero, start: "top top", end: "55% top", scrub: true } });
  }

  // headings rise line by line out of masks
  document.querySelectorAll("[data-split]").forEach((el) => {
    SplitText.create(el, {
      type: "lines",
      mask: "lines",
      autoSplit: true,
      onSplit: (self) => gsap.from(self.lines, { yPercent: 115, duration: 1.3, stagger: 0.09, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 86%", once: true } })
    });
  });

  // the statement fills with light, word by word, as it scrolls through
  document.querySelectorAll("[data-scrub-words]").forEach((el) => {
    SplitText.create(el, {
      type: "words",
      autoSplit: true,
      onSplit: (self) => gsap.fromTo(self.words, { opacity: 0.14 }, { opacity: 1, stagger: 0.1, ease: "none", scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 42%", scrub: true } })
    });
  });

  document.querySelectorAll("[data-reveal]").forEach((el) => {
    gsap.from(el, { autoAlpha: 0, y: 50, duration: 1.3, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
  });
  document.querySelectorAll("[data-reveal-group]").forEach((group) => {
    gsap.from(group.children, { autoAlpha: 0, y: 60, duration: 1.3, stagger: 0.12, ease: "expo.out", scrollTrigger: { trigger: group, start: "top 86%", once: true } });
  });

  // photographs open from the bottom edge and settle
  document.querySelectorAll("[data-clip]").forEach((el) => {
    const img = el.querySelector("img");
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    tl.from(el, { clipPath: "inset(100% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" });
    if (img) tl.from(img, { scale: 1.35, duration: 1.8, ease: "expo.out" }, 0.1);
  });
  document.querySelectorAll("[data-parallax] img").forEach((img) => {
    gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: img.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
  });

  // counters count up once
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = Number(el.dataset.count);
    const pad = Number(el.dataset.pad || 0);
    const counter = { value: 0 };
    el.textContent = String(0).padStart(pad, "0");
    ScrollTrigger.create({
      trigger: el,
      start: "top 90%",
      once: true,
      onEnter: () => gsap.to(counter, { value: end, duration: 1.8, ease: "power3.out", onUpdate: () => { el.textContent = String(Math.round(counter.value)).padStart(pad, "0"); } })
    });
  });

  // home menu: the section holds while the cards ride sideways
  const hmenu = document.querySelector(".hmenu");
  if (hmenu) {
    const track = hmenu.querySelector(".hmenu__track");
    const bar = hmenu.querySelector(".hmenu__progress span");
    const count = hmenu.querySelector(".hmenu__count");
    const total = track.querySelectorAll(".product-card").length;
    mm.add("(min-width: 992px) and (min-height: 680px)", () => {
      hmenu.classList.add("is-pinned");
      const distance = () => Math.max(0, track.scrollWidth - document.documentElement.clientWidth);
      // keyboard: a card that takes focus off to the side is brought into view by scrolling the page
      const onFocus = (event) => {
        const card = event.target.closest(".product-card");
        const trigger = tween.scrollTrigger;
        if (!card || !trigger) return;
        const x = gsap.utils.clamp(0, distance(), card.offsetLeft - (window.innerWidth - card.offsetWidth) / 2);
        lenis ? lenis.scrollTo(trigger.start + x, { duration: 0.8 }) : window.scrollTo(0, trigger.start + x);
      };
      track.addEventListener("focusin", onFocus);
      const tween = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: hmenu,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(bar, { scaleX: 0.08 + self.progress * 0.92 });
            count.textContent = `${String(Math.min(total, 1 + Math.floor(self.progress * total))).padStart(2, "0")} / ${String(total).padStart(2, "0")}`;
          }
        }
      });
      return () => {
        hmenu.classList.remove("is-pinned");
        track.removeEventListener("focusin", onFocus);
      };
    });
  }

  // chapters: each next photograph opens over the last as its words arrive
  const visual = document.querySelector(".chapters__visual");
  if (visual) {
    mm.add("(min-width: 992px)", () => {
      const images = [...visual.querySelectorAll("img")];
      const chapters = [...document.querySelectorAll(".chapter")];
      const number = visual.querySelector("[data-chapter-no]");
      images.forEach((img, i) => {
        if (i === 0) return;
        gsap.fromTo(img, { clipPath: "inset(100% 0% 0% 0%)", scale: 1.2 }, { clipPath: "inset(0% 0% 0% 0%)", scale: 1, ease: "none", scrollTrigger: { trigger: chapters[i], start: "top 90%", end: "top 30%", scrub: true } });
      });
      chapters.forEach((chapter, i) => ScrollTrigger.create({
        trigger: chapter,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: (self) => { if (self.isActive) number.textContent = `${String(i + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`; }
      }));
    });
  }

  // ticker: runs on its own, faster while the page is scrolled, reversing with the scroll
  const tickerTrack = document.querySelector(".ticker__track");
  if (tickerTrack) {
    const loop = gsap.to(tickerTrack, { xPercent: -50, duration: 32, ease: "none", repeat: -1 });
    ScrollTrigger.create({
      trigger: tickerTrack,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const boost = Math.min(Math.abs(self.getVelocity()) / 260, 5);
        gsap.to(loop, { timeScale: self.direction * (1 + boost), duration: 0.25, overwrite: true, onComplete: () => gsap.to(loop, { timeScale: self.direction, duration: 1.2 }) });
      }
    });
  }

  // the footer name rises letter by letter as the page ends
  const footerWord = document.querySelector(".footer-word span");
  if (footerWord) {
    const chars = SplitText.create(footerWord, { type: "chars", tag: "span", charsClass: "fw-char" }).chars;
    gsap.from(chars, { yPercent: 100, stagger: 0.06, ease: "expo.out", scrollTrigger: { trigger: ".footer-word", start: "top 98%", end: "bottom bottom", scrub: 1 } });
  }

  // triggers below the pinned menu were made before it: put them in page order, then measure again
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

function initPointerEffects() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  // the card spotlight follows the pointer
  window.addEventListener("pointermove", (event) => {
    const card = event.target.closest?.(".product-card");
    if (card) {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    }
  }, { passive: true });

  // magnetic buttons lean toward the pointer and spring back
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const my = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    el.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      mx((event.clientX - rect.left - rect.width / 2) * 0.28);
      my((event.clientY - rect.top - rect.height / 2) * 0.38);
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 1, ease: "elastic.out(1, .4)", overwrite: true });
    });
  });
}

function initPageTransitions() {
  const curtain = document.querySelector(".curtain");
  if (!curtain) return;
  document.addEventListener("click", (event) => {
    const link = event.target.closest("a[href]");
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === "_blank" || link.hasAttribute("download") || link.classList.contains("skip-link")) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !/\.html?$|\/$/.test(url.pathname)) return;
    if (url.pathname === window.location.pathname && url.hash) return;
    event.preventDefault();
    sessionStorage.setItem("ks-nav", "1");
    const go = () => { window.location.href = url.href; };
    gsap.fromTo(curtain, { opacity: 0 }, { opacity: 1, duration: 0.8, ease: "sine.inOut", onComplete: go });
    gsap.fromTo(curtain.querySelector(".curtain__inner"), { scale: 0.96 }, { scale: 1, duration: 0.8, ease: "sine.out" });
    window.setTimeout(go, 1000); // a background tab pauses animation frames: never let the click hang
  });
  // back/forward from the page cache: clear the veil again
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) {
      gsap.set(curtain, { opacity: 0 });
      document.documentElement.classList.remove("is-arriving");
    }
  });
}

function initMotion() {
  const html = document.documentElement;
  if (!hasGsap() || reducedMotion()) {
    html.classList.add("motion-ready");
    html.classList.remove("intro-on", "is-arriving");
    return;
  }
  gsap.registerPlugin(ScrollTrigger, SplitText);

  if (typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ lerp: 0.085, wheelMultiplier: 0.95 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener("click", (event) => {
      const link = event.target.closest('a[href^="#"]:not(.skip-link)');
      const target = link && document.querySelector(link.getAttribute("href"));
      if (!target) return;
      event.preventDefault();
      lenis.scrollTo(target, { duration: 1.6 });
    });
    const lightbox = document.getElementById("photo-lightbox");
    new MutationObserver(() => (lightbox.open ? lenis.stop() : lenis.start())).observe(lightbox, { attributes: true, attributeFilter: ["open"] });
  }

  placeHeroStage();
  window.addEventListener("resize", placeHeroStage);
  const entrance = buildEntrance(); // from-states are applied now, before the hidden parts are released
  html.classList.add("motion-ready");
  initScrollMotion();
  initPointerEffects();
  initPageTransitions();

  const start = () => entrance.play();
  if (html.classList.contains("intro-on")) playIntro(start);
  else arrive(start);
  window.addEventListener("load", () => {
    placeHeroStage();
    ScrollTrigger.refresh();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderLayout();
  updateCartCount();
  renderProducts("featured-products", PRODUCTS);
  renderProducts("product-list", PRODUCTS);
  renderPairs();
  renderBoard();
  renderHours();
  renderCart();
  renderCheckout();
  initNav();

  document.addEventListener("click", (event) => {
    const photoButton = event.target.closest("[data-photo-src]");
    if (photoButton) {
      const lightbox = document.getElementById("photo-lightbox");
      lightbox.querySelector("img").src = photoButton.dataset.photoSrc;
      lightbox.querySelector("img").alt = photoButton.dataset.photoAlt;
      lightbox.querySelector("figcaption").textContent = photoButton.dataset.photoAlt;
      lightbox.showModal();
    }

    const closePhotoButton = event.target.closest("[data-close-photo]");
    if (closePhotoButton) {
      document.getElementById("photo-lightbox").close();
    }

    const lightbox = event.target.closest("#photo-lightbox");
    if (lightbox && event.target === lightbox) lightbox.close();

    const addButton = event.target.closest("[data-add-to-cart]");
    if (addButton) {
      const ids = addButton.dataset.addToCart.split(",");
      ids.forEach(addToCart);
      celebrateAdd(addButton, ids);
    }

    const removeButton = event.target.closest("[data-remove-from-cart]");
    if (removeButton) {
      const row = removeButton.closest("[data-cart-row]");
      const remove = () => removeCartItem(removeButton.dataset.removeFromCart);
      if (row?.animate && !reducedMotion()) {
        row.animate([{ opacity: 1, translate: "0 0" }, { opacity: 0, translate: "32px 0" }], { duration: 280, easing: "cubic-bezier(.4, 0, 1, 1)", fill: "forwards" }).finished.then(remove);
      } else {
        remove();
      }
    }
  });

  // the click ripple starts where the button was pressed
  document.addEventListener("pointerdown", (event) => {
    const button = event.target.closest(".btn");
    if (!button) return;
    const rect = button.getBoundingClientRect();
    button.style.setProperty("--rx", `${event.clientX - rect.left}px`);
    button.style.setProperty("--ry", `${event.clientY - rect.top}px`);
  });

  document.addEventListener("keydown", (event) => {
    const lightbox = document.getElementById("photo-lightbox");
    if (event.key === "Escape" && lightbox.open) lightbox.close();
  });

  document.addEventListener("change", (event) => {
    const quantityInput = event.target.closest("[data-cart-quantity]");
    if (quantityInput) updateCartItem(quantityInput.dataset.cartQuantity, Number(quantityInput.value));
  });

  const contactForm = document.getElementById("contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();
      document.getElementById("contact-feedback").innerHTML =
        '<div class="alert alert-success mb-0" role="status">Terima kasih, pesanmu sudah tercatat pada demo ini.</div>';
      contactForm.reset();
    });
  }

  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!checkoutForm.reportValidity()) return;

      const cart = loadCart();
      if (cart.length === 0) {
        renderCheckout();
        return;
      }
      const total = cart.reduce((sum, item) => {
        const product = PRODUCTS.find((entry) => entry.id === item.id);
        return sum + product.price * item.quantity;
      }, 0);
      const formData = new FormData(checkoutForm);
      const paymentMethod = formData.get("payment");
      const orderId = `KS-${Date.now().toString().slice(-8)}`;

      saveCart([]);
      showOrderConfirmation(document.getElementById("checkout-content"), orderId, total, paymentMethod);
    });
  }

  // fonts change line breaks, so the motion waits for them, but never long (the [data-split] headings re-split when they land)
  Promise.race([document.fonts.ready, new Promise((resolve) => setTimeout(resolve, 500))]).then(initMotion);
});
