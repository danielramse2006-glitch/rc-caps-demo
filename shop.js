const products = [
  { id: 'nocturna', name: 'Nocturna Negra', category: 'Cerradas', color: 'Negro', price: 499, sizes: ['7', '7 ⅛', '7 ¼'], frame: '0% 0%' },
  { id: 'diamante', name: 'Diamante Marino', category: 'Cerradas', color: 'Azul marino', price: 549, sizes: ['7 ⅛', '7 ¼', '7 ⅜'], frame: '100% 0%' },
  { id: 'cobre', name: 'Doble Tono Cobre', category: 'Cerradas', color: 'Café / cobre', price: 499, sizes: ['7', '7 ¼', '7 ⅜', '7 ½'], frame: '0% 100%' },
  { id: 'trucker', name: 'Trucker Vino', category: 'Trucker', color: 'Crudo / vino', price: 299, sizes: ['Única'], frame: '100% 100%' },
];
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
const format = value => money.format(value);
const sizeOptions = ['7', '7 ⅛', '7 ¼', '7 ⅜', '7 ½', 'Única'];
const grid = document.querySelector('#product-grid');
const sizes = document.querySelector('#sizes');
const sort = document.querySelector('#sort');
const query = document.querySelector('#query');
const resultCount = document.querySelector('#result-count');
const productDialog = document.querySelector('#product-dialog');
const bagDialog = document.querySelector('#bag-dialog');
const bagContent = document.querySelector('#bag-detail');
const status = document.querySelector('#status');
const cart = new Map();
let category = 'Todas';
let size = '';

function photo(product) {
  return `<span class="photo" role="img" aria-label="Gorra de muestra, ${product.color}" style="--frame:${product.frame}"></span>`;
}

function setCategory(value) {
  category = value;
  document.querySelectorAll('[data-category]').forEach(button => {
    const selected = button.dataset.category === value;
    button.classList.toggle('current', selected);
    button.setAttribute('aria-pressed', selected);
  });
  document.querySelectorAll('[name="fit"]').forEach(input => { input.checked = input.value === value; });
  render();
}

function render() {
  const search = query.value.trim().toLocaleLowerCase('es-MX');
  const visible = products.filter(product => {
    const fit = category === 'Todas' || product.category === category || (category === 'Ajustables' && product.category === 'Trucker');
    return fit && (!size || product.sizes.includes(size)) &&
      `${product.name} ${product.category} ${product.color}`.toLocaleLowerCase('es-MX').includes(search);
  });
  if (sort.value === 'price-asc') visible.sort((a, b) => a.price - b.price);
  if (sort.value === 'price-desc') visible.sort((a, b) => b.price - a.price);
  if (sort.value === 'name') visible.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  resultCount.textContent = `${visible.length} ${visible.length === 1 ? 'modelo' : 'modelos'}`;
  grid.innerHTML = visible.length ? visible.map(product => `
    <article class="product">
      <button class="product-open" type="button" data-product="${product.id}" aria-label="Ver ${product.name}">
        ${photo(product)}
        <div class="product-meta">
          <p>${product.category === 'Cerradas' ? 'Cerrada' : 'Trucker ajustable'} · ${product.color}</p>
          <h3>${product.name}</h3>
          <strong>${format(product.price)} MXN</strong>
        </div>
      </button>
    </article>`).join('') : '<p class="empty">No hay modelos con esos filtros.</p>';
}

function updateBagCount() {
  document.querySelector('#bag-count').textContent = [...cart.values()].reduce((sum, item) => sum + item.quantity, 0);
}

function openProduct(product) {
  const detail = document.querySelector('#product-detail');
  detail.innerHTML = `${photo(product)}<form class="detail-copy">
    <p class="muted">${product.category} · ${product.color}</p>
    <h2 id="product-name">${product.name}</h2>
    <p>${format(product.price)} MXN <span class="muted">· precio demo</span></p>
    <label>Talla <select name="size">${product.sizes.map(option => `<option>${option}</option>`).join('')}</select></label>
    <button class="solid" type="submit">Agregar a la bolsa</button>
    </form>`;
  const select = detail.querySelector('select');
  if (product.sizes.includes(size)) select.value = size;
  detail.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    const chosen = select.value;
    const key = `${product.id}|${chosen}`;
    const item = cart.get(key) ?? { product, size: chosen, quantity: 0 };
    item.quantity++;
    cart.set(key, item);
    updateBagCount();
    productDialog.close();
    openBag();
  });
  productDialog.showModal();
}

function subtotal() {
  return [...cart.values()].reduce((total, item) => total + item.product.price * item.quantity, 0);
}

function renderBag() {
  bagContent.innerHTML = cart.size ? `
    ${[...cart.entries()].map(([key, item]) => `
      <div class="bag-row"><div><strong>${item.product.name}</strong><small>Talla ${item.size} · ${item.quantity} pza.</small></div>
      <button class="text-button" type="button" data-remove="${key}" aria-label="Quitar una ${item.product.name}">Quitar</button></div>`).join('')}
    <p class="bag-total"><span>Subtotal de muestra</span><strong>${format(subtotal())} MXN</strong></p>
    <button id="checkout" type="button" class="solid">Simular pedido</button>` : '<p>Tu bolsa está vacía.</p>';
}

function openBag() {
  renderBag();
  bagDialog.showModal();
}

function showCheckout() {
  bagContent.innerHTML = `<form class="checkout">
    <p>Prueba el cálculo de envío con un código postal de ejemplo. No se solicitan datos personales.</p>
    <label for="postal">Código postal de ejemplo</label>
    <input id="postal" inputmode="numeric" pattern="[0-9]{5}" maxlength="5" value="80000" required>
    <button class="solid" type="submit">Ver total simulado</button>
  </form><button type="button" class="text-button" id="back-bag">Volver a la bolsa</button><p class="checkout-note" id="checkout-result" role="status"></p>`;
  const form = bagContent.querySelector('form');
  const result = document.querySelector('#checkout-result');
  form.addEventListener('input', () => { result.textContent = ''; });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const exampleShipping = 99;
    const total = subtotal() + exampleShipping;
    result.innerHTML = `<p>Envío nacional de ejemplo: ${format(exampleShipping)} MXN.</p>
      <p>Total simulado: <strong>${format(total)} MXN</strong></p>
      <button class="solid" id="simulate-payment" type="button">Simular pago</button>`;
  });
}

sizes.innerHTML = sizeOptions.map(option => `<button type="button" data-size="${option}" aria-pressed="false">${option}</button>`).join('');
sizes.addEventListener('click', event => {
  const target = event.target.closest('[data-size]');
  if (!target) return;
  size = size === target.dataset.size ? '' : target.dataset.size;
  sizes.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', button.dataset.size === size));
  render();
});
document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => setCategory(button.dataset.category)));
document.querySelectorAll('[name="fit"]').forEach(input => input.addEventListener('change', () => setCategory(input.value)));
document.querySelector('#reset').addEventListener('click', () => {
  size = '';
  query.value = '';
  sort.value = 'default';
  sizes.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', false));
  setCategory('Todas');
});
sort.addEventListener('change', render);
query.addEventListener('input', render);
document.querySelector('#search-panel').addEventListener('submit', event => { event.preventDefault(); render(); });
document.querySelector('#search-toggle').addEventListener('click', event => {
  const panel = document.querySelector('#search-panel');
  panel.hidden = !panel.hidden;
  event.currentTarget.setAttribute('aria-expanded', !panel.hidden);
  if (!panel.hidden) query.focus();
});
document.querySelector('#filter-toggle').addEventListener('click', event => {
  const expanded = document.querySelector('#filters').classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', expanded);
  event.currentTarget.querySelector('span').textContent = expanded ? '−' : '+';
});
grid.addEventListener('click', event => {
  const trigger = event.target.closest('[data-product]');
  if (trigger) openProduct(products.find(product => product.id === trigger.dataset.product));
});
document.querySelectorAll('[data-featured]').forEach(button => {
  button.addEventListener('click', () => openProduct(products.find(product => product.id === button.dataset.featured)));
});
document.querySelector('#bag').addEventListener('click', openBag);
bagContent.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.id === 'checkout') showCheckout();
  if (button.id === 'back-bag') renderBag();
  if (button.id === 'simulate-payment') {
    cart.clear();
    updateBagCount();
    bagContent.innerHTML = '<p role="status">Pedido de demostración completado. La simulación no generó un cobro ni un envío.</p>';
  }
  const key = button.dataset.remove;
  if (key && cart.has(key)) {
    const item = cart.get(key);
    item.quantity--;
    if (!item.quantity) cart.delete(key);
    updateBagCount();
    renderBag();
    status.textContent = 'Bolsa actualizada';
  }
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
});
render();
