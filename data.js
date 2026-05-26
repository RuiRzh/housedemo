/**
 * 物業樓盤 Demo（香港繁體版）— 共享數據層
 * 支援神策資源位 API 動態 Banner，根據登入狀態傳遞身份映射
 * 加入定時輪詢，保持 Banner 類型最新
 */

// ==================== 出售類 Banner 素材 ====================
const saleBannerData = [
  {
    id: 'sale-1',
    image: 'https://picsum.photos/seed/sale1/1200/400',
    title: '🔥 精選二手好房 · 業主直降',
    subtitle: '最高直降 200 萬 · 立即搶購',
    link: '#second-hand',
    category: 'sale'
  },
  {
    id: 'sale-2',
    image: 'https://picsum.photos/seed/sale2/1200/400',
    title: '🏡 全新一手樓盤 · 首期低至 15%',
    subtitle: '品牌發展商 · 精裝交付',
    link: '#new-property',
    category: 'sale'
  },
  {
    id: 'sale-3',
    image: 'https://picsum.photos/seed/sale3/1200/400',
    title: '📉 急售筍盤 · 低於市場價',
    subtitle: '業主移民 · 誠意出售',
    link: '#second-hand',
    category: 'sale'
  }
];

// ==================== 租賃類 Banner 素材 ====================
const rentBannerData = [
  {
    id: 'rent-1',
    image: 'https://picsum.photos/seed/rent1/1200/400',
    title: '🔑 精選優質租盤 · 拎包入住',
    subtitle: '月租低至 HK$8,000 · 押二付一',
    link: '#rental',
    category: 'rent'
  },
  {
    id: 'rent-2',
    image: 'https://picsum.photos/seed/rent2/1200/400',
    title: '🏢 商務公寓 · 近地鐵站',
    subtitle: '全配傢俬 · 隨時睇樓',
    link: '#rental',
    category: 'rent'
  },
  {
    id: 'rent-3',
    image: 'https://picsum.photos/seed/rent3/1200/400',
    title: '🌆 高端服務式住宅',
    subtitle: '酒店式管理 · 長租優惠',
    link: '#rental',
    category: 'rent'
  }
];

// ==================== 全局 Banner 數據 ====================
let bannerData = [];
let bannerDataReadyFlag = false;   // 就緒標誌

// ==================== 神策 API 配置（請替換為真實值） ====================
const SENSORS_CONFIG = {
  baseURL: 'https://xijiulongpocnew.sfo-tx-trial-01.saas.sensorsdata.cn/api/v2/sfo/section/recommend',
  org_id: 'xijiulongpocnew',
  access_token: 'd01e7c4e-692e-42cd-ba1f-8f8ed1bdc9c2',
  project_name: 'Retail',
  section_id: 'section_id_6456952145239'
};

/**
 * 請求神策輪播資源位推薦結果
 */
async function fetchBannersFromSensors() {
  const url = `${SENSORS_CONFIG.baseURL}?org_id=${SENSORS_CONFIG.org_id}&access_token=${SENSORS_CONFIG.access_token}`;
  const body = {
    section_id: SENSORS_CONFIG.section_id,
    log_id: 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  };

  // 登入狀態上報 identity_id_map，未登入時不傳任何用戶標識
  if (currentUser && currentUser.phone) {
    body.distinct_id = currentUser.phone;
    console.log('帶入 identity_id_map:', body.identity_id_map);
  } else {
    const AID = sensors.quick('getAnonymousID')
    body.distinct_id = AID;
    console.log('未登入');
  }

  console.log('請求 URL:', url);
  console.log('請求體:', JSON.stringify(body, null, 2));

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'project-name': SENSORS_CONFIG.project_name
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      // 嘗試讀取錯誤響應
      const errorText = await response.text();
      console.error('請求失敗，狀態碼:', response.status, '響應內容:', errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    if (result.errcode !== 0) throw new Error(`API error: ${result.errmsg} (code: ${result.errcode})`);
    console.log('API 返回 items:', result.data.items);
    return result.data.items || [];
  } catch (error) {
    console.error('請求异常:', error);
    return [];
  }
}

/**
 * 根據 BannerID 決定類別（"1" → 出售，"2" → 租賃）
 */
function getCategoryFromItems(items) {
  if (!items || items.length === 0) return 'sale';
  const bannerId = items[0].material_properties?.BannerID;
  return bannerId === '2' ? 'rent' : 'sale';
}

/**
 * 依據類別取得對應的 Banner 陣列
 */
function getBannerDataByCategory(category) {
  return category === 'rent' ? rentBannerData : saleBannerData;
}

/**
 * 當前 Banner 類別（記憶用，避免無意義的 UI 刷新）
 */
let currentCategory = 'sale';

/**
 * 更新 Banner 數據（如果類別發生變化，則觸發事件讓 UI 重新渲染）
 */
function updateBannerData(category) {
  if (category !== currentCategory) {
    currentCategory = category;
    bannerData = getBannerDataByCategory(category);
    console.log(`Banner 類別變更為【${category === 'rent' ? '租賃' : '出售'}】，刷新 UI`);
    bannerDataReadyFlag = true;
    document.dispatchEvent(new CustomEvent('bannerDataReady'));
  } else {
    bannerData = getBannerDataByCategory(category);
    bannerDataReadyFlag = true;
    console.log(`Banner 類別未變，保持目前展示`);
    // 若尚未觸發過，手動觸發一次確保 UI 有顯示
    if (!bannerDataReadyFlag) {
      bannerDataReadyFlag = true;
      document.dispatchEvent(new CustomEvent('bannerDataReady'));
    }
  }
}

/**
 * 執行一次 Banner 請求並更新
 */
async function refreshBanners() {
  console.log('正在刷新 Banner');
  const items = await fetchBannersFromSensors();
  const category = getCategoryFromItems(items);
  updateBannerData(category);
}

// 將 refreshBanners 掛載到全域，以便 login/logout 時調用
window.refreshBanners = refreshBanners;

// 將就緒標誌暴露為函數，避免直接讀取變數
window.bannerDataReadyFlag = () => bannerDataReadyFlag;

/**
 * 初始化 Banner（首次加載）+ 啟動定時輪詢
 */
let pollingTimer = null;

async function initBannerData() {
  // 先設定默認值，確保頁面有內容（降級為出售 Banner）
  bannerData = saleBannerData;
  bannerDataReadyFlag = true;
  // 立即觸發一次事件，讓 UI 先顯示默認 Banner
  document.dispatchEvent(new CustomEvent('bannerDataReady'));

  // 然後請求 API，如果成功再動態更新
  await refreshBanners();

  // 啟動定時輪詢，每 30 秒刷新一次
  pollingTimer = setInterval(refreshBanners, 30000);
  console.log('已啟動 Banner 定時輪詢（間隔 30 秒）');
}

// 清理定時器
window.addEventListener('beforeunload', () => {
  if (pollingTimer) clearInterval(pollingTimer);
});

// 確保 DOM 完全載入後再初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBannerData);
} else {
  initBannerData();
}

// ==================== 樓盤數據（香港繁體） ====================
const propertyData = [
  {
    id: 1,
    type: 'second-hand',
    title: '朝陽花園 3房2廳',
    district: '九龍城',
    price: 580,
    area: 650,
    rooms: 3,
    halls: 2,
    image: 'https://picsum.photos/seed/prop1/400/300',
    tags: ['南北通透', '名校網'],
    description: '位於九龍核心地段，周邊配套成熟，交通便利，港鐵站步行5分鐘。豪華裝修，即買即住。'
  },
  {
    id: 2,
    type: 'new',
    title: '星河灣 4房2廳',
    district: '啟德',
    price: 920,
    area: 1200,
    rooms: 4,
    halls: 2,
    image: 'https://picsum.photos/seed/prop2/400/300',
    tags: ['新樓', '發展商直售'],
    description: '2025年全新落成，智能家居系統，屋苑配備泳池及健身室，發展商直售免佣。'
  },
  {
    id: 3,
    type: 'rental',
    title: '陽光公寓 1房1廳',
    district: '油尖旺',
    price: 0.35,
    area: 220,
    rooms: 1,
    halls: 1,
    image: 'https://picsum.photos/seed/prop3/400/300',
    tags: ['豪裝', '近港鐵'],
    description: '油尖旺核心位置，步行至港鐵站只需3分鐘，豪華裝修，適合上班族。'
  },
  {
    id: 4,
    type: 'second-hand',
    title: '翠苑新村 2房1廳',
    district: '將軍澳',
    price: 420,
    area: 400,
    rooms: 2,
    halls: 1,
    image: 'https://picsum.photos/seed/prop4/400/300',
    tags: ['滿五唯一', '低總價'],
    description: '將軍澳成熟屋苑，滿五唯一稅費低，周邊商場齊全，上車首選。'
  },
  {
    id: 5,
    type: 'new',
    title: '龍湖天街 3房2廳',
    district: '何文田',
    price: 780,
    area: 550,
    rooms: 3,
    halls: 2,
    image: 'https://picsum.photos/seed/prop5/400/300',
    tags: ['品牌發展商', '開揚景觀'],
    description: '品牌發展商，屋苑自設商場，戶型方正實用，高層開揚景觀。'
  },
  {
    id: 6,
    type: 'rental',
    title: '青年公寓 Studio',
    district: '沙田',
    price: 0.25,
    area: 150,
    rooms: 0,
    halls: 1,
    image: 'https://picsum.photos/seed/prop6/400/300',
    tags: ['近大學', '月付'],
    description: '沙田大學區周邊，適合學生及年輕白領，支持月付，共享廚房及洗衣房。'
  }
];

// ==================== 用戶狀態 ====================
let currentUser = null;
const registeredUsers = [
  { phone: 'test1', email: 'test1@t.cn', name: 'test1', district: '九龍城', password: '123456' },
  { phone: 'test2', email: 'test2@t.cn', name: 'test2', district: '九龍城', password: '123456' },
  { phone: 'test3', email: 'test3@t.cn', name: 'test3', district: '九龍城', password: '123456' },
  { phone: 'test4', email: 'test4@t.cn', name: 'test5', district: '九龍城', password: '123456' },
];

// ==================== Demo 推廣消息 ====================
const salePromoMsg = '🎉 購樓優惠：現時購買二手或一手樓盤，可享額外 2% 折扣及免佣優惠！立即聯絡我們了解更多。';
const rentPromoMsg = '🏠 租盤優惠：簽約一年即免半個月租金，精選租盤更送搬屋津貼！數量有限，立即查詢。';
