// =============================================
//  AURCUS ONLINE — script.js
//  P2P Platinum Marketplace + Auth System
// =============================================

/* ---- PARTICLES ---- */
(function spawnParticles() {
  const container = document.getElementById('particles');
  if (!container) return;
  for (let i = 0; i < 35; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.cssText = `
      left: ${Math.random() * 100}%;
      width: ${Math.random() < 0.5 ? 2 : 3}px;
      height: ${Math.random() < 0.5 ? 2 : 3}px;
      animation-duration: ${8 + Math.random() * 14}s;
      animation-delay: ${-Math.random() * 20}s;
      opacity: ${0.3 + Math.random() * 0.4};
    `;
    container.appendChild(p);
  }
})();

/* ---- STATE ---- */
let currentUser = JSON.parse(localStorage.getItem('aurcus_user')) || null;
let listings    = JSON.parse(localStorage.getItem('aurcus_listings')) || seedListings();
let users       = JSON.parse(localStorage.getItem('aurcus_users')) || {};
let chats       = JSON.parse(localStorage.getItem('aurcus_chats')) || {};
let activeChatListing = null;
let selectedAvatar = '⚔️';
let selectedStars  = 0;

function saveAll() {
  localStorage.setItem('aurcus_listings', JSON.stringify(listings));
  localStorage.setItem('aurcus_users', JSON.stringify(users));
  localStorage.setItem('aurcus_chats', JSON.stringify(chats));
  if (currentUser) localStorage.setItem('aurcus_user', JSON.stringify(currentUser));
}

/* ---- SEED DEMO LISTINGS ---- */
function seedListings() {
  return [
    {
      id: 'seed1',
      seller: 'DarkLord_99',
      avatar: '💀',
      verified: true,
      amount: 1000,
      price: 8,
      desc: 'Fast delivery, same day. Safe in-game trade.',
      reviews: [{user:'IronSmith_X', stars:5, comment:'Fast and legit!'}],
      trades: 2341,
      createdAt: Date.now() - 86400000
    },
    {
      id: 'seed2',
      seller: 'RuneMaster',
      avatar: '🧙',
      verified: true,
      amount: 500,
      price: 9,
      desc: 'Middleman accepted. Reputable seller.',
      reviews: [{user:'NightWarden', stars:5, comment:'Super reliable!'}],
      trades: 943,
      createdAt: Date.now() - 43200000
    },
    {
      id: 'seed3',
      seller: 'StormArrow',
      avatar: '🏹',
      verified: false,
      amount: 250,
      price: 7,
      desc: 'Small batch, quick delivery.',
      reviews: [],
      trades: 45,
      createdAt: Date.now() - 3600000
    }
  ];
}

/* ============================================
   HAMBURGER / DRAWER
============================================ */
const hamburger     = document.getElementById('hamburger');
const drawer        = document.getElementById('drawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const drawerClose   = document.getElementById('drawerClose');

function openDrawer()  {
  drawer.classList.add('open');
  drawerOverlay.classList.add('open');
  hamburger.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeDrawer() {
  drawer.classList.remove('open');
  drawerOverlay.classList.remove('open');
  hamburger.classList.remove('active');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);
document.querySelectorAll('.drawer-item').forEach(item =>
  item.addEventListener('click', () => setTimeout(closeDrawer, 200))
);

/* ============================================
   COUNTER ANIMATION
============================================ */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800, step = 16;
  let current = 0;
  const increment = target / (duration / step);
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); }
    else el.textContent = Math.floor(current).toLocaleString();
  }, step);
}
const statNums = document.querySelectorAll('.stat-num');
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) { animateCounter(entry.target); observer.unobserve(entry.target); }
  });
}, { threshold: 0.5 });
statNums.forEach(n => observer.observe(n));

/* ---- COUNTDOWN ---- */
(function startCountdown() {
  const el = document.getElementById('countdown');
  if (!el) return;
  let h = 23, m = 59, s = 59;
  setInterval(() => {
    s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 23; m = 59; s = 59; }
    el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }, 1000);
})();

/* ---- SCROLL REVEAL ---- */
const revealEls = document.querySelectorAll('.section-block, .card, .help-card, .seller-row, .rank-row, .event-card');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      entry.target.style.animation = `fadeUp 0.5s ${i * 0.05}s ease both`;
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });
revealEls.forEach(el => revealObs.observe(el));

/* ============================================
   MODAL HELPERS
============================================ */
function openModal(id)  { document.getElementById(id).classList.add('open'); document.body.style.overflow='hidden'; }
function closeModal(id) { document.getElementById(id).classList.remove('open'); document.body.style.overflow=''; }

document.getElementById('openAuthModal').addEventListener('click', () => {
  if (currentUser) openUserPanel(); else openModal('authModal');
});
document.getElementById('closeAuthModal').addEventListener('click', () => closeModal('authModal'));
document.getElementById('closeUserPanel').addEventListener('click', () => closeModal('userPanel'));
document.getElementById('closeCreateListing').addEventListener('click', () => closeModal('createListingModal'));
document.getElementById('closeChatModal').addEventListener('click', () => closeModal('chatModal'));
document.getElementById('closeReviewModal').addEventListener('click', () => closeModal('reviewModal'));

// Close on backdrop click
['authModal','userPanel','createListingModal','chatModal','reviewModal'].forEach(id => {
  document.getElementById(id).addEventListener('click', (e) => {
    if (e.target.id === id) closeModal(id);
  });
});

/* ---- AUTH TABS ---- */
document.querySelectorAll('.modal-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.modal-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

/* ---- AVATAR PICKER ---- */
document.querySelectorAll('.avatar-opt').forEach(opt => {
  opt.addEventListener('click', () => {
    document.querySelectorAll('.avatar-opt').forEach(o => o.classList.remove('selected'));
    opt.classList.add('selected');
    selectedAvatar = opt.dataset.av;
  });
});

/* ============================================
   AUTH — REGISTER & LOGIN
============================================ */
document.getElementById('registerBtn').addEventListener('click', () => {
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const msg = document.getElementById('registerMsg');

  if (!username || username.length < 3) return showMsg(msg, '⚠ Username must be at least 3 characters.', 'error');
  if (!password || password.length < 6) return showMsg(msg, '⚠ Password must be at least 6 characters.', 'error');
  if (users[username]) return showMsg(msg, '⚠ Username already taken.', 'error');

  const newUser = { username, password, avatar: selectedAvatar, role: 'member', trades: 0, rating: 0, ratingCount: 0, platinum: 0, isSeller: false, history: [] };
  users[username] = newUser;
  currentUser = newUser;
  saveAll();
  updateNavBtn();
  closeModal('authModal');
  openUserPanel();
  showMsg(msg, '✅ Account created!', 'success');
});

document.getElementById('loginBtn').addEventListener('click', () => {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msg = document.getElementById('loginMsg');

  const u = users[username];
  if (!u) return showMsg(msg, '⚠ User not found.', 'error');
  if (u.password !== password) return showMsg(msg, '⚠ Wrong password.', 'error');

  currentUser = u;
  saveAll();
  updateNavBtn();
  closeModal('authModal');
  openUserPanel();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  currentUser = null;
  localStorage.removeItem('aurcus_user');
  updateNavBtn();
  closeModal('userPanel');
});

function updateNavBtn() {
  const btn = document.getElementById('openAuthModal');
  if (currentUser) {
    btn.textContent = currentUser.avatar + ' ' + currentUser.username;
    btn.style.borderColor = 'var(--gold)';
    btn.style.color = 'var(--gold)';
  } else {
    btn.textContent = '👤 Login / Register';
    btn.style.borderColor = '';
    btn.style.color = '';
  }
}

function openUserPanel() {
  if (!currentUser) return;
  const u = users[currentUser.username] || currentUser;
  document.getElementById('panelAvatar').textContent = u.avatar;
  document.getElementById('panelName').textContent = u.username;
  document.getElementById('panelRole').textContent = u.isSeller ? '🏪 Seller' : '👤 Member';
  document.getElementById('panelTrades').textContent = u.trades;
  document.getElementById('panelPlatinum').textContent = u.platinum;
  const avgRating = u.ratingCount > 0 ? (u.rating / u.ratingCount).toFixed(1) : '—';
  document.getElementById('panelRating').textContent = avgRating === '—' ? '—' : '⭐' + avgRating;

  if (u.isSeller) {
    document.getElementById('becomeSellerSection').style.display = 'none';
    document.getElementById('sellerDashboard').style.display = 'block';
    renderMyListings();
  } else {
    document.getElementById('becomeSellerSection').style.display = 'block';
    document.getElementById('sellerDashboard').style.display = 'none';
  }
  openModal('userPanel');
}

function openUserPanelOrAuth(e) {
  e.preventDefault();
  if (currentUser) openUserPanel(); else openModal('authModal');
}

/* ============================================
   BECOME SELLER
============================================ */
document.getElementById('becomeSellerBtn').addEventListener('click', () => {
  if (!currentUser) return;
  users[currentUser.username].isSeller = true;
  currentUser.isSeller = true;
  saveAll();
  // Animate transition
  document.getElementById('becomeSellerSection').style.display = 'none';
  document.getElementById('sellerDashboard').style.display = 'block';
  document.getElementById('panelRole').textContent = '🏪 Seller';
  renderMyListings();
  showToast('🏪 Seller mode activated!');
});

/* ============================================
   CREATE LISTING
============================================ */
document.getElementById('openCreateListing').addEventListener('click', () => {
  closeModal('userPanel');
  openModal('createListingModal');
});

document.getElementById('submitListing').addEventListener('click', () => {
  if (!currentUser) return;
  const amount = parseInt(document.getElementById('listingAmount').value);
  const price  = parseInt(document.getElementById('listingPrice').value);
  const desc   = document.getElementById('listingDesc').value.trim();
  const msg    = document.getElementById('listingMsg');

  if (!amount || amount < 1) return showMsg(msg, '⚠ Enter a valid amount.', 'error');
  if (!price  || price < 1)  return showMsg(msg, '⚠ Enter a valid price.', 'error');

  const u = users[currentUser.username];
  const listing = {
    id: 'lst_' + Date.now(),
    seller: currentUser.username,
    avatar: currentUser.avatar,
    verified: u.trades >= 10,
    amount, price,
    desc: desc || 'No description provided.',
    reviews: [],
    trades: u.trades,
    createdAt: Date.now()
  };

  listings.unshift(listing);
  saveAll();
  renderListings();
  closeModal('createListingModal');
  document.getElementById('listingAmount').value = '';
  document.getElementById('listingPrice').value = '';
  document.getElementById('listingDesc').value = '';
  showToast('💎 Listing published!');
});

/* ============================================
   RENDER LISTINGS
============================================ */
function renderListings(filter = 'all') {
  const grid = document.getElementById('listingsGrid');
  const noMsg = document.getElementById('noListingsMsg');
  let list = [...listings];

  if (filter === 'verified') list = list.filter(l => l.verified);
  if (filter === 'cheap')    list = list.sort((a,b) => a.price - b.price);
  if (filter === 'most')     list = list.sort((a,b) => b.amount - a.amount);

  if (list.length === 0) {
    grid.innerHTML = '';
    noMsg.style.display = 'block';
    return;
  }
  noMsg.style.display = 'none';

  grid.innerHTML = list.map(l => {
    const avgStars = l.reviews.length > 0
      ? (l.reviews.reduce((s,r) => s + r.stars, 0) / l.reviews.length).toFixed(1)
      : null;
    const starsDisplay = avgStars ? `⭐ ${avgStars} (${l.reviews.length})` : '<span style="opacity:.4">No reviews yet</span>';
    const isOwn = currentUser && currentUser.username === l.seller;
    const verifiedBadge = l.verified ? '<span class="badge-verified">✅ Verified</span>' : '';
    const tradeBadge = l.trades >= 100
      ? '<span class="badge-gold">★ GOLD</span>'
      : l.trades >= 10
      ? '<span class="badge-silver">✦ SILVER</span>'
      : '<span class="badge-new">🆕 NEW</span>';

    return `
      <div class="listing-card" data-id="${l.id}">
        <div class="listing-header">
          <div class="listing-seller-info">
            <span class="listing-avatar">${l.avatar}</span>
            <div>
              <span class="listing-seller">${l.seller}</span>
              <div class="listing-badges">${verifiedBadge}${tradeBadge}</div>
            </div>
          </div>
          <div class="listing-price-block">
            <span class="listing-price">${l.price} pts</span>
            <span class="listing-price-label">per unit</span>
          </div>
        </div>
        <div class="listing-amount">💎 ${l.amount.toLocaleString()} Platinum available</div>
        <div class="listing-total">Total: ${(l.amount * l.price).toLocaleString()} pts</div>
        <p class="listing-desc">${l.desc}</p>
        <div class="listing-reviews-summary">${starsDisplay}</div>
        <div class="listing-actions">
          ${!isOwn ? `<button class="btn-chat" onclick="openChat('${l.id}')">💬 Chat & Buy</button>` : '<span class="own-listing-label">Your listing</span>'}
          ${!isOwn && currentUser ? `<button class="btn-review" onclick="openReview('${l.id}')">⭐ Review</button>` : ''}
          ${isOwn ? `<button class="btn-delete" onclick="deleteListing('${l.id}')">🗑 Delete</button>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

/* ---- FILTER BUTTONS ---- */
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderListings(btn.dataset.filter);
  });
});

/* ---- DELETE LISTING ---- */
function deleteListing(id) {
  listings = listings.filter(l => l.id !== id);
  saveAll();
  renderListings();
  showToast('🗑 Listing removed.');
}

/* ---- MY LISTINGS ---- */
function renderMyListings() {
  const container = document.getElementById('myListings');
  const mine = listings.filter(l => currentUser && l.seller === currentUser.username);
  if (mine.length === 0) {
    container.innerHTML = '<p style="font-size:.8rem;color:#5a7a90;margin-top:12px;">No listings yet. Create one!</p>';
    return;
  }
  container.innerHTML = mine.map(l => `
    <div class="my-listing-row">
      <span>💎 ${l.amount.toLocaleString()} @ ${l.price} pts</span>
      <button onclick="deleteListing('${l.id}'); renderMyListings();">🗑</button>
    </div>
  `).join('');
}

/* ============================================
   CHAT SYSTEM
============================================ */
function openChat(listingId) {
  if (!currentUser) { openModal('authModal'); return; }
  const listing = listings.find(l => l.id === listingId);
  if (!listing) return;
  activeChatListing = listing;

  document.getElementById('chatSellerAvatar').textContent = listing.avatar;
  document.getElementById('chatSellerName').textContent   = listing.seller;
  document.getElementById('chatListingInfo').textContent  = `💎 ${listing.amount.toLocaleString()} Platinum @ ${listing.price} pts/unit`;

  renderChatMessages(listingId);
  openModal('chatModal');
}

function renderChatMessages(listingId) {
  const key = getChatKey(listingId);
  const msgs = chats[key] || [];
  const container = document.getElementById('chatMessages');
  container.innerHTML = msgs.length === 0
    ? '<p class="chat-empty">No messages yet. Start the conversation!</p>'
    : msgs.map(m => `
        <div class="chat-msg ${m.from === currentUser.username ? 'chat-msg--me' : 'chat-msg--them'}">
          <span class="chat-msg-from">${m.from}</span>
          <span class="chat-msg-text">${m.text}</span>
          <span class="chat-msg-time">${formatTime(m.time)}</span>
        </div>
      `).join('');
  container.scrollTop = container.scrollHeight;
}

function getChatKey(listingId) {
  if (!currentUser || !activeChatListing) return '';
  const participants = [currentUser.username, activeChatListing.seller].sort().join('_');
  return `${listingId}_${participants}`;
}

document.getElementById('sendChatMsg').addEventListener('click', sendMessage);
document.getElementById('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

function sendMessage() {
  if (!currentUser || !activeChatListing) return;
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text) return;

  const key = getChatKey(activeChatListing.id);
  if (!chats[key]) chats[key] = [];
  chats[key].push({ from: currentUser.username, text, time: Date.now() });
  saveAll();
  input.value = '';
  renderChatMessages(activeChatListing.id);
}

document.getElementById('makeOfferBtn').addEventListener('click', () => {
  if (!currentUser || !activeChatListing) return;
  const offerAmt = prompt(`How much Platinum do you want to buy? (Max: ${activeChatListing.amount})`);
  if (!offerAmt || isNaN(offerAmt)) return;
  const offerPrice = prompt(`Your price offer per unit? (Current: ${activeChatListing.price} pts)`);
  if (!offerPrice || isNaN(offerPrice)) return;

  const text = `💰 OFFER: ${parseInt(offerAmt).toLocaleString()} Platinum @ ${offerPrice} pts/unit (Total: ${(parseInt(offerAmt)*parseInt(offerPrice)).toLocaleString()} pts)`;
  const key = getChatKey(activeChatListing.id);
  if (!chats[key]) chats[key] = [];
  chats[key].push({ from: currentUser.username, text, time: Date.now() });
  saveAll();
  renderChatMessages(activeChatListing.id);
});

document.getElementById('confirmTradeBtn').addEventListener('click', () => {
  if (!currentUser || !activeChatListing) return;
  const text = `✅ TRADE CONFIRMED by ${currentUser.username}. Transaction complete!`;
  const key = getChatKey(activeChatListing.id);
  if (!chats[key]) chats[key] = [];
  chats[key].push({ from: currentUser.username, text, time: Date.now() });

  // Update trade counts
  if (users[currentUser.username]) users[currentUser.username].trades++;
  if (users[activeChatListing.seller]) users[activeChatListing.seller].trades++;
  if (currentUser.username === (users[currentUser.username]||{}).username) currentUser.trades++;

  saveAll();
  renderChatMessages(activeChatListing.id);
  showToast('✅ Trade confirmed! Don\'t forget to leave a review.');
});

/* ============================================
   REVIEW SYSTEM
============================================ */
let activeReviewListingId = null;

function openReview(listingId) {
  if (!currentUser) { openModal('authModal'); return; }
  const listing = listings.find(l => l.id === listingId);
  if (!listing) return;
  activeReviewListingId = listingId;
  document.getElementById('reviewForLabel').textContent = `Reviewing: ${listing.seller} ${listing.avatar}`;
  selectedStars = 0;
  document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
  document.getElementById('reviewComment').value = '';
  document.getElementById('reviewMsg').textContent = '';
  openModal('reviewModal');
}

document.querySelectorAll('.star').forEach(star => {
  star.addEventListener('click', () => {
    selectedStars = parseInt(star.dataset.val);
    document.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('active', parseInt(s.dataset.val) <= selectedStars);
    });
  });
  star.addEventListener('mouseover', () => {
    document.querySelectorAll('.star').forEach(s => {
      s.classList.toggle('hover', parseInt(s.dataset.val) <= parseInt(star.dataset.val));
    });
  });
  star.addEventListener('mouseout', () => {
    document.querySelectorAll('.star').forEach(s => s.classList.remove('hover'));
  });
});

document.getElementById('submitReview').addEventListener('click', () => {
  if (!currentUser) return;
  const msg     = document.getElementById('reviewMsg');
  const comment = document.getElementById('reviewComment').value.trim();
  if (!selectedStars)  return showMsg(msg, '⚠ Please select a star rating.', 'error');
  if (!comment)        return showMsg(msg, '⚠ Please write a comment.', 'error');

  const listing = listings.find(l => l.id === activeReviewListingId);
  if (!listing) return;

  const alreadyReviewed = listing.reviews.some(r => r.user === currentUser.username);
  if (alreadyReviewed) return showMsg(msg, '⚠ You already reviewed this listing.', 'error');

  listing.reviews.push({ user: currentUser.username, stars: selectedStars, comment });

  // Update seller rating
  const sellerUser = users[listing.seller];
  if (sellerUser) {
    sellerUser.rating = (sellerUser.rating || 0) + selectedStars;
    sellerUser.ratingCount = (sellerUser.ratingCount || 0) + 1;
  }

  saveAll();
  renderListings(document.querySelector('.filter-btn.active')?.dataset.filter || 'all');
  closeModal('reviewModal');
  showToast('⭐ Review submitted!');
});

/* ============================================
   UTILITY
============================================ */
function showMsg(el, text, type) {
  el.textContent = text;
  el.style.color = type === 'error' ? 'var(--red)' : 'var(--green)';
  setTimeout(() => { if (el) el.textContent = ''; }, 3500);
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--show'));
  setTimeout(() => {
    toast.classList.remove('toast--show');
    setTimeout(() => toast.remove(), 400);
  }, 2800);
}

function formatTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ============================================
   INIT
============================================ */
updateNavBtn();
renderListings();

// Expose global for inline onclick
window.openChat            = openChat;
window.openReview          = openReview;
window.deleteListing       = deleteListing;
window.openUserPanelOrAuth = openUserPanelOrAuth;
window.renderMyListings    = renderMyListings;
