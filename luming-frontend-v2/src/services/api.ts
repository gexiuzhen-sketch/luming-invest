/**
 * API Service
 * 统一的API调用服务，包含错误处理和Mock数据fallback
 */

import { INDUSTRY_CLASSIFICATION } from '../data/industryClassification';

const API_BASE = '/api';
const USE_MOCK = false; // 使用真实API数据（后端API + Nginx反向代理 + 实时行情从腾讯财经/Yahoo Finance获取）

// Mock数据
const MOCK_STOCKS = {
  A: [
    {
      code: '600519',
      name: '贵州茅台',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['600519']?.sector || '其他',
      price: 1455.02,
      change: -34.98,
      changePct: -2.35,
      volume: '3.2万',
      turnover: '46.5亿',
      pe: 30.8,
      roe: 25.3,
      rsi: 42.5,
      macd: 'death_cross',
      cap: '1.83万亿',
      why: '高端白酒龙头，品牌护城河深厚。近期回调提供较好入场机会，长期配置价值凸显。'
    },
    {
      code: '000858',
      name: '五粮液',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['000858']?.sector || '其他',
      price: 125.80,
      change: -2.70,
      changePct: -2.10,
      volume: '12.5万',
      turnover: '15.7亿',
      pe: 26.5,
      roe: 22.8,
      rsi: 45.2,
      macd: 'neutral',
      cap: '4890亿',
      why: '浓香型白酒龙头，估值已处于历史低位，具备安全边际，关注复苏预期。'
    },
    {
      code: '300750',
      name: '宁德时代',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['300750']?.sector || '其他',
      price: 178.50,
      change: -6.70,
      changePct: -3.62,
      volume: '28.3万',
      turnover: '50.5亿',
      pe: 38.5,
      roe: 21.5,
      rsi: 38.5,
      macd: 'death_cross',
      cap: '7850亿',
      why: '全球动力电池龙头，技术领先，短期回调后关注产业链修复机会。'
    },
    {
      code: '600036',
      name: '招商银行',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['600036']?.sector || '其他',
      price: 38.75,
      change: 0.05,
      changePct: 0.13,
      volume: '85.2万',
      turnover: '28.8亿',
      pe: 9.2,
      roe: 15.8,
      rsi: 58.5,
      macd: 'golden_cross',
      cap: '8500亿',
      why: '零售银行标杆，资产质量优秀，估值修复进行中，关注配置机会。'
    },
    {
      code: '000001',
      name: '平安银行',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['000001']?.sector || '其他',
      price: 12.85,
      change: 0.15,
      changePct: 1.18,
      volume: '125.3万',
      turnover: '16.1亿',
      pe: 5.8,
      roe: 11.2,
      rsi: 55.2,
      macd: 'golden_cross',
      cap: '2480亿',
      why: '零售银行龙头之一，资产质量优异，数字化转型领先，估值具备吸引力，长期配置价值凸显。'
    },
    {
      code: '601166',
      name: '兴业银行',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['601166']?.sector || '其他',
      price: 18.25,
      change: -0.35,
      changePct: -1.88,
      volume: '62.8万',
      turnover: '11.5亿',
      pe: 5.2,
      roe: 12.8,
      rsi: 48.5,
      macd: 'neutral',
      cap: '3800亿',
      why: '绿色金融先行者，投行与商行并重，资产结构优化，估值处于历史低位区域。'
    },
    {
      code: '601398',
      name: '工商银行',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['601398']?.sector || '其他',
      price: 5.82,
      change: 0.08,
      changePct: 1.39,
      volume: '156.5万',
      turnover: '9.1亿',
      pe: 4.8,
      roe: 10.5,
      rsi: 52.8,
      macd: 'golden_cross',
      cap: '1.98万亿',
      why: '宇宙行，规模最大，资产质量稳健，高分红率，长期价值投资的优质标的。'
    },
    {
      code: '601288',
      name: '农业银行',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['601288']?.sector || '其他',
      price: 4.25,
      change: 0.05,
      changePct: 1.19,
      volume: '185.2万',
      turnover: '7.8亿',
      pe: 4.2,
      roe: 9.8,
      rsi: 50.5,
      macd: 'neutral',
      cap: '1.42万亿',
      why: '国有大行，服务"三农"，资产规模大，不良率低，估值便宜，具备配置价值。'
    },
    {
      code: '600000',
      name: '浦发银行',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['600000']?.sector || '其他',
      price: 10.25,
      change: -0.18,
      changePct: -1.72,
      volume: '72.5万',
      turnover: '7.5亿',
      pe: 5.5,
      roe: 9.2,
      rsi: 45.8,
      macd: 'neutral',
      cap: '1980亿',
      why: '股份制银行，上海本地银行，长三角区域优势明显，资产质量持续改善。'
    },
    {
      code: '002142',
      name: '宁波银行',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['002142']?.sector || '其他',
      price: 22.85,
      change: 0.45,
      changePct: 2.01,
      volume: '28.5万',
      turnover: '6.5亿',
      pe: 7.2,
      roe: 16.5,
      rsi: 58.2,
      macd: 'golden_cross',
      cap: '1380亿',
      why: '城商行标杆，资产质量优异，长三角区域优势，成长性突出，估值合理。'
    },
    {
      code: '601318',
      name: '中国平安',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['601318']?.sector || '其他',
      price: 43.25,
      change: 0.95,
      changePct: 2.24,
      volume: '45.8万',
      turnover: '19.8亿',
      pe: 8.8,
      roe: 13.5,
      rsi: 52.8,
      macd: 'neutral',
      cap: '7880亿',
      why: '保险龙头，投资收益改善，代理人队伍企稳，估值处于历史低位，配置价值凸显。'
    },
    {
      code: '601336',
      name: '新华保险',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['601336']?.sector || '其他',
      price: 35.85,
      change: -0.75,
      changePct: -2.05,
      volume: '18.5万',
      turnover: '6.5亿',
      pe: 10.2,
      roe: 11.8,
      rsi: 46.5,
      macd: 'neutral',
      cap: '1180亿',
      why: '保险行业重要参与者，转型成效显著，估值合理，关注配置机会。'
    },
    {
      code: '600276',
      name: '恒瑞医药',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['600276']?.sector || '其他',
      price: 52.85,
      change: 1.35,
      changePct: 2.62,
      volume: '15.2万',
      turnover: '8.0亿',
      pe: 42.5,
      roe: 18.5,
      rsi: 58.5,
      macd: 'golden_cross',
      cap: '3420亿',
      why: '创新药龙头，研发实力强，产品线丰富，长期逻辑不变，调整后具备配置价值。'
    },
    {
      code: '000661',
      name: '长春高新',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['000661']?.sector || '其他',
      price: 125.40,
      change: 5.20,
      changePct: 4.33,
      volume: '8.5万',
      turnover: '10.7亿',
      pe: 38.5,
      roe: 20.2,
      rsi: 68.5,
      macd: 'golden_cross',
      cap: '505亿',
      why: '生物疫苗龙头，产品管线丰富，生长性突出，关注疫苗板块机会。'
    },
    {
      code: '300124',
      name: '汇川技术',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['300124']?.sector || '其他',
      price: 58.60,
      change: 2.85,
      changePct: 5.11,
      volume: '12.5万',
      turnover: '7.3亿',
      pe: 35.8,
      roe: 17.8,
      rsi: 62.8,
      macd: 'golden_cross',
      cap: '2450亿',
      why: '工控自动化龙头，国产化替代核心，技术领先，市场份额持续提升。'
    },
    {
      code: '002415',
      name: '海康威视',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['002415']?.sector || '其他',
      price: 32.85,
      change: 0.95,
      changePct: 2.98,
      volume: '22.8万',
      turnover: '7.5亿',
      pe: 18.5,
      roe: 19.2,
      rsi: 55.8,
      macd: 'neutral',
      cap: '3050亿',
      why: '安防视频监控龙头，AI落地先行者，海外市场拓展，创新业务持续推出。'
    },
    {
      code: '002594',
      name: '比亚迪',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['002594']?.sector || '其他',
      price: 235.60,
      change: -10.20,
      changePct: -4.15,
      volume: '18.5万',
      turnover: '43.5亿',
      pe: 32.5,
      roe: 19.5,
      rsi: 42.8,
      macd: 'neutral',
      cap: '6850亿',
      why: '新能源汽车销量领先，垂直一体化优势明显，短期调整后关注新能源板块机会。'
    },
    {
      code: '000333',
      name: '美的集团',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['000333']?.sector || '其他',
      price: 68.50,
      change: 3.30,
      changePct: 5.06,
      volume: '22.8万',
      turnover: '15.6亿',
      pe: 15.2,
      roe: 21.8,
      rsi: 62.5,
      macd: 'golden_cross',
      cap: '4780亿',
      why: '家电龙头，产品线齐全，海外布局成效显著，B端业务快速增长，表现稳健。'
    },
    {
      code: '600030',
      name: '中信证券',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['600030']?.sector || '其他',
      price: 22.85,
      change: 0.55,
      changePct: 2.47,
      volume: '95.8万',
      turnover: '22.0亿',
      pe: 15.8,
      roe: 8.5,
      rsi: 58.5,
      macd: 'golden_cross',
      cap: '1680亿',
      why: '券商龙头，业务布局全面，投行业务领先，资本市场改革受益标的。'
    },
    {
      code: '601888',
      name: '中国中免',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['601888']?.sector || '其他',
      price: 85.40,
      change: 2.80,
      changePct: 3.39,
      volume: '15.5万',
      turnover: '13.2亿',
      pe: 28.5,
      roe: 18.5,
      rsi: 62.5,
      macd: 'golden_cross',
      cap: '1780亿',
      why: '免税龙头，政策支持，消费复苏预期，长期配置价值凸显。'
    },
    {
      code: '600690',
      name: '海尔智家',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['600690']?.sector || '其他',
      price: 28.95,
      change: 0.95,
      changePct: 3.39,
      volume: '28.5万',
      turnover: '8.3亿',
      pe: 16.5,
      roe: 19.5,
      rsi: 58.5,
      macd: 'golden_cross',
      cap: '2580亿',
      why: '家电龙头，海外市场拓展成效显著，智慧家庭战略推进。'
    },
    {
      code: '000568',
      name: '泸州老窖',
      market: 'SZ',
      sector: '食品饮料',
      price: 198.50,
      change: -5.80,
      changePct: -2.84,
      volume: '8.5万',
      turnover: '16.8亿',
      pe: 28.5,
      roe: 22.5,
      rsi: 48.5,
      macd: 'neutral',
      cap: '2950亿',
      why: '浓香型白酒龙头，品牌力强，高端产品占比提升，关注配置机会。'
    },
    {
      code: '603259',
      name: '药明康德',
      market: 'SH',
      sector: '医药生物',
      price: 65.80,
      change: 2.35,
      changePct: 3.70,
      volume: '18.5万',
      turnover: '12.2亿',
      pe: 28.5,
      roe: 15.5,
      rsi: 58.5,
      macd: 'golden_cross',
      cap: '1950亿',
      why: 'CXO龙头，全球布局，订单饱满，长期成长逻辑不变。'
    },
    {
      code: '300015',
      name: '爱尔眼科',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['300015']?.sector || '其他',
      price: 18.85,
      change: 0.55,
      changePct: 3.00,
      volume: '25.8万',
      turnover: '4.9亿',
      pe: 38.5,
      roe: 22.5,
      rsi: 55.8,
      macd: 'neutral',
      cap: '980亿',
      why: '眼科医疗服务龙头，扩张能力强，业绩增长稳健，关注长期配置。'
    },
    {
      code: '688111',
      name: '金山办公',
      market: 'SH',
      sector: INDUSTRY_CLASSIFICATION['688111']?.sector || '其他',
      price: 285.60,
      change: 12.50,
      changePct: 4.58,
      volume: '5.8万',
      turnover: '16.5亿',
      pe: 55.8,
      roe: 18.5,
      rsi: 68.5,
      macd: 'golden_cross',
      cap: '1320亿',
      why: '办公软件龙头，AI助手商业化加速，订阅制转型成效显著。'
    },
    {
      code: '002475',
      name: '立讯精密',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['002475']?.sector || '其他',
      price: 32.85,
      change: 1.55,
      changePct: 4.96,
      volume: '35.8万',
      turnover: '11.8亿',
      pe: 25.5,
      roe: 22.5,
      rsi: 62.5,
      macd: 'golden_cross',
      cap: '2350亿',
      why: '精密制造龙头，苹果产业链核心供应商，汽车电子业务快速增长。'
    },
    {
      code: '300059',
      name: '东方财富',
      market: 'SZ',
      sector: INDUSTRY_CLASSIFICATION['300059']?.sector || '其他',
      price: 15.85,
      change: 0.65,
      changePct: 4.28,
      volume: '185.5万',
      turnover: '29.5亿',
      pe: 28.5,
      roe: 12.5,
      rsi: 58.5,
      macd: 'golden_cross',
      cap: '2580亿',
      why: '互联网券商龙头，流量优势显著，资本市场活跃受益。'
    },
    {
      code: '300174',
      name: '汤臣倍健',
      market: 'SZ',
      sector: '医药生物',
      price: 18.50,
      change: 0.45,
      changePct: 2.49,
      volume: '25.8万',
      turnover: '4.8亿',
      pe: 22.5,
      roe: 18.5,
      rsi: 55.8,
      macd: 'golden_cross',
      cap: '310亿',
      why: '膳食营养补充剂龙头，品牌认知度高，渠道完善，VDS新业务增长潜力大。'
    },
    {
      code: '688256',
      name: '智谱AI',
      market: 'SH',
      sector: '计算机',
      price: 85.60,
      change: 3.20,
      changePct: 3.88,
      volume: '8.5万',
      turnover: '7.3亿',
      pe: 0,
      roe: -5.2,
      rsi: 58.5,
      macd: 'neutral',
      cap: '205亿',
      why: 'AI大模型独角兽，ChatGLM系列领先，B端和C端应用快速落地，长期成长空间广阔。'
    },
    {
      code: '300367',
      name: '东方网力',
      market: 'SZ',
      sector: '计算机',
      price: 12.85,
      change: 0.35,
      changePct: 2.80,
      volume: '15.5万',
      turnover: '2.0亿',
      pe: 35.5,
      roe: 8.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '102亿',
      why: '视频监控AI化领先，GPT赋能智慧物联，城市数字化建设受益标的。'
    }
  ],
  HK: [
    {
      code: '00700',
      name: '腾讯控股',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['00700']?.sector || '其他',
      price: 298.40,
      change: -21.60,
      changePct: -6.75,
      volume: '2850万',
      turnover: '85.3亿',
      pe: 16.8,
      roe: 14.2,
      rsi: 35.5,
      macd: 'death_cross',
      cap: '2.8万亿',
      why: '互联网巨头，短期调整后关注核心业务复苏，AI商业化加速落地。'
    },
    {
      code: '09988',
      name: '阿里巴巴',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['09988']?.sector || '其他',
      price: 72.85,
      change: -5.65,
      changePct: -7.20,
      volume: '3.2亿',
      turnover: '231.8亿',
      pe: 11.2,
      roe: 10.5,
      rsi: 32.8,
      macd: 'death_cross',
      cap: '1.5万亿',
      why: '电商龙头，云计算和AI布局领先，估值处于历史低位，回购力度大，关注配置机会。'
    },
    {
      code: '01810',
      name: '小米集团',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['01810']?.sector || '其他',
      price: 34.90,
      change: -0.28,
      changePct: -0.80,
      volume: '3.2亿',
      turnover: '112.5亿',
      pe: 22.5,
      roe: 15.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '8650亿',
      why: '手机业务稳健，汽车业务放量，AIoT生态完善，人车家全场景战略推进。'
    },
    {
      code: '02318',
      name: '中国平安',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['02318']?.sector || '其他',
      price: 40.55,
      change: 0.09,
      changePct: 0.22,
      volume: '3200万',
      turnover: '13.0亿',
      pe: 7.8,
      roe: 11.8,
      rsi: 52.5,
      macd: 'neutral',
      cap: '7350亿',
      why: '保险龙头，投资收益改善，代理人队伍企稳，估值处于历史低位。'
    },
    {
      code: '00941',
      name: '中国移动',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['00941']?.sector || '其他',
      price: 71.25,
      change: -1.25,
      changePct: -1.72,
      volume: '1850万',
      turnover: '13.2亿',
      pe: 9.8,
      roe: 10.2,
      rsi: 48.5,
      macd: 'neutral',
      cap: '1.48万亿',
      why: '电信龙头，5G用户规模领先，云计算业务快速增长，高分红率具备配置价值。'
    },
    {
      code: '03690',
      name: '美团',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['03690']?.sector || '其他',
      price: 125.60,
      change: -8.50,
      changePct: -6.34,
      volume: '8500万',
      turnover: '108.5亿',
      pe: 22.5,
      roe: 8.5,
      rsi: 38.5,
      macd: 'death_cross',
      cap: '7350亿',
      why: '本地生活服务龙头，外卖业务稳健，到店酒旅恢复，关注业绩改善。'
    },
    {
      code: '00772',
      name: '阅文集团',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['00772']?.sector || '其他',
      price: 28.50,
      change: -1.85,
      changePct: -6.09,
      volume: '2800万',
      turnover: '8.0亿',
      pe: 25.8,
      roe: 8.5,
      rsi: 42.5,
      macd: 'neutral',
      cap: '285亿',
      why: '网文龙头，IP变现能力提升，短剧业务快速增长，关注内容生态。'
    },
    {
      code: '02020',
      name: '安踏体育',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['02020']?.sector || '其他',
      price: 88.50,
      change: 0.62,
      changePct: 0.71,
      volume: '1500万',
      turnover: '13.2亿',
      pe: 18.5,
      roe: 16.5,
      rsi: 55.5,
      macd: 'neutral',
      cap: '2380亿',
      why: '运动服饰龙头，品牌矩阵完善，DTC渠道转型，业绩增长稳健。'
    },
    {
      code: '01024',
      name: '快手',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['01024']?.sector || '其他',
      price: 52.85,
      change: -3.25,
      changePct: -5.80,
      volume: '9500万',
      turnover: '51.5亿',
      pe: 32.5,
      roe: 6.5,
      rsi: 40.5,
      macd: 'death_cross',
      cap: '2280亿',
      why: '短视频平台，电商业务快速增长，盈利能力改善，关注商业化进展。'
    },
    {
      code: '01919',
      name: '中远海控',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['01919']?.sector || '其他',
      price: 15.18,
      change: 0.09,
      changePct: 0.60,
      volume: '8500万',
      turnover: '12.8亿',
      pe: 6.8,
      roe: 22.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '1950亿',
      why: '航运龙头，运价企稳回升，业绩稳健，高分红率，关注周期配置。'
    },
    {
      code: '00981',
      name: '中芯国际',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['00981']?.sector || '其他',
      price: 18.50,
      change: -0.75,
      changePct: -3.90,
      volume: '1.85亿',
      turnover: '35.5亿',
      pe: 28.5,
      roe: 6.5,
      rsi: 42.5,
      macd: 'neutral',
      cap: '1480亿',
      why: '晶圆代工龙头，国产替代核心，技术追赶加速，关注长期配置。'
    },
    {
      code: '00388',
      name: '港交所',
      market: 'HK',
      sector: INDUSTRY_CLASSIFICATION['00388']?.sector || '其他',
      price: 285.60,
      change: 12.50,
      changePct: 4.58,
      volume: '850万',
      turnover: '24.5亿',
      pe: 32.5,
      roe: 18.5,
      rsi: 58.5,
      macd: 'golden_cross',
      cap: '3650亿',
      why: '交易所龙头，资本市场活跃受益，新经济公司上市，关注配置机会。'
    }
  ],
  US: [
    {
      code: 'AAPL',
      name: '苹果',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['AAPL']?.sector || '其他',
      price: 257.46,
      change: -2.83,
      changePct: -1.09,
      volume: '4100万',
      turnover: '105.7亿',
      pe: 32.6,
      roe: 34.5,
      rsi: 55.2,
      macd: 'neutral',
      cap: '3.78万亿美元',
      why: '全球消费电子龙头，iPhone销量稳健，服务业务持续增长，AI技术领先。'
    },
    {
      code: 'NVDA',
      name: '英伟达',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['NVDA']?.sector || '其他',
      price: 177.82,
      change: -5.52,
      changePct: -3.01,
      volume: '1.89亿',
      turnover: '340.5亿',
      pe: 36.3,
      roe: 42.5,
      rsi: 48.5,
      macd: 'neutral',
      cap: '4.32万亿美元',
      why: 'AI芯片绝对龙头，数据中心业务爆发式增长，Blackwell架构发布推动算力革命。'
    },
    {
      code: 'TSLA',
      name: '特斯拉',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['TSLA']?.sector || '其他',
      price: 396.73,
      change: -8.82,
      changePct: -2.17,
      volume: '6400万',
      turnover: '255.0亿',
      pe: 367.3,
      roe: 18.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '1.49万亿美元',
      why: '电动车龙头，FSD进展超预期，Robotaxi业务持续推进，业绩大幅改善。'
    },
    {
      code: 'MSFT',
      name: '微软',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['MSFT']?.sector || '其他',
      price: 408.96,
      change: -1.72,
      changePct: -0.42,
      volume: '3100万',
      turnover: '127.7亿',
      pe: 25.6,
      roe: 36.8,
      rsi: 52.8,
      macd: 'neutral',
      cap: '3.04万亿美元',
      why: '云计算和办公软件龙头，AI集成领先，业绩确定性高，OpenAI合作深化，短期回调后关注。'
    },
    {
      code: 'GOOGL',
      name: '谷歌',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['GOOGL']?.sector || '其他',
      price: 298.52,
      change: -2.36,
      changePct: -0.78,
      volume: '2560万',
      turnover: '76.4亿',
      pe: 27.6,
      roe: 25.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '3.61万亿美元',
      why: '搜索广告龙头，云业务快速增长，AI模型Gemini领先，YouTube生态完善。'
    },
    {
      code: 'AMZN',
      name: '亚马逊',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['AMZN']?.sector || '其他',
      price: 213.21,
      change: -5.73,
      changePct: -2.62,
      volume: '5100万',
      turnover: '109.7亿',
      pe: 29.7,
      roe: 18.5,
      rsi: 48.5,
      macd: 'neutral',
      cap: '2.29万亿美元',
      why: '电商与云服务龙头，AWS业务稳健，AI布局加速，零售业务改善。'
    },
    {
      code: 'META',
      name: 'Meta',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['META']?.sector || '其他',
      price: 644.86,
      change: -15.71,
      changePct: -2.38,
      volume: '1300万',
      turnover: '84.8亿',
      pe: 27.5,
      roe: 32.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '1.63万亿美元',
      why: '社交媒体龙头，广告业务强劲，AI投资加大，元宇宙长期布局。'
    },
    {
      code: 'BRK.B',
      name: '伯克希尔',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['BRK.B']?.sector || '其他',
      price: 498.98,
      change: -1.42,
      changePct: -0.28,
      volume: '556万',
      turnover: '27.6亿',
      pe: 16.1,
      roe: 10.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '1.08万亿美元',
      why: '巴菲特旗下投资旗舰，价值投资标杆，持仓优质，长期稳健增长。'
    },
    {
      code: 'TSM',
      name: '台积电',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['TSM']?.sector || '其他',
      price: 338.89,
      change: -14.97,
      changePct: -4.23,
      volume: '1380万',
      turnover: '47.3亿',
      pe: 32.2,
      roe: 22.5,
      rsi: 48.5,
      macd: 'neutral',
      cap: '1.76万亿美元',
      why: '全球晶圆代工龙头，技术领先，AI芯片需求旺盛，长期配置价值凸显。'
    },
    {
      code: 'AVGO',
      name: '博通',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['AVGO']?.sector || '其他',
      price: 330.48,
      change: -2.29,
      changePct: -0.69,
      volume: '3920万',
      turnover: '131.4亿',
      pe: 64.5,
      roe: 38.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '1.57万亿美元',
      why: '半导体龙头，已完成10:1拆股，AI芯片需求旺盛，VMware整合顺利，数据中心业务强劲。'
    },
    {
      code: 'NFLX',
      name: '奈飞',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['NFLX']?.sector || '其他',
      price: 99.02,
      change: -0.15,
      changePct: -0.15,
      volume: '4120万',
      turnover: '40.7亿',
      pe: 39.1,
      roe: 42.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '4180亿美元',
      why: '流媒体龙头，订阅增长稳健，广告业务加速，内容投入产出比提升。'
    },
    {
      code: 'ADBE',
      name: 'Adobe',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['ADBE']?.sector || '其他',
      price: 283.62,
      change: 1.88,
      changePct: 0.67,
      volume: '480万',
      turnover: '13.5亿',
      pe: 17.0,
      roe: 28.5,
      rsi: 48.5,
      macd: 'neutral',
      cap: '1164亿美元',
      why: '创意软件龙头，AI工具集成领先，Firefly商业化加速，订阅制转型成功。'
    },
    {
      code: 'CRM',
      name: 'Salesforce',
      market: 'US',
      sector: INDUSTRY_CLASSIFICATION['CRM']?.sector || '其他',
      price: 202.11,
      change: 0.72,
      changePct: 0.36,
      volume: '970万',
      turnover: '19.4亿',
      pe: 25.9,
      roe: 18.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '1865亿美元',
      why: 'CRM龙头，云服务领先，AI集成加速，业绩增长稳健。'
    },
    {
      code: 'NOK',
      name: '诺基亚',
      market: 'US',
      sector: '通信设备',
      price: 7.74,
      change: -0.11,
      changePct: -1.40,
      volume: '4350万',
      turnover: '3.4亿',
      pe: 54.9,
      roe: 12.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '432亿美元',
      why: '通信设备龙头，5G网络建设受益者，B2B数字化转型持续推进，估值处于历史低位。'
    }
  ],
  FUND: [
    {
      code: '110011',
      name: '易方达优质精选',
      market: 'FUND',
      sector: '混合型',
      price: 2.785,
      change: -0.065,
      changePct: -2.28,
      volume: '5200万',
      turnover: '1.45亿',
      pe: 0,
      roe: 17.5,
      rsi: 52.5,
      macd: 'neutral',
      cap: '145亿',
      why: '基金经理经验丰富，长期业绩优秀，持仓均衡，适合长期配置，近期净值小幅回调。'
    },
    {
      code: '163406',
      name: '兴全合润',
      market: 'FUND',
      sector: '混合型',
      price: 3.185,
      change: -0.065,
      changePct: -2.00,
      volume: '2800万',
      turnover: '0.9亿',
      pe: 0,
      roe: 16.2,
      rsi: 50.2,
      macd: 'neutral',
      cap: '195亿',
      why: '价值投资理念，长期穿越牛熊，风控能力突出，基金经理风格稳定，回调后关注配置机会。'
    },
    {
      code: '000961',
      name: '天弘沪深300ETF',
      market: 'FUND',
      sector: '指数型',
      price: 1.828,
      change: -0.022,
      changePct: -1.19,
      volume: '8200万',
      turnover: '1.5亿',
      pe: 0,
      roe: 12.2,
      rsi: 48.5,
      macd: 'neutral',
      cap: '495亿',
      why: '跟踪沪深300指数，费率低廉，适合长期配置和定投，近期跟随市场调整。'
    },
    {
      code: '161725',
      name: '招商中证白酒',
      market: 'FUND',
      sector: '指数型',
      price: 1.128,
      change: -0.022,
      changePct: -1.91,
      volume: '6500万',
      turnover: '7350万',
      pe: 0,
      roe: 21.5,
      rsi: 50.5,
      macd: 'neutral',
      cap: '295亿',
      why: '跟踪中证白酒指数，行业集中度高，弹性大，白酒板块回调后关注定投机会。'
    },
    {
      code: '510300',
      name: '华泰柏瑞沪深300ETF',
      market: 'FUND',
      sector: '指数型',
      price: 4.485,
      change: -0.095,
      changePct: -2.07,
      volume: '1.15亿',
      turnover: '5.2亿',
      pe: 0,
      roe: 12.8,
      rsi: 49.2,
      macd: 'neutral',
      cap: '1180亿',
      why: '规模最大的沪深300ETF，流动性好，适合大资金配置，跟踪指数紧密。'
    }
  ]
};

const MOCK_SIGNALS = {
  '600519': {
    signal: 'BUY',
    price: 1650.00,
    targetPrice: 1850.00,
    stopLoss: 1550.00,
    reason: '突破关键阻力位，成交量放大，建议买入',
    timeframe: '短期'
  },
  '00700': {
    signal: 'BUY',
    price: 320.00,
    targetPrice: 360.00,
    stopLoss: 300.00,
    reason: '业绩超预期，技术面强势',
    timeframe: '中期'
  }
};

/**
 * 通用API请求函数
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn(`API request failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * 获取股票推荐
 *
 * 数据更新频率说明：
 * 1. 行情数据（价格/涨跌幅）: 实时从腾讯财经/Yahoo Finance获取（延迟1-3秒）
 *    - A股/港股: 腾讯财经API（https://qt.gtimg.cn）
 *    - 美股: Yahoo Finance API（主）/ 腾讯财经（备）
 *    - 价格缓存: 5分钟有效期（localStorage: luming_price_cache）
 *
 * 2. 股票评分: 客户端实时计算
 *    - 多因子模型（价值/成长/质量/技术/情绪/波动）
 *    - 基于最新行情数据动态计算
 *    - 无缓存，每次查看重新计算
 *
 * 3. 买卖信号: 客户端实时计算
 *    - 基于评分和风险等级生成
 *    - 与评分同步更新
 *    - 无后台定时任务
 *
 * 4. 数据刷新机制: 按需获取（用户主动触发）
 *    - 切换市场标签时刷新
 *    - 查看股票详情时刷新
 *    - 无自动后台轮询
 * 使用统一的分析引擎计算评分，确保列表页和详情页评分一致
 * 集成腾讯财经实时数据，提升数据时效性
 */
export async function getStockRecommendations(market: string) {
  console.log('Fetching stock recommendations for market:', market);

  // 获取对应市场的Mock数据
  let mockData = MOCK_STOCKS.A as any[]; // 默认A股

  if (market === 'HK') {
    mockData = MOCK_STOCKS.HK;
  } else if (market === 'US') {
    mockData = MOCK_STOCKS.US;
  } else if (market === 'FUND') {
    mockData = MOCK_STOCKS.FUND;
  } else {
    mockData = MOCK_STOCKS.A;
  }

  if (!mockData || mockData.length === 0) {
    console.error('No mock data found for market:', market);
    return [];
  }

  // 尝试从腾讯财经获取实时价格（A股、港股、美股）
  let realtimePrices: Record<string, any> = {};
  const codes = mockData.map(s => s.code);

  try {
    // 动态导入腾讯财经实时数据服务
    const tencentRealtimeModule = await import('./tencentRealtime');

    if (market === 'HK') {
      realtimePrices = await tencentRealtimeModule.getHKStockRealtime(codes);
    } else if (market === 'US') {
      realtimePrices = await tencentRealtimeModule.getUSStockRealtime(codes);
    } else if (market === 'A' || market === 'SH' || market === 'SZ') {
      // 使用优化的实时数据获取（腾讯+新浪备用）
      realtimePrices = await tencentRealtimeModule.getAStockRealtimeOptimized
        ? await tencentRealtimeModule.getAStockRealtimeOptimized(codes)
        : await tencentRealtimeModule.getAStockRealtime(codes);
    }
    // 基金使用静态数据服务（每日更新）
    if (market === 'FUND') {
      try {
        const fundService = await import('./fundDataService');
        const fundDataMap = fundService.getFundBatchData(codes);

        // 将基金数据转换为实时价格格式
        Object.entries(fundDataMap).forEach(([code, fundData]) => {
          realtimePrices[code] = {
            price: fundData.price,
            changePct: fundData.changePct,
            name: fundData.name,
          };
        });

        console.log(`✅ 使用基金静态数据服务，共 ${Object.keys(realtimePrices).length} 只基金`);
      } catch (error) {
        console.warn('Failed to load fund data:', error);
      }
    }

    if (Object.keys(realtimePrices).length > 0) {
      console.log(`✅ Updated ${Object.keys(realtimePrices).length} stock prices from data sources`);
    }
  } catch (error) {
    console.warn('Failed to fetch real-time prices from Tencent:', error);
  }

  // Phase 1: 从后端批量获取真实财务数据（PE/ROE/增速等）
  let fundamentalsMap: Record<string, any> = {};
  if (market !== 'FUND') {
    try {
      const fundamentalResults = await Promise.allSettled(
        codes.map(async (code: string) => {
          const resp = await fetch(`/api/financial/fundamentals/${code}`);
          if (!resp.ok) return null;
          return resp.json();
        })
      );
      fundamentalResults.forEach((result, i) => {
        if (result.status === 'fulfilled' && result.value) {
          fundamentalsMap[codes[i]] = result.value;
        }
      });
      if (Object.keys(fundamentalsMap).length > 0) {
        console.log(`📊 获取 ${Object.keys(fundamentalsMap).length} 只股票真实财务数据`);
      }
    } catch (error) {
      console.warn('Failed to fetch fundamentals:', error);
    }
  }

  // 使用优化版分析引擎计算评分（多因子模型 + 动态权重 + 风险调整）
  const { analyzeStockOptimized } = await import('./stockAnalyzerOptimized');

  // 为每只股票计算统一的评分，并更新实时价格 + 真实财务数据
  const stocksWithScore = mockData.map(stock => {
    // 如果有实时数据，更新价格和涨跌幅
    const realtimeData = realtimePrices[stock.code];
    const fundamentals = fundamentalsMap[stock.code];

    const updatedStock = {
      ...stock,
      ...(realtimeData ? {
        price: realtimeData.price,
        changePct: realtimeData.changePct,
        isRealtime: true,
      } : {}),
      // 用真实财务数据覆盖 mock 值
      ...(fundamentals ? {
        pe: fundamentals.pe_ttm ?? stock.pe,
        pb: fundamentals.pb,
        roe: fundamentals.roe ?? stock.roe,
        marketCap: fundamentals.market_cap,
        revenueGrowthYoy: fundamentals.revenue_growth_yoy,
        netIncomeGrowthYoy: fundamentals.net_income_growth_yoy,
        netMargin: fundamentals.net_margin,
        debtRatio: fundamentals.debt_ratio,
        eps: fundamentals.eps,
        dividendYield: fundamentals.dividend_yield,
      } : {}),
    };

    const analysis = analyzeStockOptimized(updatedStock);

    // 根据评分和风险等级决定时机
    // 高分股票即使风险高也应该推荐，但可以调整推荐强度
    let timing = 'wait';
    let timingText = '等待机会';
    if (analysis.overallScore >= 85) {
      // 85分以上，无论风险等级都是强烈推荐
      timing = 'buy_now';
      timingText = '强烈推荐';
    } else if (analysis.overallScore >= 75) {
      // 75-84分，高风险降为"建议买入"，低风险为"强烈推荐"
      if (analysis.riskLevel === 'high') {
        timing = 'buy_soon';
        timingText = '建议买入';
      } else {
        timing = 'buy_now';
        timingText = '强烈推荐';
      }
    } else if (analysis.overallScore >= 65 && analysis.riskLevel !== 'high') {
      // 65-74分，低风险为"建议买入"
      timing = 'buy_soon';
      timingText = '建议买入';
    } else if (analysis.overallScore >= 50) {
      // 50-64分为"持有观望"
      timing = 'hold';
      timingText = '持有观望';
    } else {
      // 50分以下为"建议规避"
      timing = 'avoid';
      timingText = '建议规避';
    }

    return {
      ...updatedStock,
      score: analysis.overallScore,
      timing,
      timingText,
      riskLevel: analysis.riskLevel,  // 新增风险等级
      recommendation: analysis.recommendation,  // 新增建议
      confidence: analysis.confidence,  // 新增信心度
    };
  });

  // 按评分排序
  stocksWithScore.sort((a, b) => (b.score || 0) - (a.score || 0));

  return stocksWithScore as any[];
}

/**
 * 获取交易信号
 */
export async function getTradingSignals(code: string) {
  try {
    const data = await request<any>(`/signals?code=${code}`);
    return data;
  } catch (error) {
    console.log('Using mock data for trading signals');
    const mockData = MOCK_SIGNALS[code as keyof typeof MOCK_SIGNALS];
    if (mockData) {
      return mockData;
    }
    // 返回默认信号
    return {
      signal: 'HOLD',
      price: 100,
      targetPrice: 110,
      stopLoss: 95,
      reason: '暂无明显交易信号，建议持有观望',
      timeframe: '短期'
    };
  }
}

/**
 * 发送验证码
 */
export async function sendVerificationCode(phone: string) {
  try {
    const data = await request<{ success: boolean; message?: string }>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    });
    return data;
  } catch (error) {
    console.log('Mock: sending verification code');
    return { success: true };
  }
}

// 本地凭证存储 key
const LOCAL_CREDENTIALS_KEY = 'lm_credentials';

interface LocalCredential {
  username: string;
  password: string; // 原文存储（客户端本地，无后端加密）
  createdAt: string;
  id: string;
}

function getLocalCredentials(): Record<string, LocalCredential> {
  try {
    const stored = localStorage.getItem(LOCAL_CREDENTIALS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

/**
 * 注册（优先注册到服务端，服务端不可用时 fallback 到本地）
 * 用户名区分大小写
 */
export async function registerLocal(username: string, password: string): Promise<{ user: { id: string; phone: string; membershipLevel: string } }> {
  try {
    // 先尝试服务端注册
    const data = await request<{ success: boolean; user: { id: string; phone: string; membershipLevel: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // 同时保存到 localStorage 作为离线 fallback
    const credentials = getLocalCredentials();
    credentials[username] = { username, password, createdAt: new Date().toISOString(), id: data.user.id };
    localStorage.setItem(LOCAL_CREDENTIALS_KEY, JSON.stringify(credentials));
    import('./statsService').then(({ trackRegistration }) => { trackRegistration(username); });
    return data;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);
    // 409 = 用户名已存在（服务端明确告知）
    if (errMsg.includes('API Error: 409') || errMsg.includes('用户名已存在')) {
      throw new Error('用户名已存在');
    }
    // 服务端不可用 → 本地注册
    console.warn('[Auth] Server register failed, falling back to local:', errMsg);
    const credentials = getLocalCredentials();
    if (credentials[username]) {
      throw new Error('用户名已存在');
    }
    const id = `local_${Date.now()}`;
    credentials[username] = { username, password, createdAt: new Date().toISOString(), id };
    localStorage.setItem(LOCAL_CREDENTIALS_KEY, JSON.stringify(credentials));
    import('./statsService').then(({ trackRegistration }) => { trackRegistration(username); });
    return { user: { id, phone: username, membershipLevel: 'free' } };
  }
}

/**
 * 登录
 * 优先使用服务端认证（跨设备），服务端不可用时 fallback 到本地
 * 用户名和密码均区分大小写
 */
export async function login(username: string, password: string) {
  try {
    const data = await request<{
      user: { id: string; phone: string; membershipLevel: string };
      token?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // 登录成功后缓存到本地，方便离线使用
    const credentials = getLocalCredentials();
    credentials[username] = { username, password, createdAt: new Date().toISOString(), id: data.user.id };
    localStorage.setItem(LOCAL_CREDENTIALS_KEY, JSON.stringify(credentials));
    return data;
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error);

    // 服务端返回明确的认证错误（401/404）→ 也尝试本地 fallback（兼容旧账号）
    // 服务端不可达（网络错误等）→ 同样走本地 fallback
    const credentials = getLocalCredentials();
    const credential = credentials[username];

    if (credential && credential.password === password) {
      // 本地凭证匹配 → 登录成功（兼容旧账号或离线场景）
      console.log('[Auth] Local credential fallback for:', username);
      return { user: { id: credential.id, phone: username, membershipLevel: 'free' } };
    }

    // 本地也没有 → 根据服务端错误返回合适提示
    if (errMsg.includes('API Error: 401')) throw new Error('密码错误');
    if (errMsg.includes('API Error: 404')) throw new Error('用户名不存在，请先注册');
    // 本地有用户名但密码错 → 密码错误
    if (credential) throw new Error('密码错误');
    throw new Error('用户名不存在，请先注册');
  }
}

/**
 * 持仓分析
 */
export async function analyzePortfolio(holdings: Array<{ code: string; quantity: number; costPrice: number }>) {
  try {
    const data = await request<any>('/portfolio/analyze', {
      method: 'POST',
      body: JSON.stringify({ holdings }),
    });
    return data;
  } catch (error) {
    console.log('Mock: portfolio analysis');
    return {
      totalValue: holdings.reduce((sum, h) => sum + h.quantity * h.costPrice * 1.1, 0),
      analysis: '您的持仓整体健康，建议适当分散风险，关注成长性标的。'
    };
  }
}

/**
 * 验证价格数据是否有效
 * 增强版：更严格的数据质量检查
 */
function isValidPriceData(data: any): boolean {
  if (!data || typeof data !== 'object') return false;

  // 检查价格是否是有效数字
  const price = data.price;
  if (typeof price !== 'number' || isNaN(price) || price <= 0 || price > 1000000) {
    return false;
  }

  // 检查涨跌幅是否合理
  // A股: ±10%/±20%(创业板/科创板)
  // 港股: 无涨跌限制，但单日超过30%需警告
  // 美股: 无涨跌限制，但单日超过50%需警告
  const changePct = data.changePct;
  if (typeof changePct !== 'number' || isNaN(changePct) || changePct < -99 || changePct > 99) {
    return false;
  }

  // 检查价格是否异常（如涨跌停价格）
  // 如果涨跌幅恰好等于10%/20%，且价格是整数，可能是涨跌停数据异常
  if (Math.abs(changePct) >= 9.9 && Math.abs(changePct) <= 10.1 && Number.isInteger(price)) {
    console.warn(`⚠️ 可疑涨跌停数据: price=${price}, changePct=${changePct}%`);
  }

  return true;
}

/**
 * 数据质量评分（0-100）
 * 用于评估价格数据的可靠性
 */
function getDataQualityScore(data: any): number {
  let score = 100;

  // 检查1: 价格非零
  if (!data.price || data.price <= 0) {
    score -= 50;
  }

  // 检查2: 涨跌幅合理
  const changePct = Math.abs(data.changePct || 0);
  if (changePct > 20) score -= 20;  // 单日涨跌超过20%扣分
  if (changePct > 30) score -= 30;  // 单日涨跌超过30%再扣分

  // 检查3: 价格与昨收的关系
  if (data.preClose && data.preClose > 0) {
    const calculatedChangePct = ((data.price - data.preClose) / data.preClose) * 100;
    const reportedChangePct = data.changePct || 0;
    const diff = Math.abs(calculatedChangePct - reportedChangePct);

    // 如果计算出的涨跌幅与报告的涨跌幅差异超过1%，数据可能有问题
    if (diff > 1) {
      score -= 20;
    }
  }

  // 检查4: 时间戳（如果有）
  if (data.timestamp) {
    const dataAge = Date.now() - new Date(data.timestamp).getTime();
    if (dataAge > 60000) {  // 数据超过1分钟
      score -= Math.min(30, Math.floor(dataAge / 60000) * 5);
    }
  }

  return Math.max(0, score);
}

/**
 * 获取股票实时价格（用于自选股和持仓）
 * 改进版：对每个股票分别验证，无效的从MOCK数据补充
 */
export async function getStockPrices(codes: string[]) {
  if (!codes || codes.length === 0) {
    return {};
  }

  const prices: Record<string, { price: number; changePct: number }> = {};
  const codesNeedingMock: string[] = [];

  // 1. 首先尝试后端API批量获取价格
  try {
    const data = await request<{data: Record<string, { price: number; changePct: number }>}>
      (`/stocks/prices?codes=${codes.join(',')}`);

    if (data && data.data && Object.keys(data.data).length > 0) {
      // 验证后端返回的数据
      Object.entries(data.data).forEach(([code, priceData]) => {
        if (isValidPriceData(priceData)) {
          prices[code] = priceData;
          const qualityScore = getDataQualityScore(priceData);
          console.log(`✅ Backend ${code}: price=${priceData.price}, changePct=${priceData.changePct}%, quality=${qualityScore}`);
        } else {
          console.warn(`⚠️ Backend API returned invalid data for ${code}:`, priceData);
          codesNeedingMock.push(code);
        }
      });
    } else {
      // 后端没返回任何数据，所有股票都需要从MOCK获取
      codesNeedingMock.push(...codes);
    }
  } catch (error) {
    console.warn(`[${new Date().toISOString()}] [Fallback] Backend API failed, trying Tencent Finance:`, error);
    codesNeedingMock.push(...codes);
  }

  // 2. 对缺失/无效的股票，尝试腾讯财经API
  const aStockCodes = codesNeedingMock.filter(c => /^\d{6}$/.test(c));
  const hkStockCodes = codesNeedingMock.filter(c => /^\d{5}$/.test(c));
  const usStockCodes = codesNeedingMock.filter(c => /[A-Za-z]/.test(c));

  try {
    const tencentRealtimeModule = await import('./tencentRealtime');

    // 获取A股实时价格
    if (aStockCodes.length > 0) {
      const aStockData = await tencentRealtimeModule.getAStockRealtimeOptimized
        ? await tencentRealtimeModule.getAStockRealtimeOptimized(aStockCodes)
        : await tencentRealtimeModule.getAStockRealtime(aStockCodes);
      Object.entries(aStockData).forEach(([code, data]: [string, any]) => {
        if (isValidPriceData(data)) {
          prices[code] = { price: data.price, changePct: data.changePct };
          console.log(`✅ Tencent ${code}: price=${data.price}, changePct=${data.changePct}%`);
          const idx = codesNeedingMock.indexOf(code);
          if (idx > -1) codesNeedingMock.splice(idx, 1);
        }
      });
    }

    // 获取港股实时价格
    if (hkStockCodes.length > 0) {
      const hkStockData = await tencentRealtimeModule.getHKStockRealtime(hkStockCodes);
      Object.entries(hkStockData).forEach(([code, data]: [string, any]) => {
        if (isValidPriceData(data)) {
          prices[code] = { price: data.price, changePct: data.changePct };
          console.log(`✅ Tencent HK ${code}: price=${data.price}, changePct=${data.changePct}%`);
          const idx = codesNeedingMock.indexOf(code);
          if (idx > -1) codesNeedingMock.splice(idx, 1);
        }
      });
    }

    // 获取美股实时价格
    if (usStockCodes.length > 0) {
      const usStockData = await tencentRealtimeModule.getUSStockRealtime(usStockCodes);
      Object.entries(usStockData).forEach(([code, data]: [string, any]) => {
        if (isValidPriceData(data)) {
          prices[code] = { price: data.price, changePct: data.changePct };
          console.log(`✅ Tencent US ${code}: price=${data.price}, changePct=${data.changePct}%`);
          const idx = codesNeedingMock.indexOf(code);
          if (idx > -1) codesNeedingMock.splice(idx, 1);
        }
      });
    }
  } catch (error) {
    console.warn(`[${new Date().toISOString()}] [Fallback] Tencent Finance failed, falling back to Mock data:`, error);
  }

  // 3. 仍然缺失的股票，从MOCK数据获取
  if (codesNeedingMock.length > 0) {
    console.log(`📦 Getting ${codesNeedingMock.length} stocks from MOCK data...`);
    codesNeedingMock.forEach(code => {
      // 在所有市场的MOCK数据中查找
      for (const marketStocks of Object.values(MOCK_STOCKS)) {
        const mockStock = marketStocks.find((s: any) => s.code === code);
        if (mockStock && isValidPriceData(mockStock)) {
          prices[code] = {
            price: mockStock.price,
            changePct: mockStock.changePct
          };
          console.log(`✅ MOCK ${code}: price=${mockStock.price}, changePct=${mockStock.changePct}%`);
          break;
        }
      }
    });
  }

  console.log(`📊 Final: ${Object.keys(prices).length}/${codes.length} stocks have price data`);
  return prices;
}

/**
 * 搜索股票（按代码或名称）
 * 优先使用后端API搜索全市场股票，支持A股、港股、美股、基金
 * 用于持仓添加时的自动补全
 */
export async function searchStocks(query: string): Promise<Array<{code: string, name: string, market: string}>> {
  if (!query || query.length < 1) {
    return [];
  }

  // 1. 优先使用后端API搜索
  try {
    const data = await request<Array<{code: string, name: string, market: string}>>
      (`/stocks/search?q=${encodeURIComponent(query)}&limit=10`);

    if (data && Array.isArray(data) && data.length > 0) {
      console.log(`✅ Backend search found ${data.length} results for "${query}"`);
      return data;
    }
  } catch (error) {
    console.warn(`[${new Date().toISOString()}] [Fallback] Backend search failed, falling back to local MOCK search:`, error);
  }

  // 2. 后端API失败时，在本地MOCK数据中搜索
  const results: Array<{code: string, name: string, market: string}> = [];
  const foundCodes = new Set<string>();

  Object.values(MOCK_STOCKS).forEach(stocks => {
    stocks.forEach(stock => {
      const matchCode = stock.code.toLowerCase().includes(query.toLowerCase());
      const matchName = stock.name.toLowerCase().includes(query.toLowerCase());
      if (matchCode || matchName) {
        if (!foundCodes.has(stock.code)) {
          results.push({
            code: stock.code,
            name: stock.name,
            market: stock.market,
          });
          foundCodes.add(stock.code);
        }
      }
    });
  });

  // 限制返回数量
  return results.slice(0, 10);
}

/**
 * 获取股票详情（支持任意股票代码）
 * 首先在MOCK数据中查找，如果没有则动态获取
 */
export async function getStockDetail(code: string): Promise<any> {
  if (!code) {
    return null;
  }

  // 1. 首先在MOCK数据中查找
  for (const marketStocks of Object.values(MOCK_STOCKS)) {
    const found = marketStocks.find((s: any) => s.code === code);
    if (found) {
      return found;
    }
  }

  // 2. 如果MOCK中没有，动态获取
  try {
    const stockDataService = await import('./stockDataService');
    const stockInfo = await stockDataService.getStockInfo(code);

    if (stockInfo) {
      // 使用优化版分析引擎计算评分
      const { analyzeStockOptimized } = await import('./stockAnalyzerOptimized');
      const analysis = analyzeStockOptimized(stockInfo);

      // 根据评分决定时机
      let timing = 'wait';
      let timingText = '等待机会';
      if (analysis.overallScore >= 80 && analysis.riskLevel !== 'high') {
        timing = 'buy_now';
        timingText = '强烈推荐';
      } else if (analysis.overallScore >= 70 && analysis.riskLevel !== 'high') {
        timing = 'buy_soon';
        timingText = '建议买入';
      } else if (analysis.overallScore >= 55) {
        timing = 'hold';
        timingText = '持有观望';
      } else if (analysis.overallScore < 40) {
        timing = 'avoid';
        timingText = '建议规避';
      }

      return {
        ...stockInfo,
        score: analysis.overallScore,
        timing,
        timingText,
        riskLevel: analysis.riskLevel,
        recommendation: analysis.recommendation,
        confidence: analysis.confidence,
      };
    }
  } catch (error) {
    console.warn('Failed to get stock detail:', code, error);
  }

  return null;
}

/**
 * 获取股票实时价格（用于模拟交易）
 * 直接从API获取实时数据，跳过MOCK数据
 */
export async function getStockDetailRealtime(code: string): Promise<any> {
  if (!code) {
    return null;
  }

  try {
    const stockDataService = await import('./stockDataService');
    const stockInfo = await stockDataService.getStockInfo(code);

    if (stockInfo) {
      return stockInfo;
    }
  } catch (error) {
    console.warn('Failed to get stock real-time detail:', code, error);
  }

  return null;
}

// 导出API配置
export const API_CONFIG = {
  BASE_URL: API_BASE,
  USE_MOCK,
  MOCK_STOCKS
};
