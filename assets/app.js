(function () {
  const Store = window.BastioStore;
  const page = document.body.dataset.page;
  const FAVORITES_KEY = "bastio-active-favorites-v1";
  const categories = ["Feminino", "Leggings", "Tops", "Conjuntos", "Shorts", "Macacões", "Corta-Ventos", "Outlet"];
  const params = new URLSearchParams(window.location.search);
  let activeCategory = params.get("categoria") || "Todos";
  let activeSearch = params.get("busca") || "";
  let favoritesOnly = params.get("favoritos") === "1";

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function readFavorites() {
    try {
      const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  }

  function saveFavorites(ids) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  }

  function isFavorite(productId) {
    return readFavorites().includes(productId);
  }

  function toggleFavorite(productId) {
    const favorites = readFavorites();
    const next = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    saveFavorites(next);
    updateFavorites();
  }

  function updateFavorites() {
    const favorites = readFavorites();
    document.querySelectorAll("[data-favorite-count]").forEach((node) => {
      node.textContent = String(favorites.length);
    });
    document.querySelectorAll("[data-favorite-toggle]").forEach((button) => {
      const active = favorites.includes(button.dataset.favoriteToggle);
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.textContent = active ? "♥" : "♡";
    });
  }

  function renderHeader() {
    const header = document.querySelector("[data-header]");
    if (!header) return;
    const state = Store.getState();
    header.innerHTML = `
      <a class="brand" href="index.html#top" aria-label="${escapeHtml(state.config.storeName)}">
        <img src="assets/logo-ba.svg" alt="" width="42" height="42" />
        <span>${escapeHtml(state.config.storeName)}</span>
      </a>
      <nav class="nav" aria-label="Categorias" data-nav>
        ${categories
          .map((category) => `<a href="catalogo.html?categoria=${encodeURIComponent(category)}">${escapeHtml(category)}</a>`)
          .join("")}
      </nav>
      <div class="header-actions">
        <form class="search-form" role="search" data-search-form>
          <input name="busca" type="search" placeholder="Buscar produto" aria-label="Buscar produto" value="${escapeHtml(activeSearch)}" />
          <button type="submit" aria-label="Buscar">Buscar</button>
        </form>
        <a class="header-tool" href="admin.html">Conta</a>
        <button class="header-tool" type="button" data-favorites-open>
          Favoritos <span data-favorite-count>0</span>
        </button>
        <button class="cart-button" type="button" data-cart-toggle>
          Sacola <span data-cart-count>0</span>
        </button>
        <button class="menu-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" data-menu-toggle>
          <span></span>
          <span></span>
        </button>
      </div>
    `;
  }

  function createCart() {
    if (document.querySelector("[data-cart-drawer]")) return;
    document.body.insertAdjacentHTML(
      "beforeend",
      `
      <div class="cart-backdrop" data-cart-close></div>
      <aside class="cart-drawer" data-cart-drawer aria-label="Carrinho">
        <div class="cart-head">
          <h2>Sacola</h2>
          <button class="cart-close" type="button" data-cart-close aria-label="Fechar carrinho">×</button>
        </div>
        <div class="cart-items" data-cart-items></div>
        <div class="cart-foot">
          <div class="subtotal"><span>Subtotal</span><strong data-cart-subtotal>R$ 0,00</strong></div>
          <div class="cart-actions">
            <button class="button secondary" type="button" data-cart-clear>Limpar</button>
            <a class="button primary" href="#" target="_blank" rel="noreferrer" data-cart-checkout>Finalizar pedido</a>
          </div>
        </div>
      </aside>`
    );
  }

  function updateCart() {
    const details = Store.cartDetails();
    document.querySelectorAll("[data-cart-count]").forEach((node) => {
      node.textContent = String(details.count);
    });
    const list = document.querySelector("[data-cart-items]");
    const subtotal = document.querySelector("[data-cart-subtotal]");
    const checkout = document.querySelector("[data-cart-checkout]");
    if (subtotal) subtotal.textContent = Store.formatCurrency(details.subtotal);
    if (checkout) checkout.href = Store.whatsappUrl(Store.cartMessage());
    if (!list) return;
    if (!details.items.length) {
      list.innerHTML = `<p class="empty-state">Sua sacola está vazia.</p>`;
      return;
    }
    list.innerHTML = details.items
      .map(
        (item) => `
        <article class="cart-item">
          <img src="${Store.assetUrl(item.product.mainImage)}" alt="" />
          <div>
            <h3>${escapeHtml(item.product.name)}</h3>
            <p>${escapeHtml(item.color)} · ${escapeHtml(item.size)}</p>
            <div class="cart-row">
              <input class="qty-control" type="number" min="1" value="${item.quantity}" data-cart-qty="${escapeHtml(item.key)}" aria-label="Quantidade" />
              <strong>${Store.formatCurrency(item.total)}</strong>
            </div>
            <button class="remove-button" type="button" data-cart-remove="${escapeHtml(item.key)}">Remover</button>
          </div>
        </article>`
      )
      .join("");
  }

  function priceBlock(product) {
    const price = Store.productPrice(product);
    const installments = Number(product.installments || 6);
    const oldPrice = Store.discountPercent(product)
      ? `<span class="old-price">${Store.formatCurrency(product.price)}</span>`
      : "";
    return `
      <div class="price-stack">
        <div class="price-row">${oldPrice}<strong class="current-price">${Store.formatCurrency(price)}</strong></div>
        <span class="pix-price">${Store.formatCurrency(Store.pixPrice(product))} no Pix</span>
        <span class="installments">ou até ${installments}x de ${Store.formatCurrency(Store.installmentValue(product))}</span>
      </div>
    `;
  }

  function productCard(product) {
    const discount = Store.discountPercent(product);
    const favorite = isFavorite(product.id);
    return `
      <article class="product-card${product.active ? "" : " inactive"}" data-product-card="${escapeHtml(product.id)}">
        <div class="product-media">
          <a class="product-image" href="produto.html?id=${encodeURIComponent(product.id)}">
            <img src="${Store.assetUrl(product.mainImage)}" alt="${escapeHtml(product.name)}" />
          </a>
          ${discount ? `<span class="discount-badge">${discount}% OFF</span>` : ""}
          <button class="favorite-button${favorite ? " is-active" : ""}" type="button" data-favorite-toggle="${escapeHtml(product.id)}" aria-label="Favoritar ${escapeHtml(product.name)}" aria-pressed="${favorite ? "true" : "false"}">${favorite ? "♥" : "♡"}</button>
        </div>
        <div class="product-copy">
          <p class="product-category">${escapeHtml(product.category)}</p>
          <h3>${escapeHtml(product.name)}</h3>
          <p>${escapeHtml(product.description)}</p>
        </div>
        ${priceBlock(product)}
        <div class="product-controls">
          <label class="field">Cor
            <select data-product-color>${product.colors.map((color) => `<option>${escapeHtml(color)}</option>`).join("")}</select>
          </label>
          <label class="field">Tamanho
            <select data-product-size>${product.sizes.map((size) => `<option>${escapeHtml(size)}</option>`).join("")}</select>
          </label>
        </div>
        <div class="product-actions">
          <button class="button primary" type="button" data-buy-now="${escapeHtml(product.id)}">Comprar</button>
          <button class="button secondary" type="button" data-add-to-cart="${escapeHtml(product.id)}">Adicionar à sacola</button>
          <a class="text-link" href="produto.html?id=${encodeURIComponent(product.id)}">Ver produto</a>
        </div>
      </article>
    `;
  }

  function gridProducts(grid) {
    const tab = grid.dataset.tab || "";
    const category = grid.dataset.category || activeCategory;
    const search = grid.dataset.search || activeSearch;
    const categoryFilter = category === "Outlet" ? "Todos" : category;
    let products = Store.getProducts({ category: categoryFilter, search, tag: tab });
    if (category === "Outlet") {
      products = products.filter((product) => (product.tags || []).includes("outlet"));
    }
    if (favoritesOnly) {
      const favorites = readFavorites();
      products = products.filter((product) => favorites.includes(product.id));
    }
    return products;
  }

  function renderProducts(category) {
    if (category) activeCategory = category;
    document.querySelectorAll("[data-product-grid]").forEach((grid) => {
      const limit = Number(grid.dataset.limit || 0);
      let products = gridProducts(grid);
      if (limit) products = products.slice(0, limit);
      grid.innerHTML = products.length
        ? products.map(productCard).join("")
        : `<p class="empty-state catalog-empty">Nenhum produto encontrado.</p>`;
    });
    syncCatalogTools();
    updateFavorites();
  }

  function applyHomeConfig() {
    if (page !== "home") return;
    const config = Store.getState().config;
    const slides = Array.from(document.querySelectorAll("[data-slide]"));
    const slideImages = [config.heroPrincipal, config.slideGroup, config.slideStrength];
    slides.forEach((slide, index) => {
      if (slideImages[index]) {
        slide.style.setProperty("--hero-image", `url("${Store.assetUrl(slideImages[index])}")`);
      }
    });
    const firstText = slides[0]?.querySelector(".hero-copy p");
    if (firstText && config.heroText) firstText.textContent = config.heroText;

    const lookImages = [config.lookAcademia, config.lookCorrida, config.lookLifestyle, config.lookRecuperacao];
    document.querySelectorAll(".look-card").forEach((card, index) => {
      if (lookImages[index]) {
        card.style.setProperty("--look-image", `url("${Store.assetUrl(lookImages[index])}")`);
      }
    });
  }

  function applyPromoConfig() {
    const promo = Store.getState().promo;
    const block = document.querySelector("[data-promo-block]");
    if (!block) return;
    block.style.setProperty("--promo-image", `url("${Store.assetUrl(promo.image)}")`);
    const title = block.querySelector("[data-promo-title]");
    const text = block.querySelector("[data-promo-text]");
    const link = block.querySelector("[data-promo-link]");
    if (title) title.textContent = promo.banner;
    if (text) text.textContent = promo.text;
    if (link) link.href = promo.link || "catalogo.html";
  }

  function selectedOptions(productId) {
    const card = document.querySelector(`[data-product-card="${CSS.escape(productId)}"]`);
    const detail = document.querySelector("[data-product-detail]");
    const scope = card || detail || document;
    return {
      color: scope.querySelector("[data-product-color]")?.value || "Preto",
      size: scope.querySelector("[data-product-size]")?.value || "M",
      quantity: Number(scope.querySelector("[data-product-qty]")?.value || 1)
    };
  }

  function buyProduct(productId) {
    const product = Store.findProduct(productId);
    if (!product) return;
    const options = selectedOptions(productId);
    window.open(Store.whatsappUrl(Store.productMessage(product, options)), "_blank", "noopener,noreferrer");
  }

  function renderProductDetail() {
    const target = document.querySelector("[data-product-detail]");
    if (!target) return;
    const id = new URLSearchParams(window.location.search).get("id") || "legging-detalhe-premium";
    const product = Store.findProduct(id);
    if (!product) {
      target.innerHTML = `<div class="page-hero"><h1>Produto não encontrado</h1><p>Volte ao catálogo para escolher outra peça.</p><a class="button primary" href="catalogo.html">Ver catálogo</a></div>`;
      return;
    }
    const gallery = [product.mainImage, ...(product.gallery || [])].filter(Boolean);
    const discount = Store.discountPercent(product);
    document.title = `${product.name} | BÁSTIO ACTIVE`;
    target.innerHTML = `
      <div>
        <div class="detail-image">
          <img src="${Store.assetUrl(product.mainImage)}" alt="${escapeHtml(product.name)}" />
          ${discount ? `<span class="discount-badge">${discount}% OFF</span>` : ""}
        </div>
        <div class="gallery">
          ${gallery
            .slice(0, 4)
            .map((image) => `<button class="gallery-thumb" type="button" data-gallery-image="${escapeHtml(image)}"><img src="${Store.assetUrl(image)}" alt="" /></button>`)
            .join("")}
        </div>
      </div>
      <div class="detail-copy" data-product-card="${escapeHtml(product.id)}">
        <p class="section-label">${escapeHtml(product.category)}</p>
        <div class="detail-title-row">
          <h1>${escapeHtml(product.name)}</h1>
          <button class="favorite-button detail-favorite" type="button" data-favorite-toggle="${escapeHtml(product.id)}" aria-label="Favoritar ${escapeHtml(product.name)}" aria-pressed="false">♡</button>
        </div>
        <p>${escapeHtml(product.description)}</p>
        ${priceBlock(product)}
        <div class="detail-controls">
          <label class="field">Cor
            <select data-product-color>${product.colors.map((color) => `<option>${escapeHtml(color)}</option>`).join("")}</select>
          </label>
          <label class="field">Tamanho
            <select data-product-size>${product.sizes.map((size) => `<option>${escapeHtml(size)}</option>`).join("")}</select>
          </label>
          <label class="field">Quantidade
            <input data-product-qty type="number" min="1" value="1" />
          </label>
        </div>
        <div class="detail-actions">
          <button class="button primary" type="button" data-buy-now="${escapeHtml(product.id)}">COMPRAR PELO WHATSAPP</button>
          <button class="button secondary" type="button" data-add-to-cart="${escapeHtml(product.id)}">ADICIONAR À SACOLA</button>
        </div>
      </div>
    `;
    updateFavorites();
  }

  function setupSlider() {
    const slides = Array.from(document.querySelectorAll("[data-slide]"));
    const dots = document.querySelector("[data-slider-dots]");
    if (!slides.length || !dots) return;
    let index = 0;
    dots.innerHTML = slides
      .map((_, dotIndex) => `<button class="slider-dot${dotIndex === 0 ? " is-active" : ""}" type="button" data-slide-dot="${dotIndex}" aria-label="Slide ${dotIndex + 1}"></button>`)
      .join("");
    const dotButtons = Array.from(dots.querySelectorAll("[data-slide-dot]"));
    const show = (nextIndex) => {
      index = nextIndex;
      slides.forEach((slide, slideIndex) => slide.classList.toggle("is-active", slideIndex === index));
      dotButtons.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === index));
    };
    dots.addEventListener("click", (event) => {
      const button = event.target.closest("[data-slide-dot]");
      if (button) show(Number(button.dataset.slideDot));
    });
    window.setInterval(() => show((index + 1) % slides.length), 6200);
  }

  function syncCatalogTools() {
    document.querySelectorAll("[data-category]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.category === activeCategory);
    });
    document.querySelectorAll("[data-favorites-open]").forEach((button) => {
      button.classList.toggle("is-active", favoritesOnly);
    });
  }

  function bindEvents() {
    document.addEventListener("submit", (event) => {
      const form = event.target.closest("[data-search-form]");
      if (!form) return;
      event.preventDefault();
      const data = new FormData(form);
      activeSearch = String(data.get("busca") || "").trim();
      favoritesOnly = false;
      if (page === "catalog") {
        activeCategory = "Todos";
        renderProducts();
        return;
      }
      const query = activeSearch ? `?busca=${encodeURIComponent(activeSearch)}` : "";
      window.location.href = `catalogo.html${query}`;
    });

    document.addEventListener("click", (event) => {
      const menuToggle = event.target.closest("[data-menu-toggle]");
      if (menuToggle) {
        const nav = document.querySelector("[data-nav]");
        const isOpen = nav?.classList.toggle("is-open") ?? false;
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Fechar menu" : "Abrir menu");
      }

      if (event.target.closest("[data-nav] a")) {
        document.querySelector("[data-nav]")?.classList.remove("is-open");
      }

      const tab = event.target.closest("[data-product-tab]");
      if (tab) {
        const tabScope = tab.closest("section") || document;
        tabScope.querySelectorAll("[data-product-tab]").forEach((node) => node.classList.remove("is-active"));
        tab.classList.add("is-active");
        tabScope.querySelectorAll("[data-product-grid][data-tab]").forEach((grid) => {
          grid.dataset.tab = tab.dataset.productTab;
        });
        renderProducts();
      }

      const favorite = event.target.closest("[data-favorite-toggle]");
      if (favorite) {
        event.preventDefault();
        toggleFavorite(favorite.dataset.favoriteToggle);
        renderProducts();
      }

      const favoritesOpen = event.target.closest("[data-favorites-open]");
      if (favoritesOpen) {
        if (page !== "catalog") {
          window.location.href = "catalogo.html?favoritos=1";
          return;
        }
        favoritesOnly = !favoritesOnly;
        activeCategory = "Todos";
        renderProducts();
      }

      const add = event.target.closest("[data-add-to-cart]");
      if (add) {
        const productId = add.dataset.addToCart;
        Store.addToCart({ productId, ...selectedOptions(productId) });
        updateCart();
        document.body.classList.add("cart-open");
      }

      const buy = event.target.closest("[data-buy-now]");
      if (buy) buyProduct(buy.dataset.buyNow);

      if (event.target.closest("[data-cart-toggle]")) document.body.classList.add("cart-open");
      if (event.target.closest("[data-cart-close]")) document.body.classList.remove("cart-open");

      const remove = event.target.closest("[data-cart-remove]");
      if (remove) {
        Store.removeFromCart(remove.dataset.cartRemove);
        updateCart();
      }

      if (event.target.closest("[data-cart-clear]")) {
        Store.clearCart();
        updateCart();
      }

      const gallery = event.target.closest("[data-gallery-image]");
      if (gallery) {
        const img = document.querySelector(".detail-image img");
        if (img) img.src = Store.assetUrl(gallery.dataset.galleryImage);
      }

      const whatsapp = event.target.closest("[data-whatsapp-store]");
      if (whatsapp) {
        whatsapp.href = Store.whatsappUrl("Olá, gostaria de atendimento da BÁSTIO ACTIVE.");
      }

      const filter = event.target.closest("[data-category]");
      if (filter) {
        favoritesOnly = false;
        activeSearch = "";
        activeCategory = filter.dataset.category;
        document.querySelectorAll("[data-search-form] input").forEach((input) => {
          input.value = "";
        });
        renderProducts(activeCategory);
      }
    });

    document.addEventListener("change", (event) => {
      const qty = event.target.closest("[data-cart-qty]");
      if (qty) {
        Store.updateCartItem(qty.dataset.cartQty, qty.value);
        updateCart();
      }
    });

    window.addEventListener("scroll", () => {
      document.querySelector("[data-header]")?.classList.toggle("is-scrolled", window.scrollY > 12);
    });

    window.addEventListener("bastio-store-updated", () => {
      updateCart();
      updateFavorites();
      applyHomeConfig();
      applyPromoConfig();
      if (page === "catalog" || page === "home") renderProducts();
    });
  }

  renderHeader();
  createCart();
  applyHomeConfig();
  applyPromoConfig();
  renderProducts();
  renderProductDetail();
  setupSlider();
  bindEvents();
  updateCart();
  updateFavorites();
})();
