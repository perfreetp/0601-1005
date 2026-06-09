export interface SensitiveHit {
  word: string;
  field: string;
  fieldName: string;
  context: string;
}

export const SENSITIVE_WORDS: string[] = [
  '最', '第一', '绝对', '唯一', '顶级', '国家级', '世界级', '最高级', '最佳',
  '最大', '最强', '最便宜', '最先进', '独家', '首个', '首选', '唯一', '全网第一',
  '史无前例', '绝无仅有', '前无古人', '万能', '100%', '纯天然', '零风险',
  '永久', '无敌', '极品', '极致', '完美', '秒杀', '全网首发',
  '国家级产品', '最高级', '唯一', '绝对', '世界级', '顶级',
  '中国第一', '全网第一', '全国第一', '全球第一',
];

export function scanSensitiveWords(text: string, field: string, fieldName: string): SensitiveHit[] {
  if (!text) return [];
  const hits: SensitiveHit[] = [];
  const lowerText = text;

  for (const word of SENSITIVE_WORDS) {
    let idx = lowerText.indexOf(word);
    while (idx !== -1) {
      const start = Math.max(0, idx - 10);
      const end = Math.min(text.length, idx + word.length + 10);
      const context = (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : '');
      hits.push({ word, field, fieldName, context });
      idx = lowerText.indexOf(word, idx + word.length);
    }
  }

  return hits;
}

export interface SensitiveScanResult {
  totalHits: number;
  hits: SensitiveHit[];
  groupedHits: Record<string, SensitiveHit[]>;
}

export function scanAllContent(copy?: {
  titles?: string[];
  summary?: string;
  shownotes?: string;
  socialPosts?: {
    xiaohongshu?: string;
    weibo?: string;
    official?: string;
  };
  coverPrompt?: string;
}): SensitiveScanResult {
  const allHits: SensitiveHit[] = [];

  if (copy?.titles) {
    copy.titles.forEach((t, i) => {
      allHits.push(...scanSensitiveWords(t, `titles[${i}]`, `标题第${i + 1}条`));
    });
  }
  if (copy?.summary) {
    allHits.push(...scanSensitiveWords(copy.summary, 'summary', '摘要'));
  }
  if (copy?.shownotes) {
    allHits.push(...scanSensitiveWords(copy.shownotes, 'shownotes', 'Shownotes'));
  }
  if (copy?.socialPosts?.xiaohongshu) {
    allHits.push(...scanSensitiveWords(copy.socialPosts.xiaohongshu, 'xiaohongshu', '小红书文案'));
  }
  if (copy?.socialPosts?.weibo) {
    allHits.push(...scanSensitiveWords(copy.socialPosts.weibo, 'weibo', '微博文案'));
  }
  if (copy?.socialPosts?.official) {
    allHits.push(...scanSensitiveWords(copy.socialPosts.official, 'official', '公众号文案'));
  }
  if (copy?.coverPrompt) {
    allHits.push(...scanSensitiveWords(copy.coverPrompt, 'coverPrompt', '封面提示词'));
  }

  const groupedHits: Record<string, SensitiveHit[]> = {};
  for (const hit of allHits) {
    if (!groupedHits[hit.fieldName]) {
      groupedHits[hit.fieldName] = [];
    }
    groupedHits[hit.fieldName].push(hit);
  }

  return { totalHits: allHits.length, hits: allHits, groupedHits };
}
