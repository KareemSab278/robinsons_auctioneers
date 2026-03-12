const API = 'http://192.168.0.190:3000/products';

function showMsg(text, type) {
  const el = document.getElementById('msg');
  el.textContent = text;
  el.className = type;
  clearTimeout(el._t);
  el._t = setTimeout(() => { el.className = ''; el.style.display = 'none'; }, 3500);
}

async function api(method, url, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res;
}

async function loadProducts() {
  const res = await api('GET', API);
  const products = await res.json();
  renderTable(products);
}

function renderTable(products) {
  const tbody = document.getElementById('product-list');
  tbody.innerHTML = '';
  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:1.5rem">No products yet.</td></tr>';
    return;
  }
  products.forEach(p => tbody.appendChild(buildRow(p)));
}

function buildRow(p) {
  const tr = document.createElement('tr');
  tr.dataset.id = p.product_id;
  tr.innerHTML = `
    <td>${p.product_id}</td>
    <td>${esc(p.product_name)}</td>
    <td>${esc(p.product_category)}</td>
    <td>$${p.product_price.toFixed(2)}</td>
    <td><span class="avail-badge ${p.product_availability ? 'avail-yes' : 'avail-no'}">${p.product_availability ? 'Yes' : 'No'}</span></td>
    <td class="actions">
      <button class="btn-edit" onclick="startEdit(this, ${p.product_id}, '${esc(p.product_name)}', '${esc(p.product_category)}', ${p.product_price}, ${p.product_availability})">Edit</button>
      <button class="btn-delete" onclick="deleteProduct(${p.product_id})">Delete</button>
    </td>`;
  return tr;
}

function startEdit(btn, id, name, cat, price, avail) {
  const tr = btn.closest('tr');
  tr.innerHTML = `
    <td>${id}</td>
    <td><input class="edit-input" id="e-name" value="${esc(name)}" /></td>
    <td><input class="edit-input" id="e-cat"  value="${esc(cat)}"  /></td>
    <td><input class="edit-input" id="e-price" type="number" min="0" step="0.01" value="${price}" style="width:90px" /></td>
    <td><input type="checkbox" id="e-avail" ${avail ? 'checked' : ''} /></td>
    <td class="actions">
      <button class="btn-save"   onclick="saveEdit(${id})">Save</button>
      <button class="btn-cancel" onclick="loadProducts()">Cancel</button>
    </td>`;
}

async function saveEdit(id) {
  const body = {
    product_name:         document.getElementById('e-name').value.trim(),
    product_category:     document.getElementById('e-cat').value.trim(),
    product_price:        parseFloat(document.getElementById('e-price').value),
    product_availability: document.getElementById('e-avail').checked,
  };
  if (!body.product_name || !body.product_category || isNaN(body.product_price)) {
    showMsg('Please fill in all fields.', 'error'); return;
  }
  try {
    await api('PUT', `${API}/${id}`, body);
    showMsg('Product updated.', 'success');
    loadProducts();
  } catch (e) { showMsg('Update failed: ' + e.message, 'error'); }
}

async function deleteProduct(id) {
  if (!confirm(`Delete product #${id}?`)) return;
  try {
    await api('DELETE', `${API}/${id}`);
    showMsg('Product deleted.', 'success');
    loadProducts();
  } catch (e) { showMsg('Delete failed: ' + e.message, 'error'); }
}

document.getElementById('add-form').addEventListener('submit', async e => {
  e.preventDefault();
  const body = {
    product_name:         document.getElementById('new-name').value.trim(),
    product_category:     document.getElementById('new-cat').value.trim(),
    product_price:        parseFloat(document.getElementById('new-price').value),
    product_availability: document.getElementById('new-avail').checked,
  };
  try {
    await api('POST', API, body);
    showMsg('Product added.', 'success');
    e.target.reset();
    document.getElementById('new-avail').checked = true;
    loadProducts();
  } catch (err) { showMsg('Add failed: ' + err.message, 'error'); }
});

function esc(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

loadProducts();
