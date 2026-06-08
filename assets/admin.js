(function () {
  const Store = window.BastioStore;

  function fillForm(form, values) {
    Object.entries(values).forEach(([key, value]) => {
      const field = form.elements[key];
      if (!field) return;
      if (field.type === "checkbox") {
        field.checked = Boolean(value);
      } else if (Array.isArray(value)) {
        field.value = value.join(", ");
      } else {
        field.value = value ?? "";
      }
    });
  }

  function arrayValue(value) {
    return String(value || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function loadSettings() {
    const state = Store.getState();
    const settingsForm = document.querySelector("[data-settings-form]");
    const promoForm = document.querySelector("[data-promo-form]");
    if (settingsForm) fillForm(settingsForm, state.config);
    if (promoForm) fillForm(promoForm, state.promo);
  }

  function renderProducts() {
    const list = document.querySelector("[data-admin-products]");
    if (!list) return;
    const products = Store.getProducts({ includeInactive: true });
    list.innerHTML = products
      .map(
        (product) => `
        <article class="admin-item">
          <div>
            <strong>${product.name}</strong>
            <p>${product.category} · ${Store.formatCurrency(product.price)} / ${Store.formatCurrency(Store.productPrice(product))} · ${(product.tags || []).join(", ")} · ${product.active ? "ativo" : "inativo"}</p>
          </div>
          <div class="admin-actions">
            <button class="button secondary" type="button" data-edit-product="${product.id}">Editar</button>
            <button class="button secondary" type="button" data-toggle-product="${product.id}">${product.active ? "Desativar" : "Ativar"}</button>
            <button class="button danger" type="button" data-delete-product="${product.id}">Excluir</button>
          </div>
        </article>`
      )
      .join("");
  }

  function clearProductForm() {
    const form = document.querySelector("[data-product-form]");
    if (!form) return;
    form.reset();
    form.elements.id.value = "";
    form.elements.installments.value = "6";
    form.elements.active.checked = true;
  }

  function bind() {
    const settingsForm = document.querySelector("[data-settings-form]");
    const promoForm = document.querySelector("[data-promo-form]");
    const productForm = document.querySelector("[data-product-form]");

    settingsForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(settingsForm);
      Store.setConfig(Object.fromEntries(data.entries()));
      loadSettings();
    });

    promoForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(promoForm);
      Store.setPromo(Object.fromEntries(data.entries()));
      loadSettings();
    });

    productForm?.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = new FormData(productForm);
      Store.upsertProduct({
        id: String(data.get("id") || "").trim(),
        name: String(data.get("name") || "").trim(),
        description: String(data.get("description") || "").trim(),
        price: Number(data.get("price") || 0),
        salePrice: Number(data.get("salePrice") || 0) || "",
        category: String(data.get("category") || "").trim(),
        tags: arrayValue(data.get("tags")).map((tag) => tag.toLowerCase()),
        installments: Number(data.get("installments") || 6),
        mainImage: String(data.get("mainImage") || "").trim(),
        gallery: arrayValue(data.get("gallery")),
        sizes: arrayValue(data.get("sizes")),
        colors: arrayValue(data.get("colors")),
        active: data.get("active") === "on"
      });
      clearProductForm();
      renderProducts();
    });

    document.addEventListener("click", (event) => {
      if (event.target.closest("[data-new-product]")) clearProductForm();

      const edit = event.target.closest("[data-edit-product]");
      if (edit) {
        const product = Store.findProduct(edit.dataset.editProduct);
        if (product && productForm) {
          fillForm(productForm, {
            ...product,
            tags: product.tags || [],
            gallery: product.gallery || [],
            sizes: product.sizes || [],
            colors: product.colors || [],
            installments: product.installments || 6
          });
          productForm.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }

      const toggle = event.target.closest("[data-toggle-product]");
      if (toggle) {
        const product = Store.findProduct(toggle.dataset.toggleProduct);
        if (product) {
          Store.upsertProduct({ ...product, active: !product.active });
          renderProducts();
        }
      }

      const remove = event.target.closest("[data-delete-product]");
      if (remove) {
        Store.deleteProduct(remove.dataset.deleteProduct);
        renderProducts();
      }

      if (event.target.closest("[data-reset-store]")) {
        Store.reset();
        loadSettings();
        clearProductForm();
        renderProducts();
      }
    });
  }

  loadSettings();
  clearProductForm();
  renderProducts();
  bind();
})();
