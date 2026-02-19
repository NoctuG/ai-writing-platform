/**
 * Stripe产品和价格配置
 * 定义平台的付费产品和订阅计划
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  features: string[];
  priceId: string; // Stripe Price ID (需要在Stripe Dashboard创建)
  price: number; // 价格（分）
  currency: string;
  type: "one_time" | "subscription";
  interval?: "month" | "year"; // 订阅周期
}

/**
 * 平台产品列表
 */
export const products: Product[] = [
  {
    id: "basic_paper",
    name: "基础论文生成",
    description: "单次论文生成服务",
    features: [
      "生成1篇论文",
      "自动生成大纲和全文",
      "导出Word/PDF格式",
      "在线编辑功能",
    ],
    priceId: "price_basic_paper", // 需要在Stripe Dashboard创建对应的Price
    price: 2900, // 29.00元
    currency: "cny",
    type: "one_time",
  },
  {
    id: "monthly_subscription",
    name: "月度会员",
    description: "月度订阅，无限次论文生成",
    features: [
      "无限次论文生成",
      "AI润色功能",
      "参考文献管理",
      "论文质量检测",
      "优先客服支持",
    ],
    priceId: "price_monthly_subscription", // 需要在Stripe Dashboard创建对应的Price
    price: 9900, // 99.00元/月
    currency: "cny",
    type: "subscription",
    interval: "month",
  },
  {
    id: "yearly_subscription",
    name: "年度会员",
    description: "年度订阅，享受8折优惠",
    features: [
      "无限次论文生成",
      "AI润色功能",
      "参考文献管理",
      "论文质量检测",
      "优先客服支持",
      "年度8折优惠",
    ],
    priceId: "price_yearly_subscription", // 需要在Stripe Dashboard创建对应的Price
    price: 95040, // 950.40元/年 (99*12*0.8)
    currency: "cny",
    type: "subscription",
    interval: "year",
  },
];

/**
 * 根据产品ID获取产品信息
 */
export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/**
 * 根据价格ID获取产品信息
 */
export function getProductByPriceId(priceId: string): Product | undefined {
  return products.find((p) => p.priceId === priceId);
}

/**
 * 获取所有一次性购买产品
 */
export function getOneTimeProducts(): Product[] {
  return products.filter((p) => p.type === "one_time");
}

/**
 * 获取所有订阅产品
 */
export function getSubscriptionProducts(): Product[] {
  return products.filter((p) => p.type === "subscription");
}
