/**
 * 物業樓盤 Demo（香港繁體版）— 桌面版 Website 腳本
 */
document.addEventListener('DOMContentLoaded', function () {

  // ==================== 1. 導航激活 ====================
  const navLinks = document.querySelectorAll('.nav-links a');
  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      navLinks.forEach(l => l.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // ==================== 2. 搜尋框 ====================
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const suggestionsDropdown = document.getElementById('suggestionsDropdown');
  const searchKeywords = [
    ...propertyData.map(p => p.title),
    ...propertyData.map(p => p.district),
    ...propertyData.flatMap(p => p.tags),
    '二手', '新樓', '租盤', '九龍', '啟德', '將軍澳', '沙田', '油尖旺'
  ];
  const uniqueKeywords = [...new Set(searchKeywords)];

  searchInput.addEventListener('input', function () {
    const query = this.value.trim();
    if (!query) { suggestionsDropdown.classList.remove('show'); return; }
    const matches = uniqueKeywords.filter(kw => kw.includes(query)).slice(0, 8);
    if (matches.length) {
      suggestionsDropdown.innerHTML = matches.map(m => `<div class="suggestion-item">${m}</div>`).join('');
      suggestionsDropdown.classList.add('show');
      suggestionsDropdown.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', function () {
          searchInput.value = this.textContent;
          suggestionsDropdown.classList.remove('show');
          performSearch(this.textContent);
        });
      });
    } else { suggestionsDropdown.classList.remove('show'); }
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.search-box') && !e.target.closest('.suggestions-dropdown')) {
      suggestionsDropdown.classList.remove('show');
    }
  });

  searchBtn.addEventListener('click', () => {
    const q = searchInput.value.trim();
    if (q) { suggestionsDropdown.classList.remove('show'); performSearch(q); }
  });
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchBtn.click(); });

  function performSearch(query) {
    const results = propertyData.filter(p =>
      p.title.includes(query) || p.district.includes(query) || p.tags.some(t => t.includes(query)) ||
      (query === '二手' && p.type === 'second-hand') || (query === '新樓' && p.type === 'new') || (query === '租盤' && p.type === 'rental')
    );
    alert(`搵到 ${results.length} 個相關樓盤\n${results.map(r => r.title).join('\n') || '暫無結果'}`);
  }

  // ==================== 桌面版通知功能 ====================
  function showDesktopToast(message) {
    const toast = document.getElementById('desktopToast');
    if (!toast) return;
    toast.querySelector('.toast-text').textContent = message;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => toast.classList.remove('show'), 5000);
  }

  // ★★★ 查看全部 → 優惠通知（延遲 60 秒） ★★★
  document.querySelectorAll('.view-all').forEach(link => {
    let delayTimer;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const section = this.closest('.property-section');
      if (!section) return;
      const sectionId = section.getAttribute('id');
      const message = (sectionId === 'rental') ? rentPromoMsg : salePromoMsg;

      if (delayTimer) clearTimeout(delayTimer);   // 重置倒計時
      delayTimer = setTimeout(() => {
        showDesktopToast(message);
      }, 5000); // 60 秒
    });
  });

  document.getElementById('toastClose')?.addEventListener('click', () => {
    document.getElementById('desktopToast').classList.remove('show');
  });

  // ==================== 3. Banner 輪播（修復版） ====================
  let bannerCleanup = null;

  function renderBanner() {
    if (bannerCleanup) {
      bannerCleanup();
      bannerCleanup = null;
    }

    const bannerContainer = document.getElementById('bannerContainer');
    const bannerPrev = document.getElementById('bannerPrev');
    const bannerNext = document.getElementById('bannerNext');
    const bannerDotsContainer = document.getElementById('bannerDots');

    if (!bannerContainer || !bannerDotsContainer) return;

    bannerContainer.querySelectorAll('.banner-slide').forEach(s => s.remove());
    bannerDotsContainer.innerHTML = '';

    let currentBannerIndex = 0;
    let bannerInterval;

    bannerData.forEach((banner, index) => {
      const slide = document.createElement('div');
      slide.className = `banner-slide ${index === 0 ? 'active' : ''}`;
      slide.innerHTML = `
        <img src="${banner.image}" alt="${banner.title}">
        <span class="banner-tag ${banner.category}">${banner.category === 'rent' ? '租賃' : '出售'}</span>
        <div class="banner-caption">
          <h3>${banner.title}</h3>
          <p>${banner.subtitle}</p>
        </div>
      `;
      slide.addEventListener('click', () => console.log('Banner 點擊:', banner.link));
      bannerContainer.appendChild(slide);

      const dot = document.createElement('button');
      dot.className = `banner-dot ${index === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goToBanner(index));
      bannerDotsContainer.appendChild(dot);
    });

    function goToBanner(index) {
      const slides = bannerContainer.querySelectorAll('.banner-slide');
      const dots = bannerDotsContainer.querySelectorAll('.banner-dot');
      slides[currentBannerIndex].classList.remove('active');
      dots[currentBannerIndex].classList.remove('active');
      currentBannerIndex = index;
      slides[currentBannerIndex].classList.add('active');
      dots[currentBannerIndex].classList.add('active');
      resetBannerInterval();
    }

    function nextBanner() { goToBanner((currentBannerIndex + 1) % bannerData.length); }
    function prevBanner() { goToBanner((currentBannerIndex - 1 + bannerData.length) % bannerData.length); }
    function resetBannerInterval() { clearInterval(bannerInterval); bannerInterval = setInterval(nextBanner, 4000); }

    if (bannerPrev) bannerPrev.addEventListener('click', prevBanner);
    if (bannerNext) bannerNext.addEventListener('click', nextBanner);
    bannerInterval = setInterval(nextBanner, 4000);
    bannerContainer.addEventListener('mouseenter', () => clearInterval(bannerInterval));
    bannerContainer.addEventListener('mouseleave', resetBannerInterval);

    bannerCleanup = () => { clearInterval(bannerInterval); };
  }

  document.addEventListener('bannerDataReady', renderBanner);
  if (window.bannerDataReadyFlag && window.bannerDataReadyFlag()) {
    renderBanner();
  }

  // ==================== 4. 樓盤列表 ====================
  const secondHandGrid = document.getElementById('secondHandGrid');
  const newPropertyGrid = document.getElementById('newPropertyGrid');
  const rentalGrid = document.getElementById('rentalGrid');

  function renderPropertyCard(p) {
    const priceText = p.type === 'rental'
      ? `<span class="card-price">HK$${(p.price * 10000).toLocaleString()}<span class="unit">/月</span></span>`
      : `<span class="card-price">HK$${p.price}<span class="unit">萬</span></span>`;
    return `<div class="property-card" data-id="${p.id}">
      <div class="card-image">
        <img src="${p.image}" alt="${p.title}" loading="lazy">
        <div class="card-tags">${p.tags.map(t => `<span>${t}</span>`).join('')}</div>
      </div>
      <div class="card-body">
        <h4>${p.title}</h4>
        <div class="card-meta"><span>${p.district}</span><span>${p.area}呎</span><span>${p.rooms}房${p.halls}廳</span></div>
        ${priceText}
      </div>
    </div>`;
  }

  secondHandGrid.innerHTML = propertyData.filter(p => p.type === 'second-hand').map(renderPropertyCard).join('');
  newPropertyGrid.innerHTML = propertyData.filter(p => p.type === 'new').map(renderPropertyCard).join('');
  rentalGrid.innerHTML = propertyData.filter(p => p.type === 'rental').map(renderPropertyCard).join('');

  // ==================== 5. 詳情彈窗 ====================
  const detailOverlay = document.getElementById('detailOverlay');
  const detailContent = document.getElementById('detailContent');

  function openPropertyDetail(id) {
    const p = propertyData.find(p => p.id === id);
    if (!p) return;

    const category = (p.type === 'second-hand' || p.type === 'new') ? 'buy' : 'rent';
    sensors.track('house_listing_view', { category: category });

    const priceText = p.type === 'rental' ? `HK$${(p.price * 10000).toLocaleString()} /月` : `HK$${p.price}萬`;
    const typeMap = { 'second-hand': '二手', 'new': '新樓', 'rental': '租盤' };
    detailContent.innerHTML = `
      <button class="modal-close" onclick="document.getElementById('detailOverlay').classList.remove('show')">✕</button>
      <div class="modal-image"><img src="${p.image}" alt="${p.title}"></div>
      <div class="modal-body">
        <h2>${p.title}</h2>
        <div class="price">${priceText}</div>
        <div class="meta-grid">
          <div class="meta-item"><div class="label">間隔</div><div class="value">${p.rooms}房${p.halls}廳</div></div>
          <div class="meta-item"><div class="label">面積</div><div class="value">${p.area}呎</div></div>
          <div class="meta-item"><div class="label">地區</div><div class="value">${p.district}</div></div>
          <div class="meta-item"><div class="label">類型</div><div class="value">${typeMap[p.type]}</div></div>
        </div>
        <p class="description">${p.description}</p>
        ${currentUser
          ? '<button class="btn-contact" onclick="alert(\'已通知業主，稍後將有客服聯絡您！\')">📞 聯絡業主 / 預約睇樓</button>'
          : '<button class="btn-contact" onclick="alert(\'請先登入\'); document.getElementById(\'detailOverlay\').classList.remove(\'show\'); document.getElementById(\'loginOverlay\').classList.add(\'show\')">🔒 登入後聯絡業主</button>'
        }
      </div>`;
    detailOverlay.classList.add('show');
  }

  document.addEventListener('click', function (e) {
    const card = e.target.closest('.property-card');
    if (card) openPropertyDetail(parseInt(card.dataset.id));
  });
  detailOverlay.addEventListener('click', function (e) { if (e.target === detailOverlay) detailOverlay.classList.remove('show'); });

  // ==================== 6. 登入/註冊 ====================
  const loginOverlay = document.getElementById('loginOverlay');
  const loginBtn = document.getElementById('loginBtn');
  const loginForm = document.getElementById('loginForm');
  const formTitle = document.getElementById('formTitle');
  const formSubtitle = document.getElementById('formSubtitle');
  const nameGroup = document.getElementById('nameGroup');
  const districtGroup = document.getElementById('districtGroup');
  const toggleText = document.getElementById('toggleText');
  let isLoginMode = true;

  loginBtn.addEventListener('click', () => {
    if (currentUser) {
      if (confirm(`已登入：${currentUser.name}\n是否登出？`)) {
        currentUser = null;
        updateLoginButton();
        if (typeof window.refreshBanners === 'function') window.refreshBanners();
      }
    } else {
      resetForm();
      loginOverlay.classList.add('show');
    }
  });

  function updateLoginButton() {
    loginBtn.textContent = currentUser ? `👤 ${currentUser.name}` : '登入 / 註冊';
    loginBtn.classList.toggle('logged-in', !!currentUser);
  }

  function resetForm() {
    isLoginMode = true;
    formTitle.textContent = '會員登入';
    formSubtitle.textContent = '登入後查看完整樓盤資訊';
    nameGroup.style.display = 'none';
    districtGroup.style.display = 'none';
    document.getElementById('submitBtn').textContent = '登入';
    toggleText.innerHTML = '仲未成為會員？<a id="toggleLink">立即註冊</a>';
    loginForm.reset();
    bindToggleLink();
  }
  function bindToggleLink() {
    const link = document.getElementById('toggleLink');
    if (link) {
      link.onclick = () => {
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
          formTitle.textContent = '會員登入'; formSubtitle.textContent = '登入後查看完整樓盤資訊';
          nameGroup.style.display = 'none'; districtGroup.style.display = 'none';
          document.getElementById('submitBtn').textContent = '登入';
          toggleText.innerHTML = '仲未成為會員？<a id="toggleLink">立即註冊</a>';
        } else {
          formTitle.textContent = '會員註冊'; formSubtitle.textContent = '註冊即可享受專屬樓盤推薦';
          nameGroup.style.display = 'block'; districtGroup.style.display = 'block';
          document.getElementById('submitBtn').textContent = '註冊';
          toggleText.innerHTML = '已經有帳號？<a id="toggleLink">立即登入</a>';
        }
        loginForm.reset();
        bindToggleLink();
      };
    }
  }
  bindToggleLink();

  loginForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const phone = document.getElementById('phone').value.trim();
    const email = document.getElementById('email').value.trim();
    if (isLoginMode) {
      const user = registeredUsers.find(u => u.phone === phone || u.email === email);
      if (user) {
        currentUser = { name: user.name, phone: user.phone, email: user.email, district: user.district };
        sensors.login(user.phone);
        alert(`✅ 登入成功！歡迎返嚟，${currentUser.name}`);
        loginOverlay.classList.remove('show');
        updateLoginButton();
        if (typeof window.refreshBanners === 'function') window.refreshBanners();
      } else alert('❌ 帳號唔存在，請先註冊');
    } else {
      const name = document.getElementById('name').value.trim();
      const district = document.getElementById('district').value.trim();
      if (!phone || !email || !name || !district) { alert('請填寫所有必填欄位'); return; }
      currentUser = { name, phone, email, district };
      registeredUsers.push({ phone, email, name, district, password: '123456' });
      sensors.login(phone);
      alert(`🎉 註冊成功！歡迎加入，${name}`);
      loginOverlay.classList.remove('show');
      updateLoginButton();
      if (typeof window.refreshBanners === 'function') window.refreshBanners();
    }
  });

  loginOverlay.addEventListener('click', function (e) { if (e.target === loginOverlay) loginOverlay.classList.remove('show'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { detailOverlay.classList.remove('show'); loginOverlay.classList.remove('show'); } });

  console.log('🏠 物業樓盤 Website 桌面版已就緒');
});