(function () {
  const STORE_KEY = "bastio-active-store-v5";

  const defaultState = {
    config: {
      storeName: "BÁSTIO ACTIVE",
      whatsapp: "5511993534133",
      instagram: "https://instagram.com/bastioactive",
      heroPrincipal: "hero-premium-run.png",
      heroText: "Peças que unem performance, conforto e identidade.",
      slideStrength: "slide-strength.png",
      slideGroup: "slide-group.png",
      slideInspire: "slide-inspire.png",
      lookAcademia: "slide-strength.png",
      lookCorrida: "hero-premium-run.png",
      lookLifestyle: "slide-group.png",
      lookRecuperacao: "slide-inspire.png"
    },
    promo: {
      banner: "2 peças com desconto",
      text: "Monte seu look do drop de lançamento com condição especial via WhatsApp.",
      link: "catalogo.html?categoria=Outlet",
      image: "slide-group.png"
    },
    products: [
      {
        id: "legging-detalhe-premium",
        name: "Legging com detalhe premium",
        description: "Legging de cintura alta com recorte alongado e detalhe champagne para um visual sofisticado.",
        price: 289,
        salePrice: 229,
        category: "Leggings",
        tags: ["novidades", "destaques"],
        mainImage: "product-legging-premium.png",
        gallery: ["product-legging-premium.png", "hero-premium-run.png", "slide-inspire.png"],
        sizes: ["PP", "P", "M", "G"],
        colors: ["Preto com champagne", "Preto", "Areia"],
        installments: 6,
        active: true
      },
      {
        id: "conjunto-vies-sofisticado",
        name: "Conjunto com viés sofisticado",
        description: "Top e legging com acabamento em viés contrastante, desenho limpo e presença premium.",
        price: 429,
        salePrice: 349,
        category: "Conjuntos",
        tags: ["novidades", "destaques"],
        mainImage: "product-conjunto-vies.png",
        gallery: ["product-conjunto-vies.png", "slide-group.png", "slide-strength.png"],
        sizes: ["PP", "P", "M", "G", "GG"],
        colors: ["Preto com champagne", "Marinho profundo", "Cinza quente"],
        installments: 6,
        active: true
      },
      {
        id: "short-bolso-funcional",
        name: "Short com bolso funcional",
        description: "Short de treino com cintura confortável, bolso lateral discreto e acabamento elegante.",
        price: 199,
        salePrice: 139,
        category: "Shorts",
        tags: ["novidades", "outlet"],
        mainImage: "product-short-bolso.png",
        gallery: ["product-short-bolso.png", "slide-inspire.png", "hero-premium-run.png"],
        sizes: ["PP", "P", "M", "G"],
        colors: ["Preto", "Areia", "Cinza quente"],
        installments: 6,
        active: true
      },
      {
        id: "top-motion",
        name: "Top Motion",
        description: "Top estruturado com acabamento limpo, sustentação confortável e toque premium.",
        price: 169,
        salePrice: 119,
        category: "Tops",
        tags: ["destaques", "outlet"],
        mainImage: "product-top-motion.png",
        gallery: ["product-top-motion.png", "slide-strength.png", "product-conjunto-vies.png"],
        sizes: ["PP", "P", "M", "G"],
        colors: ["Preto", "Off-white", "Champagne"],
        installments: 6,
        active: true
      },
      {
        id: "macacao-aura",
        name: "Macacão Aura",
        description: "Macacão de linhas alongadas, compressão suave e elegância para studio e lifestyle.",
        price: 359,
        salePrice: 299,
        category: "Macacões",
        tags: ["novidades", "destaques"],
        mainImage: "product-macacao-aura.png",
        gallery: ["product-macacao-aura.png", "slide-group.png", "hero-premium-run.png"],
        sizes: ["P", "M", "G"],
        colors: ["Preto", "Areia", "Champagne"],
        installments: 6,
        active: true
      },
      {
        id: "corta-vento-run",
        name: "Corta-Vento Run",
        description: "Camada leve para corrida e deslocamentos, com textura macia e proteção elegante.",
        price: 419,
        salePrice: 299,
        category: "Corta-Ventos",
        tags: ["destaques", "outlet"],
        mainImage: "product-corta-vento-run.png",
        gallery: ["product-corta-vento-run.png", "slide-inspire.png", "hero-premium-run.png"],
        sizes: ["P", "M", "G", "GG"],
        colors: ["Preto", "Cinza quente", "Champagne"],
        installments: 6,
        active: true
      }
    ],
    cart: []
  };

  const clone = (value) => JSON.parse(JSON.stringify(value));

  function readState() {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) {
      localStorage.setItem(STORE_KEY, JSON.stringify(defaultState));
      return clone(defaultState);
    }

    try {
      const parsed = JSON.parse(raw);
      return {
        ...clone(defaultState),
        ...parsed,
        config: { ...defaultState.config, ...(parsed.config || {}) },
        promo: { ...defaultState.promo, ...(parsed.promo || {}) },
        products: Array.isArray(parsed.products) ? parsed.products : clone(defaultState.products),
        cart: Array.isArray(parsed.cart) ? parsed.cart : []
      };
    } catch {
      localStorage.setItem(STORE_KEY, JSON.stringify(defaultState));
      return clone(defaultState);
    }
  }

  function saveState(state) {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent("bastio-store-updated"));
  }

  function getState() {
    return readState();
  }

  function reset() {
    saveState(clone(defaultState));
    return getState();
  }

  function assetUrl(image) {
    if (!image) return "assets/hero-premium-run.png";
    if (/^(https?:)?\/\//.test(image) || image.startsWith("data:")) return image;
    if (image.startsWith("assets/")) return image;
    return `assets/${image}`;
  }

  function normalizePhone(phone) {
    return String(phone || "").replace(/\D/g, "");
  }

  function formatCurrency(value) {
    return Number(value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  function normalizeText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function matchesSearch(product, search) {
    const term = normalizeText(search);
    if (!term) return true;
    return [product.name, product.description, product.category, ...(product.tags || [])]
      .map(normalizeText)
      .some((value) => value.includes(term));
  }

  function getProducts({ includeInactive = false, category = "Todos", tag = "", search = "" } = {}) {
    const state = getState();
    return state.products.filter((product) => {
      const active = includeInactive || product.active;
      const tags = product.tags || [];
      const categoryMatch =
        category === "Todos" || category === "Feminino" || product.category === category || tags.includes(category.toLowerCase());
      const tagMatch = !tag || tags.includes(tag);
      return active && categoryMatch && tagMatch && matchesSearch(product, search);
    });
  }

  function findProduct(id) {
    return getState().products.find((product) => product.id === id);
  }

  function productPrice(product) {
    return Number(product.salePrice || product.price || 0);
  }

  function discountPercent(product) {
    const price = Number(product.price || 0);
    const salePrice = Number(product.salePrice || 0);
    if (!price || !salePrice || salePrice >= price) return 0;
    return Math.round(((price - salePrice) / price) * 100);
  }

  function pixPrice(product) {
    return productPrice(product) * 0.95;
  }

  function installmentValue(product) {
    const installments = Number(product.installments || 6);
    return productPrice(product) / installments;
  }

  function upsertProduct(product) {
    const state = getState();
    const id =
      product.id ||
      String(product.name || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const nextProduct = {
      ...product,
      id,
      tags: Array.isArray(product.tags) ? product.tags : [],
      gallery: Array.isArray(product.gallery) ? product.gallery : [],
      sizes: Array.isArray(product.sizes) ? product.sizes : [],
      colors: Array.isArray(product.colors) ? product.colors : [],
      installments: Number(product.installments || 6)
    };
    const index = state.products.findIndex((item) => item.id === id);
    if (index >= 0) {
      state.products[index] = nextProduct;
    } else {
      state.products.push(nextProduct);
    }
    saveState(state);
    return nextProduct;
  }

  function deleteProduct(id) {
    const state = getState();
    state.products = state.products.filter((product) => product.id !== id);
    state.cart = state.cart.filter((item) => item.productId !== id);
    saveState(state);
  }

  function setConfig(config) {
    const state = getState();
    state.config = { ...state.config, ...config };
    saveState(state);
  }

  function setPromo(promo) {
    const state = getState();
    state.promo = { ...state.promo, ...promo };
    saveState(state);
  }

  function addToCart({ productId, color, size, quantity = 1 }) {
    const product = findProduct(productId);
    if (!product) return;
    const state = getState();
    const itemKey = `${productId}__${color}__${size}`;
    const existing = state.cart.find((item) => item.key === itemKey);
    if (existing) {
      existing.quantity += Number(quantity || 1);
    } else {
      state.cart.push({
        key: itemKey,
        productId,
        color,
        size,
        quantity: Number(quantity || 1)
      });
    }
    saveState(state);
  }

  function updateCartItem(key, quantity) {
    const state = getState();
    const nextQuantity = Math.max(1, Number(quantity || 1));
    state.cart = state.cart.map((item) => (item.key === key ? { ...item, quantity: nextQuantity } : item));
    saveState(state);
  }

  function removeFromCart(key) {
    const state = getState();
    state.cart = state.cart.filter((item) => item.key !== key);
    saveState(state);
  }

  function clearCart() {
    const state = getState();
    state.cart = [];
    saveState(state);
  }

  function cartDetails() {
    const state = getState();
    const items = state.cart
      .map((item) => {
        const product = findProduct(item.productId);
        if (!product) return null;
        const unitPrice = productPrice(product);
        return {
          ...item,
          product,
          unitPrice,
          total: unitPrice * Number(item.quantity || 1)
        };
      })
      .filter(Boolean);
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const count = items.reduce((sum, item) => sum + Number(item.quantity || 1), 0);
    return { items, subtotal, count };
  }

  function productUrl(productId) {
    const origin = window.location.origin || "";
    const path = `${window.location.pathname.replace(/\/[^/]*$/, "/")}produto.html?id=${productId}`;
    return `${origin}${path}`;
  }

  function productMessage(product, options) {
    return `Olá, tenho interesse neste produto da BÁSTIO ACTIVE:

Produto: ${product.name}
Cor: ${options.color}
Tamanho: ${options.size}
Quantidade: ${options.quantity}

Link do produto:
${productUrl(product.id)}

Gostaria de finalizar a compra.`;
  }

  function cartMessage() {
    const details = cartDetails();
    const list = details.items
      .map(
        (item) =>
          `- ${item.product.name} | Cor: ${item.color} | Tamanho: ${item.size} | Qtd: ${item.quantity} | ${formatCurrency(item.total)}`
      )
      .join("\n");
    return `Olá, quero finalizar meu pedido:

Itens:

${list || "Nenhum item selecionado."}

Subtotal:
${formatCurrency(details.subtotal)}

Nome:
Cidade:
CEP:`;
  }

  function whatsappUrl(message) {
    const phone = normalizePhone(getState().config.whatsapp);
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  }

  window.BastioStore = {
    STORE_KEY,
    defaultState: clone(defaultState),
    getState,
    saveState,
    reset,
    assetUrl,
    formatCurrency,
    getProducts,
    findProduct,
    productPrice,
    discountPercent,
    pixPrice,
    installmentValue,
    upsertProduct,
    deleteProduct,
    setConfig,
    setPromo,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    cartDetails,
    productMessage,
    cartMessage,
    whatsappUrl
  };
})();
