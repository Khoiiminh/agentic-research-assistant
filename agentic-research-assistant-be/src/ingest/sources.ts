export type RssSource = {
    name: string;
    url: string;
    /** e.g. AI, Hardware — used for metadata filtering / self-query later */
    category: string;
    /** 0–1; boosts ranking / UX for trusted feeds */
    credibilityWeight: number;
};

function domainFromFeedUrl(feedUrl: string): string {
    try {
        return new URL(feedUrl).hostname.replace(/^www\./, '');
    } catch {
        return '';
    }
}

export const RSS_SOURCES: RssSource[] = [
    {
        name: 'TechCrunch_AI',
        url: 'https://techcrunch.com/tag/artificial-intelligence/feed/',
        category: 'AI',
        credibilityWeight: 0.85,
    },
    {
        name: 'BBC_Technology',
        url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
        category: 'Technology',
        credibilityWeight: 0.95,
    },
    {
        name: 'ArXiv_AI_Research',
        url: 'https://rss.arxiv.org/rss/cs.AI',
        category: 'AI',
        credibilityWeight: 1.0, // Nguồn học thuật gốc, độ tin cậy tuyệt đối
    },
    {
        name: 'MIT_Tech_Review_AI',
        url: 'https://www.technologyreview.com/topic/artificial-intelligence/feed/',
        category: 'AI',
        credibilityWeight: 0.95,
    },
    {
        name: 'InfoQ_AI_ML',
        url: 'https://feed.infoq.com/ai-ml-data-eng/news',
        category: 'AI',
        credibilityWeight: 0.90, // Tập trung vào thực thi hệ thống và kỹ thuật
    },

    // --- HARDWARE & SEMICONDUCTORS (DOMAINS FOR AMD) ---
    {
        name: 'SemiAnalysis',
        url: 'https://www.semianalysis.com/feed',
        category: 'Hardware',
        credibilityWeight: 0.95, // Cực kỳ sâu về kiến trúc chip và chuỗi cung ứng
    },
    {
        name: 'AnandTech_Main',
        url: 'https://www.anandtech.com/rss/',
        category: 'Hardware',
        credibilityWeight: 0.90, // Tiêu chuẩn vàng cho benchmark và phân tích sâu
    },
    {
        name: 'ServeTheHome',
        url: 'https://www.servethehome.com/feed/',
        category: 'Hardware',
        credibilityWeight: 0.85, // Tập trung mạnh vào Data Center và Enterprise (Target của AMD EPYC)
    },

    // --- GENERAL TECH STRATEGY ---
    {
        name: 'The_Verge_Tech',
        url: 'https://www.theverge.com/rss/index.xml',
        category: 'Technology',
        credibilityWeight: 0.80, // Tin tức tổng hợp nhanh, độ phủ rộng
    }
];

/** Domain label for payload (derived from feed URL). */
export function sourceDomain(src: RssSource): string {
    return domainFromFeedUrl(src.url);
}
