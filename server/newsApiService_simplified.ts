import axios from 'axios';

interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  category: 'geopolitical' | 'aviation' | 'economic' | 'security';
  riskRelevance: 'high' | 'medium' | 'low';
  affectedRegions: string[];
  keywords: string[];
}

interface GeopoliticalNewsAnalysis {
  region: string;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  articles: NewsArticle[];
  riskFactors: {
    category: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
    source: string;
    lastUpdated: string;
  }[];
  summary: string;
  recommendations: string[];
}

export class NewsApiService {
  private newsApiKey: string;
  private cache: Map<string, GeopoliticalNewsAnalysis> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY || '';
  }

  async testConnections(): Promise<{ success: boolean; results: any }> {
    const results = {
      newsapi: { status: 'not configured', error: null },
      rssFeeds: { status: 'available', error: null }
    };

    // Test NewsAPI.org if available
    if (this.newsApiKey) {
      try {
        const response = await axios.get(`https://newsapi.org/v2/top-headlines?country=us&apiKey=${this.newsApiKey}&pageSize=1`);
        results.newsapi = { status: 'connected', error: null };
      } catch (error: any) {
        results.newsapi = { status: 'error', error: error.message };
      }
    }

    return {
      success: true, // Always successful with RSS fallback
      results
    };
  }

  async getGeopoliticalRiskAnalysis(region: string): Promise<GeopoliticalNewsAnalysis> {
    const cacheKey = `risk_${region}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      const isExpired = Date.now() - new Date(cached.riskFactors[0]?.lastUpdated || 0).getTime() > this.CACHE_DURATION;
      if (!isExpired) {
        return cached;
      }
    }

    try {
      let articles: NewsArticle[] = [];

      // Try NewsAPI.org first
      if (this.newsApiKey) {
        articles = await this.fetchFromNewsApi(region);
      }

      // If no NewsAPI or insufficient data, use RSS feeds
      if (articles.length < 5) {
        const rssArticles = await this.fetchFromRSSFeeds(region);
        articles = [...articles, ...rssArticles];
      }

      // Filter and sort articles by relevance
      const relevantArticles = articles
        .filter(article => article.riskRelevance === 'high' || article.riskRelevance === 'medium')
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 15);

      const riskFactors = this.analyzeRiskFactors(relevantArticles, region);
      const riskLevel = this.calculateOverallRiskLevel(riskFactors);
      
      const analysis: GeopoliticalNewsAnalysis = {
        region,
        riskLevel,
        articles: relevantArticles,
        riskFactors,
        summary: this.generateRiskSummary(relevantArticles, riskFactors, region),
        recommendations: this.generateRecommendations(riskLevel, riskFactors, region)
      };

      // Cache the analysis
      this.cache.set(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.error('Error in geopolitical risk analysis:', error);
      throw new Error(`Unable to fetch geopolitical intelligence for ${region}`);
    }
  }

  private async fetchFromNewsApi(region: string): Promise<NewsArticle[]> {
    if (!this.newsApiKey) return [];

    try {
      const regionQuery = this.getRegionSearchTerms(region);
      const response = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          q: regionQuery,
          sortBy: 'publishedAt',
          pageSize: 50,
          apiKey: this.newsApiKey,
          language: 'en'
        }
      });

      return response.data.articles.map((article: any, index: number) => ({
        id: `newsapi_${index}_${Date.now()}`,
        title: article.title,
        description: article.description || '',
        url: article.url,
        publishedAt: article.publishedAt,
        source: article.source.name,
        category: this.categorizeArticle(article.title + ' ' + article.description),
        riskRelevance: this.assessRiskRelevance(article.title + ' ' + article.description),
        affectedRegions: [region],
        keywords: this.extractKeywords(article.title + ' ' + article.description)
      }));
    } catch (error) {
      console.error('NewsAPI error:', error);
      return [];
    }
  }

  private async fetchFromRSSFeeds(region: string): Promise<NewsArticle[]> {
    const feeds = this.getRSSFeedsForRegion(region);
    const articles: NewsArticle[] = [];

    for (const feed of feeds) {
      try {
        const response = await axios.get(feed.url, {
          timeout: 5000,
          headers: {
            'User-Agent': 'AINO Aviation Intelligence System'
          }
        });

        const feedArticles = this.parseRSSFeed(response.data, feed.source, region);
        articles.push(...feedArticles);
      } catch (error) {
        console.error(`Error fetching RSS feed ${feed.source}:`, error);
      }
    }

    return articles;
  }

  private getRSSFeedsForRegion(region: string): { url: string; source: string }[] {
    const baseFeeds = [
      { url: 'https://feeds.reuters.com/reuters/worldNews', source: 'Reuters' },
      { url: 'https://feeds.bbci.co.uk/news/world/rss.xml', source: 'BBC World' },
      { url: 'https://rss.cnn.com/rss/edition.rss', source: 'CNN International' }
    ];

    // Add region-specific feeds
    const regionFeeds: { [key: string]: { url: string; source: string }[] } = {
      'Europe': [
        { url: 'https://feeds.bbci.co.uk/news/world/europe/rss.xml', source: 'BBC Europe' }
      ],
      'Asia': [
        { url: 'https://feeds.bbci.co.uk/news/world/asia/rss.xml', source: 'BBC Asia' }
      ],
      'Africa': [
        { url: 'https://feeds.bbci.co.uk/news/world/africa/rss.xml', source: 'BBC Africa' }
      ],
      'Middle East': [
        { url: 'https://feeds.bbci.co.uk/news/world/middle_east/rss.xml', source: 'BBC Middle East' }
      ]
    };

    return [...baseFeeds, ...(regionFeeds[region] || [])];
  }

  private parseRSSFeed(xmlData: string, source: string, region: string): NewsArticle[] {
    const articles: NewsArticle[] = [];
    
    try {
      const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
      const items = xmlData.match(itemRegex) || [];
      
      items.forEach((item, index) => {
        const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || item.match(/<title>(.*?)<\/title>/);
        const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || item.match(/<description>(.*?)<\/description>/);
        const linkMatch = item.match(/<link>(.*?)<\/link>/);
        const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
        
        if (titleMatch && linkMatch) {
          const title = titleMatch[1].trim();
          const description = descMatch ? descMatch[1].trim().replace(/<[^>]*>/g, '') : '';
          const content = title + ' ' + description;
          
          // Filter for relevant content
          if (this.isRelevantToRegion(content, region) || this.isAviationRelated(content)) {
            articles.push({
              id: `${source.toLowerCase()}_${index}_${Date.now()}`,
              title,
              description,
              url: linkMatch[1].trim(),
              publishedAt: pubDateMatch ? new Date(pubDateMatch[1]).toISOString() : new Date().toISOString(),
              source,
              category: this.categorizeArticle(content),
              riskRelevance: this.assessRiskRelevance(content),
              affectedRegions: [region],
              keywords: this.extractKeywords(content)
            });
          }
        }
      });
    } catch (error) {
      console.error(`Error parsing RSS feed from ${source}:`, error);
    }
    
    return articles;
  }

  private getRegionSearchTerms(region: string): string {
    const terms: { [key: string]: string } = {
      'Europe': 'Europe OR European OR EU OR Brexit OR NATO',
      'Asia': 'Asia OR China OR Japan OR Korea OR Taiwan OR Thailand OR Vietnam',
      'Middle East': 'Middle East OR Syria OR Iraq OR Iran OR Israel OR Palestine OR Saudi Arabia',
      'Africa': 'Africa OR Nigeria OR Kenya OR South Africa OR Egypt OR Morocco',
      'North America': 'United States OR Canada OR Mexico OR NAFTA',
      'South America': 'Brazil OR Argentina OR Chile OR Colombia OR Venezuela'
    };

    return terms[region] || region;
  }

  private isRelevantToRegion(content: string, region: string): boolean {
    const keywords = this.getRegionKeywords(region);
    const lowerContent = content.toLowerCase();
    
    return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  }

  private getRegionKeywords(region: string): string[] {
    const keywords: { [key: string]: string[] } = {
      'Europe': ['europe', 'european', 'eu', 'brexit', 'nato', 'germany', 'france', 'uk', 'britain', 'italy', 'spain'],
      'Asia': ['asia', 'china', 'japan', 'korea', 'taiwan', 'thailand', 'vietnam', 'singapore', 'malaysia', 'indonesia'],
      'Middle East': ['middle east', 'syria', 'iraq', 'iran', 'israel', 'palestine', 'saudi arabia', 'uae', 'qatar'],
      'Africa': ['africa', 'nigeria', 'kenya', 'south africa', 'egypt', 'morocco', 'ethiopia', 'ghana'],
      'North America': ['united states', 'canada', 'mexico', 'nafta', 'america', 'american'],
      'South America': ['brazil', 'argentina', 'chile', 'colombia', 'venezuela', 'peru', 'ecuador']
    };

    return keywords[region] || [region.toLowerCase()];
  }

  private isAviationRelated(content: string): boolean {
    const aviationTerms = ['aircraft', 'airline', 'airport', 'flight', 'aviation', 'airspace', 'pilot', 'crew', 'boeing', 'airbus'];
    const lowerContent = content.toLowerCase();
    
    return aviationTerms.some(term => lowerContent.includes(term));
  }

  private categorizeArticle(content: string): 'geopolitical' | 'aviation' | 'economic' | 'security' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('terror') || lowerContent.includes('security') || lowerContent.includes('attack')) {
      return 'security';
    }
    if (lowerContent.includes('aviation') || lowerContent.includes('airline') || lowerContent.includes('airport')) {
      return 'aviation';
    }
    if (lowerContent.includes('economy') || lowerContent.includes('trade') || lowerContent.includes('market')) {
      return 'economic';
    }
    return 'geopolitical';
  }

  private assessRiskRelevance(content: string): 'high' | 'medium' | 'low' {
    const lowerContent = content.toLowerCase();
    const highRiskTerms = ['war', 'conflict', 'attack', 'terror', 'emergency', 'crisis', 'violence', 'strike'];
    const mediumRiskTerms = ['protest', 'tension', 'dispute', 'sanction', 'warning', 'concern'];
    
    if (highRiskTerms.some(term => lowerContent.includes(term))) {
      return 'high';
    }
    if (mediumRiskTerms.some(term => lowerContent.includes(term))) {
      return 'medium';
    }
    return 'low';
  }

  private extractKeywords(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const relevantWords = words.filter(word => 
      word.length > 4 && 
      !['the', 'and', 'or', 'but', 'with', 'from', 'that', 'this', 'have', 'has', 'will', 'been'].includes(word)
    );
    return relevantWords.slice(0, 5);
  }

  private analyzeRiskFactors(articles: NewsArticle[], region: string): {
    category: string;
    impact: 'high' | 'medium' | 'low';
    description: string;
    source: string;
    lastUpdated: string;
  }[] {
    const factors: {
      category: string;
      impact: 'high' | 'medium' | 'low';
      description: string;
      source: string;
      lastUpdated: string;
    }[] = [];
    const now = new Date().toISOString();

    // Security risks
    const securityArticles = articles.filter(a => a.category === 'security');
    if (securityArticles.length > 0) {
      factors.push({
        category: 'Security Threats',
        impact: securityArticles.some(a => a.riskRelevance === 'high') ? 'high' as const : 'medium' as const,
        description: `${securityArticles.length} security-related incidents reported in ${region}`,
        source: 'News Analysis',
        lastUpdated: now
      });
    }

    // Aviation risks
    const aviationArticles = articles.filter(a => a.category === 'aviation');
    if (aviationArticles.length > 0) {
      factors.push({
        category: 'Aviation Operations',
        impact: aviationArticles.some(a => a.riskRelevance === 'high') ? 'high' as const : 'medium' as const,
        description: `${aviationArticles.length} aviation-related developments in ${region}`,
        source: 'Aviation News',
        lastUpdated: now
      });
    }

    // Economic factors
    const economicArticles = articles.filter(a => a.category === 'economic');
    if (economicArticles.length > 0) {
      factors.push({
        category: 'Economic Stability',
        impact: 'medium' as const,
        description: `Economic developments may affect regional stability`,
        source: 'Economic News',
        lastUpdated: now
      });
    }

    return factors;
  }

  private calculateOverallRiskLevel(riskFactors: any[]): 'critical' | 'high' | 'medium' | 'low' {
    if (riskFactors.some(f => f.impact === 'high' && f.category === 'Security Threats')) {
      return 'critical';
    }
    if (riskFactors.some(f => f.impact === 'high')) {
      return 'high';
    }
    if (riskFactors.length > 0) {
      return 'medium';
    }
    return 'low';
  }

  private generateRiskSummary(articles: NewsArticle[], riskFactors: any[], region: string): string {
    const totalArticles = articles.length;
    const highRiskArticles = articles.filter(a => a.riskRelevance === 'high').length;
    
    if (totalArticles === 0) {
      return `No significant risk indicators currently identified for ${region}. Monitoring continues.`;
    }

    return `Analysis of ${totalArticles} recent news items for ${region} reveals ${highRiskArticles} high-priority developments. ${riskFactors.length} risk categories identified requiring operational awareness.`;
  }

  private generateRecommendations(riskLevel: string, riskFactors: any[], region: string): string[] {
    const recommendations = [];

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Consider alternative routing for flights in affected areas');
      recommendations.push('Increase crew briefing requirements for regional operations');
      recommendations.push('Monitor official aviation advisories closely');
    }

    if (riskFactors.some(f => f.category === 'Security Threats')) {
      recommendations.push('Review security protocols for ground operations');
      recommendations.push('Coordinate with local security authorities');
    }

    if (riskFactors.some(f => f.category === 'Aviation Operations')) {
      recommendations.push('Check for airspace restrictions or operational changes');
      recommendations.push('Verify airport operational status before departure');
    }

    recommendations.push(`Maintain regular communication with ${region} operational contacts`);
    recommendations.push('Continue monitoring for developing situations');

    return recommendations;
  }
}

export const newsApiService = new NewsApiService();