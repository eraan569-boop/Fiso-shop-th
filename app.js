p import { LiquidNavbar, NimbusIcons } from './liquid-navbar.js';

/* ================= CONFIG ================= */
// Only these 3 emails can register as Owner. Replace with the real addresses.
const OWNER_EMAILS = ['mderan8338@gmail.com', 'owner2@example.com', 'owner3@example.com'];
const OWNER_WA = '+8801356792269';          // default WhatsApp button
const TRIAL_MS = 90 * 864e5;                // 3 months free for new sellers
const CATS = ['All', 'Fashion', 'Electronics', 'Home', 'Beauty', 'Grocery'];

/* ================= HELPERS ================= */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Math.random().toString(36).slice(2, 9);
const ld = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { toast('Storage is full. Remove a product or use fewer images.'); } };
const tk = (n) => '৳' + Number(n).toLocaleString('en-IN');
const when = (t) => new Date(t).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
const art = (h) => 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="hsl(${h},90%,88%)"/><stop offset="1" stop-color="hsl(${h + 30},85%,70%)"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="200" cy="200" r="80" fill="rgba(255,255,255,.55)"/></svg>`);
const stars = (r, n) => `<span class="st">${'★'.repeat(Math.round(r))}${'☆'.repeat(5 - Math.round(r))}<em>${n ? r.toFixed(1) + ' (' + n + ')' : 'No reviews'}</em></span>`;

/* ================= STATE ================= */
let db = ld('fbbd', null) || { users: [], products: [], orders: [], msgs: [], reviews: [], wa: OWNER_WA };
let cart = ld('fbbd_c', []);
let me = ld('fbbd_s', null);
let view = { n: 'home' }, cat = 'All', q = '', draft = [];
const save = () => sv('fbbd', db);
const saveCart = () => sv('fbbd_c', cart);

if (!db.products.length) {
  db.users.push({ id: 'seed', name: 'Fiso Official', email: 'seed@fiso', role: 'admin', wa: OWNER_WA, createdAt: Date.now(), postingEnabled: true, seed: true });
  [['Wireless Earbuds Pro', 1890, 'Electronics', 215], ['Cotton Panjabi — Sky Blue', 1450, 'Fashion', 205], ['Ceramic Mug Set (4)', 690, 'Home', 190], ['Rose Glow Face Serum', 980, 'Beauty', 330], ['Premium Miniket Rice 5kg', 520, 'Grocery', 140], ['Smart Watch Series B', 3250, 'Electronics', 225], ['Linen Throw Pillow', 450, 'Home', 200], ['Leather Crossbody Bag', 2100, 'Fashion', 250]]
    .forEach(([title, price, c, h], i) => db.products.push({ id: 'p' + i, title, price, cat: c, desc: 'Quality checked by the seller. Fast delivery across Bangladesh with cash on delivery arranged directly with the seller.', imgs: [art(h), art(h + 20), art(h - 20)], sellerId: 'seed', at: Date.now() - i * 1e5 }));
  save();
}

const user = () => db.users.find((u) => u.id === me);
const U = (id) => db.users.find((u) => u.id === id);
const P = (id) => db.products.find((p) => p.id === id);
const expiry = (u) => Math.max(u.createdAt + TRIAL_MS, u.paidUntil || 0);
const canPost = (u) => u && (u.role === 'owner' || (u.role === 'admin' && u.postingEnabled !== false && Date.now() < expiry(u)));
const rating = (pid) => { const r = db.reviews.filter((x) => x.pid === pid); return { n: r.length, avg: r.length ? r.reduce((a, b) => a + b.stars, 0) / r.length : 0 }; };
const sellerPending = () => { const u = user(); return u && u.role !== 'customer' ? db.orders.filter((o) => o.sellerId === u.id && o.status === 'pending').length : 0; };
const waNum = (n) => String(n).replace(/\D/g, '');

/* ================= NAV ================= */
const items = [
  { key: 'home', label: 'Home', icon: NimbusIcons.home, fx: 'glow' },
  { key: 'search', label: 'Search', icon: NimbusIcons.search, fx: 'spin' },
  { key: 'post', label: 'Post', icon: NimbusIcons.plus, fx: 'drop' },
  { key: 'messages', label: 'Message', icon: NimbusIcons.message, fx: 'plane' },
  { key: 'account', label: 'Account', icon: NimbusIcons.account, fx: 'wave' },
];
const nav = new LiquidNavbar($('#nav'), {
  items, active: 'home',
  onSelect: (k) => {
    if (k === 'post') {
      const u = user();
      if (!u) { toast('Log in with a seller account to post.'); return go('account'); }
      if (u.role === 'customer') return toast('Posting is for Admin / Seller accounts only.');
      if (!canPost(u)) return toast('Posting is switched off for your account. Contact the Owner.');
    }
    go(k);
  },
});

/* ================= ROUTER ================= */
const PAGES = { home, search, post, messages, account, product, cart };
function go(n, p = {}) { view = { n, ...p }; render(true); }
function render(anim) {
  const v = $('#view');
  document.body.dataset.view = view.n;
  v.innerHTML = PAGES[view.n]();
  if (anim) { v.classList.remove('pg'); void v.offsetWidth; v.classList.add('pg'); scrollTo({ top: 0, behavior: 'instant' }); }
  nav.select(['home', 'search', 'post', 'messages', 'account'].includes(view.n) ? view.n : view.n === 'product' ? 'home' : null);
  chrome(); watch();
}
function chrome() {
  const n = cart.reduce((a, c) => a + c.qty, 0);
  $('#cc').textContent = n; $('#cc').hidden = !n;
  nav.badge('account', sellerPending());
  const u = user(), seller = view.n === 'product' && U(P(view.pid)?.sellerId);
  $('#wa').href = 'https://wa.me/' + waNum(seller?.wa || db.wa);
  $('#side').innerHTML = '<h2>Your cart</h2>' + cartBody(true);
}

/* scroll animations: re-trigger every time an element enters from top or bottom */
const io = new IntersectionObserver((es) => es.forEach((e) => {
  if (e.isIntersecting) e.target.classList.add('in');
  else { e.target.dataset.from = e.boundingClientRect.top < 0 ? 't' : 'b'; e.target.classList.remove('in'); }
}), { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
function watch() { document.querySelectorAll('.reveal').forEach((el, i) => { el.style.setProperty('--d', (i % 4) * 0.06 + 's'); io.observe(el); }); }

/* ================= VIEWS ================= */
function pcard(p) {
  const r = rating(p.id);
  return `<button class="pc glass reveal" data-act="open" data-id="${p.id}"><img src="${p.imgs[0]}" alt="" loading="lazy"><div><h3>${esc(p.title)}</h3>${stars(r.avg, r.n)}<div class="pr" style="padding:0">${tk(p.price)}</div></div></button>`;
}
const chips = () => `<div class="chips reveal">${CATS.map((c) => `<button class="chip ${c === cat ? 'on' : ''}" data-act="cat" data-c="${c}">${c}</button>`).join('')}</div>`;

function home() {
  const list = db.products.filter((p) => cat === 'All' || p.cat === cat);
  const f = db.products[0];
  return `<section class="hero reveal"><div class="hero-t">
      <h1 class="mega">Fiso Bazar BD</h1><p class="sub">Owned by ERAN</p>
      <p class="lead">Shop from trusted sellers across Bangladesh. Add your delivery address, order in one tap, and the seller gets it instantly.</p>
      <div class="row"><button class="btn pri" data-act="go" data-n="search">Browse products</button><button class="btn" data-act="go" data-n="account">Sell on Fiso</button></div></div>
    ${f ? `<button class="hero-card glass" data-act="open" data-id="${f.id}"><img src="${f.imgs[0]}" alt=""><div><h3 class="t">${esc(f.title)}</h3><b style="color:var(--blue)">${tk(f.price)}</b></div></button>` : ''}
  </section>${chips()}<h2 class="reveal">${cat === 'All' ? 'Fresh picks' : cat}</h2>
  <div class="grid">${list.map(pcard).join('') || '<p class="empty">No products in this category yet.</p>'}</div>`;
}

function search() {
  return `<h2 class="reveal">Search</h2><input id="sq" class="reveal" placeholder="Search by name or category" value="${esc(q)}" autofocus>${chips()}<div class="grid" id="sres">${results()}</div>`;
}
function results() {
  const t = q.toLowerCase();
  const l = db.products.filter((p) => (cat === 'All' || p.cat === cat) && (p.title + p.cat + p.desc).toLowerCase().includes(t));
  return l.map(pcard).join('') || '<p class="empty">Nothing matches. Try another word or category.</p>';
}

function product() {
  const p = P(view.pid); if (!p) return home();
  const s = U(p.sellerId), r = rating(p.id), u = user();
  const revs = db.reviews.filter((x) => x.pid === p.id).sort((a, b) => b.at - a.at);
  return `<div class="pdp"><div class="reveal"><div class="gal">${p.imgs.map((i) => `<img src="${i}" alt="">`).join('')}</div>
    ${p.imgs.length > 1 ? `<p class="m" style="margin-top:8px">${p.imgs.length} photos — swipe to see all</p>` : ''}</div>
    <div><div class="reveal"><span class="tag">${p.cat}</span><h2 style="margin-top:10px">${esc(p.title)}</h2>${stars(r.avg, r.n)}
      <div style="font-size:28px;font-weight:800;color:var(--blue);margin:8px 0">${tk(p.price)}</div>
      <p class="m">${esc(p.desc)}</p><p class="m" style="margin-top:8px">Sold by <b>${esc(s?.name || 'Seller')}</b></p></div>
      <div class="pbar glass reveal"><button class="btn" data-act="add" data-id="${p.id}">Add to cart</button><button class="btn pri" data-act="buy" data-id="${p.id}">Order now</button></div>
      <div class="row reveal"><button class="btn sm" data-act="chat" data-id="${p.id}">Message seller</button>
        <a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(s?.wa || db.wa)}">WhatsApp</a></div>
      <h3 class="t reveal" style="margin-top:22px">Ratings and reviews</h3>
      ${u && u.role === 'customer' ? `<div class="card glass reveal"><select id="rs">${[5, 4, 3, 2, 1].map((n) => `<option value="${n}">${'★'.repeat(n)}</option>`).join('')}</select><textarea id="rt" placeholder="Share how this product was"></textarea><button class="btn pri sm" data-act="review" data-id="${p.id}">Post review</button></div>` : '<p class="m reveal">Log in as a customer to leave a review.</p>'}
      ${revs.map((x) => `<div class="card glass reveal"><div class="row sp"><b>${esc(U(x.uid)?.name || 'Customer')}</b><span class="st">${'★'.repeat(x.stars)}</span></div><p class="m">${esc(x.text)}</p></div>`).join('')}
    </div></div>`;
}

function cartBody(compact) {
  if (!cart.length) return '<p class="empty">Your cart is empty.</p>';
  let total = 0;
  const rows = cart.map((c) => { const p = P(c.pid); if (!p) return ''; total += p.price * c.qty;
    return `<div class="line"><img src="${p.imgs[0]}" alt=""><div><b>${esc(p.title)}</b><span class="m">${tk(p.price)}</span></div><div class="qty"><button data-act="qty" data-id="${p.id}" data-d="-1">−</button>${c.qty}<button data-act="qty" data-id="${p.id}" data-d="1">+</button></div></div>`; }).join('');
  return `${rows}<div class="row sp" style="margin:14px 0"><b>Total</b><b style="color:var(--blue)">${tk(total)}</b></div><button class="btn pri" style="width:100%" data-act="checkout">Place order</button>${compact ? '' : '<p class="m" style="margin-top:10px">No payment happens in the app. You and the seller settle payment on delivery.</p>'}`;
}
const cartV = () => `<h2 class="reveal">Cart</h2><div class="card glass reveal">${cartBody(false)}</div>`;
PAGES.cart = cartV;

function post() {
  const u = user();
  if (!canPost(u)) return `<div class="empty card glass">Posting isn't available for this account.</div>`;
  return `<h2 class="reveal">New product</h2><div class="card glass reveal">
    <input id="pt" placeholder="Descriptive title"><input id="pp" type="number" min="1" placeholder="Price (৳)">
    <select id="pc">${CATS.slice(1).map((c) => `<option>${c}</option>`).join('')}</select>
    <textarea id="pd" placeholder="Describe the product: size, colour, condition, delivery time"></textarea>
    <input id="pi" type="file" accept="image/*" multiple>
    <div class="thumbs">${draft.map((d) => `<img src="${d}" alt="">`).join('')}</div>
    <p class="m" style="margin-bottom:10px">${draft.length}/10 images</p>
    <button class="btn pri" data-act="publish">Publish product</button></div>`;
}

function account() {
  const u = user();
  if (!u) return `<div class="cols"><div class="card glass reveal"><h2>Log in</h2>
      <input id="le" type="email" placeholder="Email"><input id="lp" type="password" placeholder="Password">
      <button class="btn pri" data-act="login">Log in</button>
      <div style="text-align:center;margin:12px 0;opacity:0.6;font-size:13px">or</div>
      <button class="btn" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px;background:#fff;color:#111;border:1px solid #ddd" data-act="googleLogin">
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        Continue with Google
      </button></div>
    <div class="card glass reveal"><h2>Create account</h2>
      <select id="rr"><option value="customer">Customer</option><option value="admin">Admin / Seller (3 months free)</option><option value="owner">Owner (3 approved emails only)</option></select>
      <input id="rn" placeholder="Full name"><input id="re" type="email" placeholder="Email"><input id="rp" type="password" placeholder="Password (6+ characters)">
      <input id="rw" type="tel" placeholder="WhatsApp number, e.g. +8801XXXXXXXXX (required for sellers)">
      <button class="btn pri" data-act="register">Create account</button></div></div>`;
  const mine = u.role === 'customer' ? db.orders.filter((o) => o.customerId === u.id) : db.orders.filter((o) => o.sellerId === u.id);
  const days = Math.ceil((expiry(u) - Date.now()) / 864e5);
  return `<div class="card glass reveal"><div class="row sp"><div><h2 style="margin:0">${esc(u.name)}</h2><p class="m">${esc(u.email)} · ${u.role}</p></div><button class="btn sm red" data-act="logout">Log out</button></div>
    ${u.role === 'admin' ? `<p style="margin-top:10px"><span class="tag ${canPost(u) ? 'ok' : 'no'}">${canPost(u) ? 'Posting on · ' + days + ' days left' : 'Posting off'}</span></p><p class="m" style="margin-top:6px">After the free period, renew with the Owner outside the app.</p>` : ''}</div>
  <div class="card glass reveal"><h3 class="t">Delivery location</h3><input id="ad" placeholder="House, road, area, city" value="${esc(u.addr || '')}"><input id="ph" placeholder="Phone for delivery" value="${esc(u.phone || '')}"><button class="btn pri sm" data-act="saveaddr">Save location</button></div>
  ${u.role === 'owner' ? ownerPanel() : ''}
  ${u.role !== 'customer' ? `<h2 class="reveal">My products</h2>${db.products.filter((p) => p.sellerId === u.id).map((p) => `<div class="card glass reveal line"><img src="${p.imgs[0]}" alt=""><div><b>${esc(p.title)}</b>${tk(p.price)}</div><button class="btn sm red" data-act="del" data-id="${p.id}">Delete</button></div>`).join('') || '<p class="m">Tap + to post your first product.</p>'}` : ''}
  <h2 class="reveal">${u.role === 'customer' ? 'My orders' : 'Incoming orders'}</h2>
  ${mine.sort((a, b) => b.at - a.at).map((o) => orderCard(o, u)).join('') || '<p class="empty">No orders yet.</p>'}`;
}
function orderCard(o, u) {
  const p = P(o.pid), c = U(o.customerId);
  const tag = { pending: 'warn', accepted: '', dispatched: '', delivered: 'ok', cancelled: 'no' }[o.status];
  const next = { pending: 'accepted', accepted: 'dispatched', dispatched: 'delivered' }[o.status];
  return `<div class="card glass reveal"><div class="row sp"><b>${esc(p?.title || 'Product')} × ${o.qty}</b><span class="tag ${tag}">${o.status === 'pending' && u.role !== 'customer' ? 'Pending order' : o.status}</span></div>
   <p class="m">${tk((p?.price || 0) * o.qty)} · ${when(o.at)}</p>
   <p class="m"><b>${esc(o.name)}</b> · ${esc(o.phone)}<br>${esc(o.addr)}</p>
   ${u.role !== 'customer' && next ? `<div class="row" style="margin-top:10px"><button class="btn pri sm" data-act="status" data-id="${o.id}" data-s="${next}">Mark ${next}</button>${o.status === 'pending' ? `<button class="btn sm red" data-act="status" data-id="${o.id}" data-s="cancelled">Decline</button>` : ''}<a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(o.phone)}">WhatsApp customer</a></div>` : ''}</div>`;
}
function ownerPanel() {
  const admins = db.users.filter((x) => x.role === 'admin' && !x.seed);
  return `<h2 class="reveal">Owner control</h2><div class="card glass reveal"><h3 class="t">Default WhatsApp button</h3><input id="ow" value="${esc(db.wa)}"><button class="btn sm pri" data-act="setwa">Save</button></div>
  ${admins.map((a) => `<div class="card glass reveal"><div class="row sp"><div><b>${esc(a.name)}</b><p class="m">${esc(a.wa)} · free until ${new Date(expiry(a)).toLocaleDateString()}</p></div><span class="tag ${canPost(a) ? 'ok' : 'no'}">${canPost(a) ? 'Can post' : 'Blocked'}</span></div>
   <div class="row" style="margin-top:10px"><button class="btn sm" data-act="toggle" data-id="${a.id}">${a.postingEnabled === false ? 'Enable' : 'Disable'} posting</button><button class="btn sm" data-act="renew" data-id="${a.id}">Mark renewed (+3 months)</button><a class="btn sm" target="_blank" rel="noopener" href="https://wa.me/${waNum(a.wa)}">WhatsApp</a></div></div>`).join('') || '<p class="m">No seller accounts yet.</p>'}`;
}

function messages() {
  const u = user(); if (!u) return `<div class="empty card glass">Log in to message sellers and customers.<br><br><button class="btn pri" data-act="go" data-n="account">Log in</button></div>`;
  const mineM = db.msgs.filter((m) => m.from === u.id || m.to === u.id);
  if (view.tid) {
    const [pid, cid] = view.tid.split(':'), p = P(pid), other = U(u.id === cid ? p?.sellerId : cid);
    return `<div class="row sp"><h2 class="reveal">${esc(other?.name || 'Chat')}</h2><button class="btn sm" data-act="go" data-n="messages">Back</button></div><p class="m" style="margin-bottom:12px">About: ${esc(p?.title || '')}</p>
      <div id="thread">${db.msgs.filter((m) => m.tid === view.tid).map((m) => `<div class="bub ${m.from === u.id ? 'me' : ''}">${esc(m.text)}</div>`).join('') || '<p class="empty">Say hello to start the conversation.</p>'}</div>
      <div class="row" style="margin-top:12px"><input id="mt" placeholder="Write a message" style="flex:1;margin:0"><button class="btn pri" data-act="send">Send</button></div>`;
  }
  const tids = [...new Set(mineM.map((m) => m.tid))];
  return `<h2 class="reveal">Messages</h2>${tids.map((t) => { const [pid, cid] = t.split(':'), p = P(pid), o = U(u.id === cid ? p?.sellerId : cid), last = mineM.filter((m) => m.tid === t).pop();
    return `<button class="card glass reveal" style="width:100%;text-align:left" data-act="thread" data-t="${t}"><b>${esc(o?.name || 'User')}</b> <span class="m">· ${esc(p?.title || '')}</span><p class="m">${esc(last.text)}</p></button>`; }).join('') || '<p class="empty">No conversations yet. Open a product and tap Message seller.</p>'}`;
}

/* ================= SHEET / TOAST ================= */
function sheet(html) { $('#panel').innerHTML = html; $('#sheet').classList.add('open'); }
const closeSheet = () => $('#sheet').classList.remove('open');
$('#sheet').addEventListener('click', (e) => { if (e.target.id === 'sheet') closeSheet(); });
let tt; function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 3200); }

function checkout(lines) {
  const u = user();
  if (!u) { toast('Log in or create an account to place an order.'); return go('account'); }
  const total = lines.reduce((a, l) => a + P(l.pid).price * l.qty, 0);
  sheet(`<h2>Delivery details</h2><p class="m" style="margin-bottom:12px">${lines.length} item(s) · ${tk(total)} · pay on delivery</p>
    <input id="on" placeholder="Receiver name" value="${esc(u.name)}"><input id="op" placeholder="Phone number" value="${esc(u.phone || '')}">
    <textarea id="oa" placeholder="Full delivery address">${esc(u.addr || '')}</textarea>
    <label class="ck"><input type="checkbox" id="os" checked> Save this location to my profile</label>
    <div class="row"><button class="btn pri" data-act="place">Confirm order</button><button class="btn" data-act="close">Cancel</button></div>`);
  checkout.lines = lines;
}

/* ================= ACTIONS ================= */
const val = (id) => ($('#' + id)?.value || '').trim();
const A = {
  go: (d) => go(d.n),
  close: closeSheet,
  open: (d) => go('product', { pid: d.id }),
  cat: (d) => { cat = d.c; render(); },
  add: (d) => { const c = cart.find((x) => x.pid === d.id); c ? c.qty++ : cart.push({ pid: d.id, qty: 1 }); saveCart(); chrome(); toast('Added to cart'); },
  qty: (d) => { const c = cart.find((x) => x.pid === d.id); c.qty += +d.d; if (c.qty < 1) cart = cart.filter((x) => x !== c); saveCart(); render(); },
  buy: (d) => checkout([{ pid: d.id, qty: 1 }]),
  checkout: () => checkout(cart.map((c) => ({ ...c }))),
  place() {
    const u = user(), name = val('on'), phone = val('op'), addr = val('oa');
    if (!name || !/^\+?\d{8,15}$/.test(phone.replace(/[\s-]/g, '')) || addr.length < 10) return toast('Enter your name, a valid phone number and a full address.');
    checkout.lines.forEach((l) => db.orders.push({ id: uid(), pid: l.pid, qty: l.qty, sellerId: P(l.pid).sellerId, customerId: u.id, name, phone, addr, status: 'pending', at: Date.now() }));
    if ($('#os').checked) { u.addr = addr; u.phone = phone; }
    cart = cart.filter((c) => !checkout.lines.some((l) => l.pid === c.pid)); saveCart(); save(); closeSheet();
    toast('Order placed. The seller has been notified.'); go('account');
  },
  status: (d) => { const o = db.orders.find((x) => x.id === d.id); o.status = d.s; save(); render(); toast('Order ' + d.s); },
  review(d) { const text = val('rt'); if (!text) return toast('Write a few words first.'); db.reviews.push({ id: uid(), pid: d.id, uid: me, stars: +$('#rs').value, text, at: Date.now() }); save(); render(); },
  chat(d) { if (!me) { toast('Log in to message the seller.'); return go('account'); } go('messages', { tid: d.id + ':' + me }); },
  thread: (d) => go('messages', { tid: d.t }),
  send() {
    const t = val('mt'); if (!t) return; const [pid, cid] = view.tid.split(':'), p = P(pid);
    db.msgs.push({ id: uid(), tid: view.tid, from: me, to: me === cid ? p.sellerId : cid, text: t, at: Date.now() }); save(); render(); $('#mt')?.focus();
  },
  register() {
    const role = val('rr'), name = val('rn'), email = val('re').toLowerCase(), pass = val('rp'), wa = val('rw').replace(/[\s-]/g, '');
    if (!name || !/^\S+@\S+\.\S+$/.test(email) || pass.length < 6) return toast('Enter a name, valid email and a 6+ character password.');
    if (db.users.some((x) => x.email === email)) return toast('That email already has an account.');
    if (role === 'admin' && !/^\+?\d{8,15}$/.test(wa)) return toast('Seller accounts need a WhatsApp number, e.g. +8801XXXXXXXXX.');
    if (role === 'owner') {
      if (!OWNER_EMAILS.includes(email)) return toast('This email is not approved for an Owner account.');
      if (db.users.filter((x) => x.role === 'owner').length >= 3) return toast('The 3 Owner accounts are already registered.');
    }
    const u = { id: uid(), name, email, pass: btoa(unescape(encodeURIComponent(pass))), role, wa: role === 'owner' ? db.wa : wa, createdAt: Date.now(), postingEnabled: true };
    db.users.push(u); save(); me = u.id; sv('fbbd_s', me); toast('Welcome to Fiso Bazar BD'); render(true);
  },
  login() {
    const u = db.users.find((x) => x.email === val('le').toLowerCase() && x.pass === btoa(unescape(encodeURIComponent(val('lp')))));
    if (!u) return toast('Email or password is incorrect.');
    me = u.id; sv('fbbd_s', me); render(true);
  },
  async googleLogin() {
    try {
      const { getAuth, GoogleAuthProvider, signInWithPopup } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
      await import('./firebase-config.js');
      const auth = getAuth();
      const res = await signInWithPopup(auth, new GoogleAuthProvider());
      const gUser = res.user;
      const email = gUser.email.toLowerCase();
      let u = db.users.find((x) => x.email === email);
      if (!u) {
        const isOwner = OWNER_EMAILS.includes(email);
        u = {
          id: uid(),
          name: gUser.displayName || email.split('@')[0],
          email,
          pass: '',
          role: isOwner ? 'owner' : 'customer',
          wa: isOwner ? db.wa : '',
          createdAt: Date.now(),
          postingEnabled: true
        };
        db.users.push(u);
        save();
      }
      me = u.id;
      sv('fbbd_s', me);
      toast('Signed in with Google');
      render(true);
    } catch (err) {
      toast('Google sign-in failed: ' + (err?.message || 'Check Firebase config'));
    }
  },
  logout() { me = null; localStorage.removeItem('fbbd_s'); render(true); },
  saveaddr() { const u = user(); u.addr = val('ad'); u.phone = val('ph'); save(); toast('Delivery location saved'); },
  setwa() { db.wa = val('ow'); save(); chrome(); toast('WhatsApp button updated'); },
  toggle(d) { const a = U(d.id); a.postingEnabled = a.postingEnabled === false; save(); render(); },
  renew(d) { const a = U(d.id); a.paidUntil = Math.max(Date.now(), expiry(a)) + TRIAL_MS; a.postingEnabled = true; save(); render(); toast('Renewal recorded'); },
  del(d) { db.products = db.products.filter((p) => p.id !== d.id); save(); render(); },
  publish() {
    const title = val('pt'), price = +val('pp'), desc = val('pd');
    if (!canPost(user())) return toast('Posting is off for your account.');
    if (title.length < 6 || !price || desc.length < 10 || !draft.length) return toast('Add a descriptive title, price, description and at least one image.');
    db.products.unshift({ id: uid(), title, price, cat: val('pc'), desc, imgs: draft.slice(0, 10), sellerId: me, at: Date.now() });
    draft = []; save(); toast('Product published'); go('home');
  },
};
document.addEventListener('click', (e) => { const t = e.target.closest('[data-act]'); if (t) A[t.dataset.act]?.(t.dataset, t); });

/* live search */
document.addEventListener('input', (e) => {
  if (e.target.id === 'sq') { q = e.target.value; $('#sres').innerHTML = results(); watch(); }
  if (e.target.id === 'hq') { q = e.target.value; if (view.n !== 'search') go('search'); else { $('#sres').innerHTML = results(); watch(); } }
});

/* image upload: resize to keep storage small, max 10 */
document.addEventListener('change', async (e) => {
  if (e.target.id !== 'pi') return;
  for (const f of [...e.target.files]) {
    if (draft.length >= 10) { toast('Maximum 10 images'); break; }
    draft.push(await shrink(f));
  }
  const keep = ['pt', 'pp', 'pd', 'pc'].map((i) => val(i)); render();
  ['pt', 'pp', 'pd', 'pc'].forEach((id, i) => { if ($('#' + id)) $('#' + id).value = keep[i]; });
});
const shrink = (f) => new Promise((res) => {
  const r = new FileReader();
  r.onload = () => { const im = new Image(); im.onload = () => { const s = Math.min(1, 640 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = im.width * s; c.height = im.height * s; c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .72)); }; im.src = r.result; };
  r.readAsDataURL(f);
});

/* cross-tab sync so sellers see new orders and messages */
addEventListener('storage', (e) => { if (e.key === 'fbbd') { db = ld('fbbd', db); if (['messages', 'account'].includes(view.n)) render(); else chrome(); } });
addEventListener('resize', () => nav.sync());

render(true);
