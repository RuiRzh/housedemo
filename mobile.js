document.addEventListener('DOMContentLoaded', function () {

  function showToast(msg) {
    const t = document.getElementById('mobileToast');
    t.textContent = msg; t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // Tab 切換
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      document.getElementById(`tab-${this.dataset.tab}`).style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // 搜尋
  const searchInput = document.getElementById('mobileSearchInput');
  const searchBtn = document.getElementById('mobileSearchBtn');
  const suggestionsDropdown = document.getElementById('mobileSuggestionsDropdown');
  const keywords = [...propertyData.map(p=>p.title), ...propertyData.map(p=>p.district), ...propertyData.flatMap(p=>p.tags), '二手','新樓','租盤'];
  const uniqueKw = [...new Set(keywords)];

  searchInput.addEventListener('input', function () {
    const q = this.value.trim();
    if (!q) { suggestionsDropdown.classList.remove('show'); return; }
    const matches = uniqueKw.filter(k => k.includes(q)).slice(0,6);
    if (matches.length) {
      suggestionsDropdown.innerHTML = matches.map(m => `<div class="suggestion-item">${m}</div>`).join('');
      suggestionsDropdown.classList.add('show');
      suggestionsDropdown.querySelectorAll('.suggestion-item').forEach(item => {
        item.addEventListener('click', () => { searchInput.value = item.textContent; suggestionsDropdown.classList.remove('show'); performSearch(item.textContent); });
      });
    } else suggestionsDropdown.classList.remove('show');
  });
  document.addEventListener('click', e => { if (!e.target.closest('.mobile-search-box') && !e.target.closest('.mobile-suggestions-dropdown')) suggestionsDropdown.classList.remove('show'); });
  searchBtn.addEventListener('click', () => { const q = searchInput.value.trim(); if (q) { suggestionsDropdown.classList.remove('show'); performSearch(q); } });
  searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') searchBtn.click(); });

  function performSearch(query) {
    const res = propertyData.filter(p => p.title.includes(query) || p.district.includes(query) || p.tags.some(t=>t.includes(query)) ||
      (query==='二手' && p.type==='second-hand') || (query==='新樓' && p.type==='new') || (query==='租盤' && p.type==='rental'));
    showToast(`搵到 ${res.length} 個相關樓盤`);
  }

  // ★★★ 查看全部 → 優惠通知（延遲 60 秒） ★★★
  document.querySelectorAll('.view-all').forEach(link => {
    let delayTimer;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const href = this.getAttribute('href');
      const isRental = (href === '#rental' || (this.closest('.mobile-section-header') && this.closest('.mobile-section-header').nextElementSibling?.id?.includes('Rental')));
      const message = isRental ? rentPromoMsg : salePromoMsg;

      if (delayTimer) clearTimeout(delayTimer);
      delayTimer = setTimeout(() => {
        showToast(message);
      }, 5000);
    });
  });

  // ==================== Banner 輪播（修復版） ====================
  let bannerCleanup = null;

  function renderBanner() {
    if (bannerCleanup) {
      bannerCleanup();
      bannerCleanup = null;
    }

    const container = document.getElementById('mobileBannerContainer');
    const dotsContainer = document.getElementById('mobileBannerDots');
    if (!container || !dotsContainer) return;

    container.querySelectorAll('.mobile-banner-slide').forEach(s => s.remove());
    dotsContainer.innerHTML = '';

    let idx = 0, interval, startX = 0, endX = 0;

    bannerData.forEach((b, i) => {
      const slide = document.createElement('div');
      slide.className = `mobile-banner-slide ${i===0?'active':''}`;
      slide.innerHTML = `<img src="${b.image}" alt="${b.title}">
        <span class="mobile-banner-tag ${b.category}">${b.category==='rent'?'租賃':'出售'}</span>
        <div class="mobile-banner-caption"><h3>${b.title}</h3><p>${b.subtitle}</p></div>`;
      slide.addEventListener('click', ()=>console.log('Banner tap:', b.link));
      container.appendChild(slide);
      const dot = document.createElement('button');
      dot.className = `mobile-banner-dot ${i===0?'active':''}`;
      dot.addEventListener('click', ()=>goTo(i));
      dotsContainer.appendChild(dot);
    });

    function goTo(i) {
      const slides = container.querySelectorAll('.mobile-banner-slide');
      const dots = dotsContainer.querySelectorAll('.mobile-banner-dot');
      slides[idx].classList.remove('active'); dots[idx].classList.remove('active');
      idx = i; slides[idx].classList.add('active'); dots[idx].classList.add('active');
      resetInterval();
    }
    function next() { goTo((idx+1)%bannerData.length); }
    function prev() { goTo((idx-1+bannerData.length)%bannerData.length); }
    function resetInterval() { clearInterval(interval); interval = setInterval(next, 3500); }

    container.addEventListener('touchstart', e => { startX = e.changedTouches[0].screenX; clearInterval(interval); }, {passive:true});
    container.addEventListener('touchend', e => { endX = e.changedTouches[0].screenX; if (Math.abs(startX-endX)>50) startX>endX?next():prev(); resetInterval(); });
    interval = setInterval(next, 3500);

    bannerCleanup = () => { clearInterval(interval); };
  }

  document.addEventListener('bannerDataReady', renderBanner);
  if (window.bannerDataReadyFlag && window.bannerDataReadyFlag()) {
    renderBanner();
  }

  // 樓盤列表
  const typeMap = {'second-hand':'二手','new':'新樓','rental':'租盤'};
  function renderCard(p) {
    const price = p.type==='rental' ? `HK$${(p.price*10000).toLocaleString()}<span class="unit">/月</span>` : `HK$${p.price}<span class="unit">萬</span>`;
    return `<div class="mobile-property-card" data-id="${p.id}">
      <div class="card-image"><img src="${p.image}" alt="${p.title}"><span class="card-tag">${typeMap[p.type]}</span></div>
      <div class="card-body"><h4>${p.title}</h4><div class="card-meta">${p.district} · ${p.area}呎 · ${p.rooms}房${p.halls}廳</div><div class="card-price">${price}</div></div>
    </div>`;
  }
  document.getElementById('mobileSecondHandList').innerHTML = propertyData.filter(p=>p.type==='second-hand').map(renderCard).join('');
  document.getElementById('mobileNewPropertyList').innerHTML = propertyData.filter(p=>p.type==='new').map(renderCard).join('');
  document.getElementById('mobileRentalList').innerHTML = propertyData.filter(p=>p.type==='rental').map(renderCard).join('');

  // 詳情頁
  const detailOverlay = document.getElementById('mobileDetailOverlay');
  const detailContent = document.getElementById('mobileDetailContent');
  const detailTitle = document.getElementById('mobileDetailTitle');
  document.getElementById('btnDetailBack').addEventListener('click', ()=>{ detailOverlay.classList.remove('show'); document.body.style.overflow=''; });
  function openDetail(id) {
    const p = propertyData.find(p=>p.id===id); if (!p) return;

    const category = (p.type === 'second-hand' || p.type === 'new') ? 'buy' : 'rent';
    sensors.track('house_listing_view', { category: category });

    const price = p.type==='rental' ? `HK$${(p.price*10000).toLocaleString()} /月` : `HK$${p.price}萬`;
    detailTitle.textContent = p.title;
    detailContent.innerHTML = `<div class="detail-image"><img src="${p.image}" alt="${p.title}"></div>
      <div class="detail-body"><h2>${p.title}</h2><div class="price">${price}</div>
      <div class="meta-row"><span class="meta-tag">${p.rooms}房${p.halls}廳</span><span class="meta-tag">${p.area}呎</span><span class="meta-tag">${p.district}</span><span class="meta-tag">${typeMap[p.type]}</span></div>
      <p class="description">${p.description}</p>
      ${currentUser ? '<button class="btn-contact" onclick="alert(\'已通知業主，稍後將有客服聯絡您！\')">📞 聯絡業主 / 預約睇樓</button>' : '<button class="btn-contact" onclick="alert(\'請先登入\'); document.getElementById(\'mobileDetailOverlay\').classList.remove(\'show\'); document.getElementById(\'mobileLoginOverlay\').classList.add(\'show\')">🔒 登入後聯絡業主</button>'}
      </div>`;
    detailOverlay.classList.add('show'); document.body.style.overflow='hidden';
  }
  document.addEventListener('click', e => { const card = e.target.closest('.mobile-property-card'); if (card) openDetail(parseInt(card.dataset.id)); });

  // 登入/註冊
  const loginOverlay = document.getElementById('mobileLoginOverlay');
  const btnLoginOpen = document.getElementById('btnLoginOpen');
  const loginForm = document.getElementById('mobileLoginForm');
  const formTitle = document.getElementById('mobileFormTitle');
  const formSubtitle = document.getElementById('mobileFormSubtitle');
  const nameGroup = document.getElementById('mobileNameGroup');
  const districtGroup = document.getElementById('mobileDistrictGroup');
  const toggleText = document.getElementById('mobileToggleText');
  let isLogin = true;

  btnLoginOpen.addEventListener('click', ()=>{
    if (currentUser) {
      if (confirm(`已登入：${currentUser.name}\n是否登出？`)) {
        currentUser = null;
        showToast('已登出');
        if (typeof window.refreshBanners === 'function') window.refreshBanners();
      }
    } else {
      resetForm();
      loginOverlay.classList.add('show');
      document.body.style.overflow='hidden';
    }
  });
  document.getElementById('btnLoginBack').addEventListener('click', ()=>{ loginOverlay.classList.remove('show'); document.body.style.overflow=''; });

  function resetForm() {
    isLogin = true; formTitle.textContent='會員登入'; formSubtitle.textContent='登入後查看完整樓盤資訊';
    nameGroup.style.display='none'; districtGroup.style.display='none';
    document.getElementById('mobileSubmitBtn').textContent='登入';
    toggleText.innerHTML='仲未成為會員？<a id="mobileToggleLink">立即註冊</a>';
    loginForm.reset(); bindToggle();
  }
  function bindToggle() {
    const link = document.getElementById('mobileToggleLink');
    if (link) link.onclick = ()=>{
      isLogin = !isLogin;
      if (isLogin) { formTitle.textContent='會員登入'; formSubtitle.textContent='登入後查看完整樓盤資訊'; nameGroup.style.display='none'; districtGroup.style.display='none'; document.getElementById('mobileSubmitBtn').textContent='登入'; toggleText.innerHTML='仲未成為會員？<a id="mobileToggleLink">立即註冊</a>'; }
      else { formTitle.textContent='會員註冊'; formSubtitle.textContent='註冊即可享受專屬樓盤推薦'; nameGroup.style.display='block'; districtGroup.style.display='block'; document.getElementById('mobileSubmitBtn').textContent='註冊'; toggleText.innerHTML='已經有帳號？<a id="mobileToggleLink">立即登入</a>'; }
      loginForm.reset(); bindToggle();
    };
  }
  bindToggle();

  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const phone = document.getElementById('mobilePhone').value.trim();
    const email = document.getElementById('mobileEmail').value.trim();
    if (isLogin) {
      const user = registeredUsers.find(u=>u.phone===phone || u.email===email);
      if (user) {
        currentUser = { name: user.name, phone: user.phone, email: user.email, district: user.district };
        sensors.login(user.phone); 
        showToast(`✅ 登入成功！歡迎返嚟，${currentUser.name}`);
        loginOverlay.classList.remove('show'); document.body.style.overflow='';
        if (typeof window.refreshBanners === 'function') window.refreshBanners();
      } else showToast('❌ 帳號唔存在，請先註冊');
    } else {
      const name = document.getElementById('mobileName').value.trim();
      const district = document.getElementById('mobileDistrict').value.trim();
      if (!phone||!email||!name||!district) { showToast('請填寫所有必填欄位'); return; }
      currentUser = { name, phone, email, district };
      registeredUsers.push({ phone, email, name, district, password: '123456' });
      sensors.login(phone);
      showToast(`🎉 註冊成功！歡迎加入，${name}`);
      loginOverlay.classList.remove('show'); document.body.style.overflow='';
      if (typeof window.refreshBanners === 'function') window.refreshBanners();
    }
  });

  console.log('📱 物業樓盤 Mobile 手機版已就緒');
});