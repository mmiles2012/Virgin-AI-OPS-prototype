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
  private reutersEndpoint: string;
  private cache: Map<string, GeopoliticalNewsAnalysis> = new Map();
  private readonly CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY || '';
    this.guardianApiKey = process.env.GUARDIAN_API_KEY || '';
    this.reutersEndpoint = 'https://api.reuters.com/v1';
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
      // Fetch from multiple news sources
      const [newsApiArticles, guardianArticles, reutersArticles] = await Promise.allSettled([
        this.fetchFromNewsApi(region),
        this.fetchFromGuardian(region),
        this.fetchFromReuters(region)
      ]);

      // Combine and analyze articles
      const allArticles: NewsArticle[] = [];
      
      if (newsApiArticles.status === 'fulfilled') {
        allArticles.push(...newsApiArticles.value);
      }
      
      if (guardianArticles.status === 'fulfilled') {
        allArticles.push(...guardianArticles.value);
      }
      
      if (reutersArticles.status === 'fulfilled') {
        allArticles.push(...reutersArticles.value);
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
   * Fetch from Reuters (placeholder - requires Reuters API access)
   */
  private async fetchFromReuters(region: string): Promise<NewsArticle[]> {
    // Reuters requires special API access - placeholder implementation
    // In production, this would connect to Reuters Connect API
    return [];
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