
// 缓存所有基金列表
let allFundsCache = null;
let isFetchingFunds = false;
let fetchPromise = null;

// 获取所有基金列表
const getAllFunds = async () => {
  if (allFundsCache) return allFundsCache;
  if (isFetchingFunds) return fetchPromise;

  isFetchingFunds = true;
  fetchPromise = (async () => {
    try {
      const response = await fetch('/api/all-funds');
      if (!response.ok) throw new Error('Failed to fetch fund list');
      const text = await response.text();
      
      // 格式: var r = [["code","abbr","name","type","pinyin"],...];
      const jsonStr = text.replace(/^var r = /, '').replace(/;$/, '');
      const data = JSON.parse(jsonStr);
      
      // 转换为更友好的格式
      allFundsCache = data.map(item => ({
        code: item[0],
        abbr: item[1],
        name: item[2],
        type: item[3],
        pinyin: item[4]
      }));
      
      return allFundsCache;
    } catch (error) {
      console.error('Error loading funds:', error);
      return [];
    } finally {
      isFetchingFunds = false;
    }
  })();

  return fetchPromise;
};

// 搜索基金
export const searchFund = async (keyword) => {
  if (!keyword) return [];
  const funds = await getAllFunds();
  const lowerKeyword = keyword.toLowerCase();
  return funds.filter(fund => 
    fund.code.includes(lowerKeyword) || 
    fund.name.includes(lowerKeyword) || 
    fund.abbr.toLowerCase().includes(lowerKeyword) ||
    fund.pinyin.toLowerCase().includes(lowerKeyword)
  ).slice(0, 20);
};

// 获取基金估值信息 (通过 Vite 代理)
// 真实接口: http://fundgz.1234567.com.cn/js/{code}.js
export const getFundDetails = async (codes) => {
  if (!codes || codes.length === 0) return {};

  const promises = codes.map(async (code) => {
    try {
      // 添加时间戳防止缓存
      const response = await fetch(`/api/valuation/${code}.js?rt=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const text = await response.text();
      
      // 返回格式通常为: jsonpgz({"fundcode":"110011","name":"易方达优质精选混合(QDII)","jzrq":"2024-05-29","dwjz":"5.7663","gsz":"5.7288","gszzl":"-0.65","gztime":"2024-05-30 15:00"});
      // 或者 jsonpgz(); (无数据)
      const match = text.match(/jsonpgz\((.*)\)/);
      
      if (match && match[1]) {
        const data = JSON.parse(match[1]);
        return {
          code: data.fundcode,
          name: data.name,
          nav: parseFloat(data.dwjz), // 单位净值 (昨日)
          navDate: data.jzrq, // 净值日期
          gsz: parseFloat(data.gsz), // 估算净值 (实时)
          gszzl: data.gszzl, // 估算涨跌幅
          gztime: data.gztime // 估值时间
        };
      }
      return null;
    } catch (error) {
      // 如果获取实时数据失败，尝试从缓存列表中获取基础信息作为降级
      // 注意：这里没有实时数据，只能显示名称
      if (allFundsCache) {
        const fund = allFundsCache.find(f => f.code === code);
        if (fund) {
          return {
            code: fund.code,
            name: fund.name,
            nav: 0,
            gsz: 0,
            gszzl: 0,
            gztime: '--'
          };
        }
      }
      console.warn(`Failed to fetch data for fund ${code}`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  
  const dataMap = {};
  results.forEach(item => {
    if (item) {
      dataMap[item.code] = item;
    }
  });
  
  return dataMap;
};

// 获取基金所有历史数据（包含净值走势等）
// 真实接口: http://fund.eastmoney.com/pingzhongdata/{code}.js
export const getFundChartData = async (code) => {
  try {
    const response = await fetch(`/api/pingzhongdata/${code}.js?rt=${Date.now()}`);
    if (!response.ok) throw new Error('Failed to fetch chart data');
    const text = await response.text();

    // 使用 new Function 执行脚本并提取变量，比正则更稳健，能处理嵌套数组
    const func = new Function(`${text}
      return { 
        name: (typeof fS_name !== 'undefined' ? fS_name : '${code}'), 
        netWorthTrend: (typeof Data_netWorthTrend !== 'undefined' ? Data_netWorthTrend : []), 
        acWorthTrend: (typeof Data_ACWorthTrend !== 'undefined' ? Data_ACWorthTrend : []) 
      };
    `);
    
    return func();
  } catch (error) {
    console.error('Error fetching fund chart data:', error);
    return null;
  }
};

// 获取基金历史净值列表 (分页)
// 真实接口: http://api.fund.eastmoney.com/f10/lsjz?fundCode={code}&pageIndex={page}&pageSize={size}
export const getFundHistory = async (code, page = 1, pageSize = 20) => {
  try {
    const response = await fetch(`/api/f10/lsjz?fundCode=${code}&pageIndex=${page}&pageSize=${pageSize}`);
    if (!response.ok) throw new Error('Failed to fetch history');
    const data = await response.json();
    
    // 返回结构: { Data: { LSJZList: [] }, TotalCount: 1000, ... }
    if (data.Data && data.Data.LSJZList) {
      return {
        list: data.Data.LSJZList, // { FSRQ: "2024-05-30", DWJZ: "1.0", LJJZ: "1.5", JZZZL: "0.5" }
        total: data.TotalCount
      };
    }
    return { list: [], total: 0 };
  } catch (error) {
    console.error('Error fetching fund history:', error);
    return { list: [], total: 0 };
  }
};
