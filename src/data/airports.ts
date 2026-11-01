import type { Airport } from "@/lib/types";

// 新增机场时，同步更新 supabase/migrations/*_airport_updates.sql 里的两处机场代码列表。
export const AIRPORTS: Airport[] = [
  { code: "BCN", name: "Barcelona–El Prat", nameZh: "巴塞罗那-埃尔普拉特机场", city: "Barcelona", cityZh: "巴塞罗那", country: "Spain", countryZh: "西班牙", lat: 41.2974, lng: 2.0833 },
  { code: "MAD", name: "Madrid–Barajas", nameZh: "马德里-巴拉哈斯机场", city: "Madrid", cityZh: "马德里", country: "Spain", countryZh: "西班牙", lat: 40.4983, lng: -3.5676 },
  { code: "LHR", name: "London Heathrow", nameZh: "伦敦希思罗机场", city: "London", cityZh: "伦敦", country: "United Kingdom", countryZh: "英国", lat: 51.47, lng: -0.4543 },
  { code: "CDG", name: "Paris Charles de Gaulle", nameZh: "巴黎戴高乐机场", city: "Paris", cityZh: "巴黎", country: "France", countryZh: "法国", lat: 49.0097, lng: 2.5479 },
  { code: "AMS", name: "Amsterdam Schiphol", nameZh: "阿姆斯特丹史基浦机场", city: "Amsterdam", cityZh: "阿姆斯特丹", country: "Netherlands", countryZh: "荷兰", lat: 52.3105, lng: 4.7683 },
  { code: "FRA", name: "Frankfurt Airport", nameZh: "法兰克福机场", city: "Frankfurt", cityZh: "法兰克福", country: "Germany", countryZh: "德国", lat: 50.0379, lng: 8.5622 },
  { code: "MUC", name: "Munich Airport", nameZh: "慕尼黑机场", city: "Munich", cityZh: "慕尼黑", country: "Germany", countryZh: "德国", lat: 48.3538, lng: 11.7861 },
  { code: "FCO", name: "Rome Fiumicino", nameZh: "罗马菲乌米奇诺机场", city: "Rome", cityZh: "罗马", country: "Italy", countryZh: "意大利", lat: 41.8003, lng: 12.2389 },
  { code: "MXP", name: "Milan Malpensa", nameZh: "米兰马尔彭萨机场", city: "Milan", cityZh: "米兰", country: "Italy", countryZh: "意大利", lat: 45.6306, lng: 8.7281 },
  { code: "LIS", name: "Lisbon Humberto Delgado", nameZh: "里斯本机场", city: "Lisbon", cityZh: "里斯本", country: "Portugal", countryZh: "葡萄牙", lat: 38.7813, lng: -9.1359 },
  { code: "ZRH", name: "Zurich Airport", nameZh: "苏黎世机场", city: "Zurich", cityZh: "苏黎世", country: "Switzerland", countryZh: "瑞士", lat: 47.4582, lng: 8.5555 },
  { code: "IST", name: "Istanbul Airport", nameZh: "伊斯坦布尔机场", city: "Istanbul", cityZh: "伊斯坦布尔", country: "Türkiye", countryZh: "土耳其", lat: 41.2753, lng: 28.7519 },
  { code: "DXB", name: "Dubai International", nameZh: "迪拜国际机场", city: "Dubai", cityZh: "迪拜", country: "United Arab Emirates", countryZh: "阿联酋", lat: 25.2532, lng: 55.3657 },
  { code: "DOH", name: "Hamad International", nameZh: "多哈哈马德国际机场", city: "Doha", cityZh: "多哈", country: "Qatar", countryZh: "卡塔尔", lat: 25.2731, lng: 51.6081 },
  { code: "JFK", name: "New York John F. Kennedy", nameZh: "纽约肯尼迪国际机场", city: "New York", cityZh: "纽约", country: "United States", countryZh: "美国", lat: 40.6413, lng: -73.7781 },
  { code: "LAX", name: "Los Angeles International", nameZh: "洛杉矶国际机场", city: "Los Angeles", cityZh: "洛杉矶", country: "United States", countryZh: "美国", lat: 33.9416, lng: -118.4085 },
  { code: "SFO", name: "San Francisco International", nameZh: "旧金山国际机场", city: "San Francisco", cityZh: "旧金山", country: "United States", countryZh: "美国", lat: 37.6213, lng: -122.379 },
  { code: "ORD", name: "Chicago O'Hare", nameZh: "芝加哥奥黑尔国际机场", city: "Chicago", cityZh: "芝加哥", country: "United States", countryZh: "美国", lat: 41.9742, lng: -87.9073 },
  { code: "YVR", name: "Vancouver International", nameZh: "温哥华国际机场", city: "Vancouver", cityZh: "温哥华", country: "Canada", countryZh: "加拿大", lat: 49.1947, lng: -123.1792 },
  { code: "SIN", name: "Singapore Changi", nameZh: "新加坡樟宜机场", city: "Singapore", cityZh: "新加坡", country: "Singapore", countryZh: "新加坡", lat: 1.3644, lng: 103.9915 },
  { code: "BKK", name: "Bangkok Suvarnabhumi", nameZh: "曼谷素万那普机场", city: "Bangkok", cityZh: "曼谷", country: "Thailand", countryZh: "泰国", lat: 13.69, lng: 100.7501 },
  { code: "KUL", name: "Kuala Lumpur International", nameZh: "吉隆坡国际机场", city: "Kuala Lumpur", cityZh: "吉隆坡", country: "Malaysia", countryZh: "马来西亚", lat: 2.7456, lng: 101.7099 },
  { code: "HKG", name: "Hong Kong International", nameZh: "香港国际机场", city: "Hong Kong", cityZh: "香港", country: "Hong Kong SAR, China", countryZh: "中国香港", lat: 22.308, lng: 114.1739 },
  { code: "NRT", name: "Tokyo Narita", nameZh: "东京成田国际机场", city: "Tokyo", cityZh: "东京", country: "Japan", countryZh: "日本", lat: 35.772, lng: 140.3929 },
  { code: "ICN", name: "Seoul Incheon", nameZh: "首尔仁川国际机场", city: "Seoul", cityZh: "首尔", country: "South Korea", countryZh: "韩国", lat: 37.4602, lng: 126.4407 },
  { code: "PVG", name: "Shanghai Pudong", nameZh: "上海浦东国际机场", city: "Shanghai", cityZh: "上海", country: "China", countryZh: "中国", lat: 31.1443, lng: 121.8083 },
  { code: "PEK", name: "Beijing Capital", nameZh: "北京首都国际机场", city: "Beijing", cityZh: "北京", country: "China", countryZh: "中国", lat: 40.0799, lng: 116.6031 },
  { code: "CAN", name: "Guangzhou Baiyun", nameZh: "广州白云国际机场", city: "Guangzhou", cityZh: "广州", country: "China", countryZh: "中国", lat: 23.3924, lng: 113.2988 },
  { code: "SZX", name: "Shenzhen Bao'an", nameZh: "深圳宝安国际机场", city: "Shenzhen", cityZh: "深圳", country: "China", countryZh: "中国", lat: 22.6393, lng: 113.8107 },
  { code: "TFU", name: "Chengdu Tianfu", nameZh: "成都天府国际机场", city: "Chengdu", cityZh: "成都", country: "China", countryZh: "中国", lat: 30.3125, lng: 104.4419 },
  { code: "CKG", name: "Chongqing Jiangbei", nameZh: "重庆江北国际机场", city: "Chongqing", cityZh: "重庆", country: "China", countryZh: "中国", lat: 29.7192, lng: 106.6416 },
  { code: "HGH", name: "Hangzhou Xiaoshan", nameZh: "杭州萧山国际机场", city: "Hangzhou", cityZh: "杭州", country: "China", countryZh: "中国", lat: 30.2295, lng: 120.4345 },
  { code: "XIY", name: "Xi'an Xianyang", nameZh: "西安咸阳国际机场", city: "Xi'an", cityZh: "西安", country: "China", countryZh: "中国", lat: 34.4471, lng: 108.7516 },
  { code: "SYD", name: "Sydney Kingsford Smith", nameZh: "悉尼金斯福德·史密斯机场", city: "Sydney", cityZh: "悉尼", country: "Australia", countryZh: "澳大利亚", lat: -33.9399, lng: 151.1753 },
  { code: "MEL", name: "Melbourne Airport", nameZh: "墨尔本机场", city: "Melbourne", cityZh: "墨尔本", country: "Australia", countryZh: "澳大利亚", lat: -37.669, lng: 144.841 },
];

export function findAirport(code: string): Airport | undefined {
  const c = code.toUpperCase();
  return AIRPORTS.find((a) => a.code === c);
}
