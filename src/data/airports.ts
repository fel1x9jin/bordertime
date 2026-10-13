import type { Airport } from "@/lib/types";

export const AIRPORTS: Airport[] = [
  { code: "BCN", name: "Barcelona–El Prat", nameZh: "巴塞罗那-埃尔普拉特机场", city: "Barcelona", cityZh: "巴塞罗那", country: "Spain", countryZh: "西班牙" },
  { code: "MAD", name: "Madrid–Barajas", nameZh: "马德里-巴拉哈斯机场", city: "Madrid", cityZh: "马德里", country: "Spain", countryZh: "西班牙" },
  { code: "LHR", name: "London Heathrow", nameZh: "伦敦希思罗机场", city: "London", cityZh: "伦敦", country: "United Kingdom", countryZh: "英国" },
  { code: "CDG", name: "Paris Charles de Gaulle", nameZh: "巴黎戴高乐机场", city: "Paris", cityZh: "巴黎", country: "France", countryZh: "法国" },
  { code: "AMS", name: "Amsterdam Schiphol", nameZh: "阿姆斯特丹史基浦机场", city: "Amsterdam", cityZh: "阿姆斯特丹", country: "Netherlands", countryZh: "荷兰" },
  { code: "FRA", name: "Frankfurt Airport", nameZh: "法兰克福机场", city: "Frankfurt", cityZh: "法兰克福", country: "Germany", countryZh: "德国" },
  { code: "MUC", name: "Munich Airport", nameZh: "慕尼黑机场", city: "Munich", cityZh: "慕尼黑", country: "Germany", countryZh: "德国" },
  { code: "FCO", name: "Rome Fiumicino", nameZh: "罗马菲乌米奇诺机场", city: "Rome", cityZh: "罗马", country: "Italy", countryZh: "意大利" }, 
   { code: "MXP", name: "Milan Malpensa", nameZh: "米兰马尔彭萨机场", city: "Milan", cityZh: "米兰", country: "Italy", countryZh: "意大利" },
  { code: "LIS", name: "Lisbon Humberto Delgado", nameZh: "里斯本机场", city: "Lisbon", cityZh: "里斯本", country: "Portugal", countryZh: "葡萄牙" },
  { code: "ZRH", name: "Zurich Airport", nameZh: "苏黎世机场", city: "Zurich", cityZh: "苏黎世", country: "Switzerland", countryZh: "瑞士" },
  { code: "IST", name: "Istanbul Airport", nameZh: "伊斯坦布尔机场", city: "Istanbul", cityZh: "伊斯坦布尔", country: "Türkiye", countryZh: "土耳其" },
  { code: "DXB", name: "Dubai International", nameZh: "迪拜国际机场", city: "Dubai", cityZh: "迪拜", country: "United Arab Emirates", countryZh: "阿联酋" },
  { code: "JFK", name: "New York John F. Kennedy", nameZh: "纽约肯尼迪国际机场", city: "New York", cityZh: "纽约", country: "United States", countryZh: "美国" },
  { code: "LAX", name: "Los Angeles International", nameZh: "洛杉矶国际机场", city: "Los Angeles", cityZh: "洛杉矶", country: "United States", countryZh: "美国" },
  { code: "SFO", name: "San Francisco International", nameZh: "旧金山国际机场", city: "San Francisco", cityZh: "旧金山", country: "United States", countryZh: "美国" },
  { code: "SIN", name: "Singapore Changi", nameZh: "新加坡樟宜机场", city: "Singapore", cityZh: "新加坡", country: "Singapore", countryZh: "新加坡" },
  { code: "HKG", name: "Hong Kong International", nameZh: "香港国际机场", city: "Hong Kong", cityZh: "香港", country: "Hong Kong SAR, China", countryZh: "中国香港" },
  { code: "NRT", name: "Tokyo Narita", nameZh: "东京成田国际机场", city: "Tokyo", cityZh: "东京", country: "Japan", countryZh: "日本" },
  { code: "ICN", name: "Seoul Incheon", nameZh: "首尔仁川国际机场", city: "Seoul", cityZh: "首尔", country: "South Korea", countryZh: "韩国" },
  { code: "PVG", name: "Shanghai Pudong", nameZh: "上海浦东国际机场", city: "Shanghai", cityZh: "上海", country: "China", countryZh: "中国" },
  { code: "PEK", name: "Beijing Capital", nameZh: "北京首都国际机场", city: "Beijing", cityZh: "北京", country: "China", countryZh: "中国" },
  { code: "SYD", name: "Sydney Kingsford Smith", nameZh: "悉尼金斯福德·史密斯机场", city: "Sydney", cityZh: "悉尼", country: "Australia", countryZh: "澳大利亚" },
];

export function findAirport(code: string): Airport | undefined {
  const c = code.toUpperCase();
  return AIRPORTS.find((a) => a.code === c);
}
