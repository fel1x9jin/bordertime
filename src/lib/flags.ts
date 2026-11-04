import AE from "country-flag-icons/string/3x2/AE";
import AU from "country-flag-icons/string/3x2/AU";
import CA from "country-flag-icons/string/3x2/CA";
import CH from "country-flag-icons/string/3x2/CH";
import CN from "country-flag-icons/string/3x2/CN";
import DE from "country-flag-icons/string/3x2/DE";
import ES from "country-flag-icons/string/3x2/ES";
import FR from "country-flag-icons/string/3x2/FR";
import GB from "country-flag-icons/string/3x2/GB";
import HK from "country-flag-icons/string/3x2/HK";
import IT from "country-flag-icons/string/3x2/IT";
import JP from "country-flag-icons/string/3x2/JP";
import KR from "country-flag-icons/string/3x2/KR";
import MY from "country-flag-icons/string/3x2/MY";
import NL from "country-flag-icons/string/3x2/NL";
import PT from "country-flag-icons/string/3x2/PT";
import QA from "country-flag-icons/string/3x2/QA";
import SA from "country-flag-icons/string/3x2/SA";
import SG from "country-flag-icons/string/3x2/SG";
import TH from "country-flag-icons/string/3x2/TH";
import TR from "country-flag-icons/string/3x2/TR";
import US from "country-flag-icons/string/3x2/US";
import type { CountryCode } from "./types";

/**
 * 只引入当前机场列表用到的国旗 SVG。
 * 不使用区域指示符 emoji：Windows 桌面版 Chrome / Edge / Firefox 没有国旗字形，
 * 会把 🇮🇹 显示成字母 IT。SVG 在各系统上画出来都是旗帜。
 * 3:2 画幅统一尺寸，列表里不会因为各国官方比例不同而高低不齐。
 */
const FLAG_SVG: Record<CountryCode, string> = {
  AE,
  AU,
  CA,
  CH,
  CN,
  DE,
  ES,
  FR,
  GB,
  HK,
  IT,
  JP,
  KR,
  MY,
  NL,
  PT,
  QA,
  SA,
  SG,
  TH,
  TR,
  US,
};

export function flagMarkup(code: CountryCode): string {
  const raw = FLAG_SVG[code];
  if (!raw.startsWith("<svg ")) {
    throw new Error(`Unexpected flag markup for ${code}`);
  }
  return raw.replace("<svg ", '<svg aria-hidden="true" focusable="false" ');
}

/** 地球仪标记是原生 DOM，不走 React。 */
export function appendCountryFlag(parent: HTMLElement, code: CountryCode, label: string) {
  const el = document.createElement("span");
  el.className = "airport-flag";
  el.setAttribute("role", "img");
  el.setAttribute("aria-label", label);
  el.title = label;
  el.innerHTML = flagMarkup(code);
  parent.append(el);
}
