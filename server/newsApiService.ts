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
  private guardianApiKey: string;
  private newsdataApiKey: string;
  private mediastackApiKey: string;
  private gnewsApiKey: string;
  private worldNewsApiKey: string;
  private nytApiKey: string;
  private reutersEndpoint: string;
  private cache: Map<string, GeopoliticalNewsAnalysis> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY || process.env.NEWSAPI_ORG_KEY || '';
    this.guardianApiKey = process.env.GUARDIAN_API_KEY || '';
    this.newsdataApiKey = process.env.NEWSDATA_API_KEY || process.env.NEWSDATA_IO_KEY || '';
    this.mediastackApiKey = process.env.MEDIASTACK_API_KEY || '';
    this.gnewsApiKey = process.env.GNEWS_API_KEY || '';
    this.worldNewsApiKey = process.env.WORLD_NEWS_API_KEY || '';
    this.nytApiKey = process.env.NYT_API_KEY || process.env.NYTIMES_API_KEY || '';
    this.reutersEndpoint = 'https://api.reuters.com/v1';
  }

  /**
   * Fetch from free RSS feeds and open news sources
   */
  private async fetchFromOpenSources(region: string): Promise<NewsArticle[]> {
    const articles: NewsArticle[] = [];
    
    try {
      // BBC News RSS (no API key required)
      const bbcResponse = await axios.get('https://feeds.bbci.co.uk/news/world/rss.xml');
      const bbcArticles = this.parseRSSFeed(bbcResponse.data, 'BBC News', region);
      articles.push(...bbcArticles);
    } catch (error) {
      console.log('BBC RSS feed unavailable');
    }

    try {
      // Reuters RSS (no API key required) 
      const reutersResponse = await axios.get('https://feeds.reuters.com/reuters/worldNews');
      const reutersArticles = this.parseRSSFeed(reutersResponse.data, 'Reuters', region);
      articles.push(...reutersArticles);
    } catch (error) {
      console.log('Reuters RSS feed unavailable');
    }

    try {
      // Associated Press RSS
      const apResponse = await axios.get('https://feeds.apnews.com/rss/apf-intlnews.rss');
      const apArticles = this.parseRSSFeed(apResponse.data, 'Associated Press', region);
      articles.push(...apArticles);
    } catch (error) {
      console.log('AP RSS feed unavailable');
    }

    return articles.slice(0, 15); // Limit to 15 articles from open sources
  }

  /**
   * Parse RSS feed XML data
   */
  private parseRSSFeed(xmlData: string, source: string, region: string): NewsArticle[] {
    // Simple XML parsing for RSS feeds
    const articles: NewsArticle[] = [];
    
    try {
      // Basic regex parsing for RSS items
      const itemRegex = /<item>(.*?)<\/item>/gs;
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
          
          // Only include if relevant to region or aviation
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

  /**
   * Check if content is relevant to the specified region
   */
  private isRelevantToRegion(content: string, region: string): boolean {
    const keywords = this.getRegionKeywords(region);
    const lowerContent = content.toLowerCase();
    
    return keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
  }

  /**
   * Check if content is aviation-related
   */
  private isAviationRelated(content: string): boolean {
    const aviationTerms = ['aircraft', 'airline', 'airport', 'flight', 'aviation', 'airspace', 'pilot', 'crew'];
    const lowerContent = content.toLowerCase();
    
    return aviationTerms.some(term => lowerContent.includes(term));
  }

  /**
   * Get comprehensive geopolitical risk analysis from multiple news sources
   */
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
      // Fetch from multiple news sources including free APIs and RSS feeds
      const [newsApiArticles, guardianArticles, newsdataArticles, mediastackArticles, gnewsArticles, worldNewsArticles, nytArticles, openSourceArticles] = await Promise.allSettled([
        this.fetchFromNewsApi(region),
        this.fetchFromGuardian(region),
        this.fetchFromNewsData(region),
        this.fetchFromMediastack(region),
        this.fetchFromGNews(region),
        this.fetchFromWorldNews(region),
        this.fetchFromNYT(region),
        this.fetchFromOpenSources(region)
      ]);

      // Combine and analyze articles
      const allArticles: NewsArticle[] = [];
      
      if (newsApiArticles.status === 'fulfilled') {
        allArticles.push(...newsApiArticles.value);
      }
      
      if (guardianArticles.status === 'fulfilled') {
        allArticles.push(...guardianArticles.value);
      }
      
      if (newsdataArticles.status === 'fulfilled') {
        allArticles.push(...newsdataArticles.value);
      }
      
      if (mediastackArticles.status === 'fulfilled') {
        allArticles.push(...mediastackArticles.value);
      }
      
      if (gnewsArticles.status === 'fulfilled') {
        allArticles.push(...gnewsArticles.value);
      }
      
      if (worldNewsArticles.status === 'fulfilled') {
        allArticles.push(...worldNewsArticles.value);
      }
      
      if (nytArticles.status === 'fulfilled') {
        allArticles.push(...nytArticles.value);
      }
      
      if (openSourceArticles.status === 'fulfilled') {
        allArticles.push(...openSourceArticles.value);
      }

      // Generate risk analysis
      const analysis = this.analyzeGeopoliticalRisk(region, allArticles);
      
      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      return analysis;
    } catch (error) {
      console.error(`Failed to fetch geopolitical analysis for ${region}:`, error);
      return this.getFallbackAnalysis(region);
    }
  }

  /**
   * Fetch aviation-related news from NewsAPI
   */
  private async fetchFromNewsApi(region: string): Promise<NewsArticle[]> {
    if (!this.newsApiKey) {
      throw new Error('NewsAPI key not configured');
    }

    const keywords = this.getRegionKeywords(region);
    const query = `(${keywords.join(' OR ')}) AND (aviation OR airspace OR airline OR flight)`;

    const response = await axios.get('https://newsapi.org/v2/everything', {
      params: {
        q: query,
        sortBy: 'publishedAt',
        language: 'en',
        pageSize: 20,
        apiKey: this.newsApiKey
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
  }

  /**
   * Fetch from The Guardian API
   */
  private async fetchFromGuardian(region: string): Promise<NewsArticle[]> {
    if (!this.guardianApiKey) {
      throw new Error('Guardian API key not configured');
    }

    const keywords = this.getRegionKeywords(region);
    const query = keywords.join(' OR ');

    const response = await axios.get('https://content.guardianapis.com/search', {
      params: {
        q: query,
        section: 'world,business',
        'order-by': 'newest',
        'page-size': 15,
        'api-key': this.guardianApiKey,
        'show-fields': 'trailText,body'
      }
    });

    return response.data.response.results.map((article: any, index: number) => ({
      id: `guardian_${index}_${Date.now()}`,
      title: article.webTitle,
      description: article.fields?.trailText || '',
      url: article.webUrl,
      publishedAt: article.webPublicationDate,
      source: 'The Guardian',
      category: this.categorizeArticle(article.webTitle + ' ' + (article.fields?.trailText || '')),
      riskRelevance: this.assessRiskRelevance(article.webTitle + ' ' + (article.fields?.trailText || '')),
      affectedRegions: [region],
      keywords: this.extractKeywords(article.webTitle + ' ' + (article.fields?.trailText || ''))
    }));
  }

  /**
   * Fetch from NewsData.io API
   */
  private async fetchFromNewsData(region: string): Promise<NewsArticle[]> {
    if (!this.newsdataApiKey) {
      throw new Error('NewsData API key not configured');
    }

    const keywords = this.getRegionKeywords(region);
    const query = keywords.join(' OR ');

    const response = await axios.get('https://newsdata.io/api/1/news', {
      params: {
        apikey: this.newsdataApiKey,
        q: query,
        category: 'world,politics',
        language: 'en',
        size: 20
      }
    });

    return response.data.results.map((article: any, index: number) => ({
      id: `newsdata_${index}_${Date.now()}`,
      title: article.title,
      description: article.description || '',
      url: article.link,
      publishedAt: article.pubDate,
      source: article.source_id,
      category: this.categorizeArticle(article.title + ' ' + (article.description || '')),
      riskRelevance: this.assessRiskRelevance(article.title + ' ' + (article.description || '')),
      affectedRegions: [region],
      keywords: this.extractKeywords(article.title + ' ' + (article.description || ''))
    }));
  }

  /**
   * Fetch from Mediastack API
   */
  private async fetchFromMediastack(region: string): Promise<NewsArticle[]> {
    if (!this.mediastackApiKey) {
      throw new Error('Mediastack API key not configured');
    }

    const keywords = this.getRegionKeywords(region);
    const query = keywords.join(',');

    const response = await axios.get('http://api.mediastack.com/v1/news', {
      params: {
        access_key: this.mediastackApiKey,
        keywords: query,
        categories: 'general,politics',
        languages: 'en',
        limit: 20
      }
    });

    return response.data.data.map((article: any, index: number) => ({
      id: `mediastack_${index}_${Date.now()}`,
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.published_at,
      source: article.source,
      category: this.categorizeArticle(article.title + ' ' + (article.description || '')),
      riskRelevance: this.assessRiskRelevance(article.title + ' ' + (article.description || '')),
      affectedRegions: [region],
      keywords: this.extractKeywords(article.title + ' ' + (article.description || ''))
    }));
  }

  /**
   * Fetch from GNews API
   */
  private async fetchFromGNews(region: string): Promise<NewsArticle[]> {
    if (!this.gnewsApiKey) {
      throw new Error('GNews API key not configured');
    }

    const keywords = this.getRegionKeywords(region);
    const query = keywords.join(' OR ');

    const response = await axios.get('https://gnews.io/api/v4/search', {
      params: {
        q: query,
        token: this.gnewsApiKey,
        lang: 'en',
        country: 'us',
        max: 20
      }
    });

    return response.data.articles.map((article: any, index: number) => ({
      id: `gnews_${index}_${Date.now()}`,
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.publishedAt,
      source: article.source.name,
      category: this.categorizeArticle(article.title + ' ' + (article.description || '')),
      riskRelevance: this.assessRiskRelevance(article.title + ' ' + (article.description || '')),
      affectedRegions: [region],
      keywords: this.extractKeywords(article.title + ' ' + (article.description || ''))
    }));
  }

  /**
   * Fetch from World News API
   */
  private async fetchFromWorldNews(region: string): Promise<NewsArticle[]> {
    if (!this.worldNewsApiKey) {
      throw new Error('World News API key not configured');
    }

    const keywords = this.getRegionKeywords(region);
    const query = keywords.join(' ');

    const response = await axios.get('https://api.worldnewsapi.com/search-news', {
      params: {
        'api-key': this.worldNewsApiKey,
        text: query,
        language: 'en',
        number: 20,
        'earliest-publish-date': new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // Last 7 days
      }
    });

    return response.data.news.map((article: any, index: number) => ({
      id: `worldnews_${index}_${Date.now()}`,
      title: article.title,
      description: article.text || '',
      url: article.url,
      publishedAt: article.publish_date,
      source: article.source_country,
      category: this.categorizeArticle(article.title + ' ' + (article.text || '')),
      riskRelevance: this.assessRiskRelevance(article.title + ' ' + (article.text || '')),
      affectedRegions: [region],
      keywords: this.extractKeywords(article.title + ' ' + (article.text || ''))
    }));
  }

  /**
   * Fetch from New York Times API
   */
  private async fetchFromNYT(region: string): Promise<NewsArticle[]> {
    if (!this.nytApiKey) {
      throw new Error('New York Times API key not configured');
    }

    const keywords = this.getRegionKeywords(region);
    const query = keywords.join(' ');

    const response = await axios.get('https://api.nytimes.com/svc/search/v2/articlesearch.json', {
      params: {
        'api-key': this.nytApiKey,
        q: query,
        sort: 'newest',
        fl: 'web_url,snippet,lead_paragraph,headline,pub_date,source,byline',
        fq: 'section_name:("World" OR "Politics" OR "Business")',
        rows: 20
      }
    });

    return response.data.response.docs.map((article: any, index: number) => ({
      id: `nyt_${index}_${Date.now()}`,
      title: article.headline.main,
      description: article.snippet || article.lead_paragraph || '',
      url: article.web_url,
      publishedAt: article.pub_date,
      source: 'New York Times',
      category: this.categorizeArticle(article.headline.main + ' ' + (article.snippet || '')),
      riskRelevance: this.assessRiskRelevance(article.headline.main + ' ' + (article.snippet || '')),
      affectedRegions: [region],
      keywords: this.extractKeywords(article.headline.main + ' ' + (article.snippet || ''))
    }));
  }

  /**
   * Get region-specific search keywords
   */
  private getRegionKeywords(region: string): string[] {
    const regionKeywords: { [key: string]: string[] } = {
      'Eastern Mediterranean': ['israel', 'palestine', 'lebanon', 'syria', 'cyprus', 'turkey', 'airspace', 'military', 'conflict'],
      'South China Sea': ['china', 'taiwan', 'hong kong', 'philippines', 'vietnam', 'territorial', 'maritime', 'dispute'],
      'Eastern Europe': ['ukraine', 'russia', 'belarus', 'poland', 'baltic', 'sanctions', 'nato', 'airspace'],
      'North Atlantic': ['iceland', 'greenland', 'weather', 'storms', 'aviation', 'routing'],
      'Middle East': ['iran', 'iraq', 'saudi arabia', 'uae', 'gulf', 'sanctions', 'oil', 'airspace'],
      'South Asia': ['india', 'pakistan', 'afghanistan', 'kashmir', 'terrorism', 'border'],
      'Africa': ['libya', 'sudan', 'ethiopia', 'somalia', 'political', 'instability', 'conflict']
    };

    return regionKeywords[region] || ['aviation', 'airspace', 'geopolitical'];
  }

  /**
   * Categorize news articles by type
   */
  private categorizeArticle(content: string): 'geopolitical' | 'aviation' | 'economic' | 'security' {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('aircraft') || lowerContent.includes('airline') || lowerContent.includes('airport') || lowerContent.includes('flight')) {
      return 'aviation';
    }
    
    if (lowerContent.includes('security') || lowerContent.includes('terrorism') || lowerContent.includes('threat')) {
      return 'security';
    }
    
    if (lowerContent.includes('trade') || lowerContent.includes('economy') || lowerContent.includes('sanctions') || lowerContent.includes('embargo')) {
      return 'economic';
    }
    
    return 'geopolitical';
  }

  /**
   * Assess risk relevance of articles
   */
  private assessRiskRelevance(content: string): 'high' | 'medium' | 'low' {
    const lowerContent = content.toLowerCase();
    const highRiskTerms = ['conflict', 'war', 'crisis', 'emergency', 'closure', 'restriction', 'ban', 'attack', 'threat'];
    const mediumRiskTerms = ['tension', 'dispute', 'concern', 'warning', 'delay', 'disruption', 'protest'];
    
    if (highRiskTerms.some(term => lowerContent.includes(term))) {
      return 'high';
    }
    
    if (mediumRiskTerms.some(term => lowerContent.includes(term))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Extract relevant keywords from article content
   */
  private extractKeywords(content: string): string[] {
    const keywords = new Set<string>();
    const aviationTerms = ['airspace', 'airport', 'airline', 'aircraft', 'flight', 'aviation', 'atc', 'notam'];
    const geopoliticalTerms = ['sanctions', 'embargo', 'conflict', 'diplomacy', 'military', 'security', 'border'];
    
    const allTerms = [...aviationTerms, ...geopoliticalTerms];
    const lowerContent = content.toLowerCase();
    
    allTerms.forEach(term => {
      if (lowerContent.includes(term)) {
        keywords.add(term);
      }
    });
    
    return Array.from(keywords);
  }

  /**
   * Analyze geopolitical risk based on news articles
   */
  private analyzeGeopoliticalRisk(region: string, articles: NewsArticle[]): GeopoliticalNewsAnalysis {
    // Sort articles by risk relevance and recency
    const sortedArticles = articles
      .sort((a, b) => {
        const riskScore = { 'high': 3, 'medium': 2, 'low': 1 };
        const aScore = riskScore[a.riskRelevance];
        const bScore = riskScore[b.riskRelevance];
        
        if (aScore !== bScore) return bScore - aScore;
        
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      })
      .slice(0, 10); // Top 10 most relevant articles

    // Calculate overall risk level
    const highRiskArticles = articles.filter(a => a.riskRelevance === 'high').length;
    const mediumRiskArticles = articles.filter(a => a.riskRelevance === 'medium').length;
    
    let overallRisk: 'critical' | 'high' | 'medium' | 'low' = 'low';
    
    if (highRiskArticles >= 3) {
      overallRisk = 'critical';
    } else if (highRiskArticles >= 1 || mediumRiskArticles >= 5) {
      overallRisk = 'high';
    } else if (mediumRiskArticles >= 2) {
      overallRisk = 'medium';
    }

    // Generate risk factors from articles
    const riskFactors = this.generateRiskFactors(articles, region);
    
    // Generate summary and recommendations
    const summary = this.generateSummary(region, articles, overallRisk);
    const recommendations = this.generateRecommendations(region, overallRisk, articles);

    return {
      region,
      riskLevel: overallRisk,
      articles: sortedArticles,
      riskFactors,
      summary,
      recommendations
    };
  }

  /**
   * Generate risk factors from news analysis
   */
  private generateRiskFactors(articles: NewsArticle[], region: string): any[] {
    const factors: any[] = [];
    const categoryMap = new Map<string, { count: number, articles: NewsArticle[] }>();
    
    articles.forEach(article => {
      const category = article.category;
      if (!categoryMap.has(category)) {
        categoryMap.set(category, { count: 0, articles: [] });
      }
      categoryMap.get(category)!.count++;
      categoryMap.get(category)!.articles.push(article);
    });

    categoryMap.forEach((data, category) => {
      const impact = data.count >= 3 ? 'high' : data.count >= 1 ? 'medium' : 'low';
      const recentArticle = data.articles.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )[0];

      factors.push({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        impact,
        description: `${data.count} recent ${category} developments affecting regional aviation operations`,
        source: recentArticle?.source || 'Multiple sources',
        lastUpdated: recentArticle?.publishedAt || new Date().toISOString()
      });
    });

    return factors;
  }

  /**
   * Generate summary based on risk analysis
   */
  private generateSummary(region: string, articles: NewsArticle[], riskLevel: string): string {
    const articleCount = articles.length;
    const highRiskCount = articles.filter(a => a.riskRelevance === 'high').length;
    
    return `Based on analysis of ${articleCount} recent news articles, ${region} presents ${riskLevel} risk to aviation operations. ${highRiskCount} high-priority developments identified requiring immediate attention.`;
  }

  /**
   * Generate operational recommendations
   */
  private generateRecommendations(region: string, riskLevel: string, articles: NewsArticle[]): string[] {
    const recommendations: string[] = [];
    
    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Implement enhanced flight monitoring procedures');
      recommendations.push('Brief crew on current regional security situation');
      recommendations.push('Prepare alternative routing options');
      recommendations.push('Increase communication frequency with regional ATC');
    }
    
    if (articles.some(a => a.keywords.includes('sanctions'))) {
      recommendations.push('Verify fuel supplier compliance with current sanctions');
      recommendations.push('Review payment processing procedures');
    }
    
    if (articles.some(a => a.keywords.includes('airspace'))) {
      recommendations.push('Monitor NOTAM updates every 2 hours');
      recommendations.push('File flight plans with extended lead time');
    }
    
    recommendations.push('Continue monitoring news developments');
    
    return recommendations;
  }

  /**
   * Fallback analysis when news APIs are unavailable
   */
  private getFallbackAnalysis(region: string): GeopoliticalNewsAnalysis {
    return {
      region,
      riskLevel: 'medium',
      articles: [],
      riskFactors: [
        {
          category: 'Data Availability',
          impact: 'medium',
          description: 'Limited real-time news data available - using cached intelligence',
          source: 'System',
          lastUpdated: new Date().toISOString()
        }
      ],
      summary: `Unable to retrieve current news data for ${region}. Operating with cached geopolitical intelligence.`,
      recommendations: [
        'Monitor traditional news sources manually',
        'Contact regional operations for current situation updates',
        'Proceed with standard risk mitigation procedures'
      ]
    };
  }

  /**
   * Test news API connections
   */
  async testConnections(): Promise<{ [key: string]: { success: boolean; message: string } }> {
    const results: { [key: string]: { success: boolean; message: string } } = {};

    // Test NewsAPI
    try {
      if (!this.newsApiKey) {
        results.newsapi = { success: false, message: 'API key not configured' };
      } else {
        await axios.get('https://newsapi.org/v2/top-headlines', {
          params: { country: 'us', pageSize: 1, apiKey: this.newsApiKey }
        });
        results.newsapi = { success: true, message: 'Connection successful' };
      }
    } catch (error: any) {
      results.newsapi = { success: false, message: error.message };
    }

    // Test Guardian API
    try {
      if (!this.guardianApiKey) {
        results.guardian = { success: false, message: 'API key not configured' };
      } else {
        await axios.get('https://content.guardianapis.com/search', {
          params: { 'page-size': 1, 'api-key': this.guardianApiKey }
        });
        results.guardian = { success: true, message: 'Connection successful' };
      }
    } catch (error: any) {
      results.guardian = { success: false, message: error.message };
    }

    return results;
  }
}

export const newsApiService = new NewsApiService();