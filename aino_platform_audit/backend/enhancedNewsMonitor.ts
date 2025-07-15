import axios from 'axios';

interface AdvancedNewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  sourceName: string;
  relevanceScores: {
    geopolitical: number;
    aviationEvents: number;
    oilEnergy: number;
    transport: number;
    security: number;
  };
  primaryCategory: string;
  totalScore: number;
  processedAt: string;
  region?: string;
}

interface CategoryKeywords {
  geopolitical: string[];
  aviationEvents: string[];
  oilEnergy: string[];
  transport: string[];
  security: string[];
}

export class EnhancedAviationNewsMonitor {
  private newsApiKey: string;
  private keywords: CategoryKeywords;
  private aviationSources: { [key: string]: string };

  constructor() {
    this.newsApiKey = process.env.NEWS_API_KEY || '';
    
    this.keywords = {
      geopolitical: [
        'sanctions', 'airspace', 'flight ban', 'diplomatic', 'embassy',
        'border', 'conflict', 'war', 'peace talks', 'treaty',
        'international relations', 'trade war', 'tariff', 'embargo',
        'sovereignty', 'territorial dispute', 'military exercise'
      ],
      aviationEvents: [
        'aircraft', 'airline', 'airport', 'flight', 'aviation',
        'crash', 'incident', 'emergency landing', 'turbulence',
        'boeing', 'airbus', 'pilot', 'air traffic', 'runway',
        'maintenance', 'safety', 'faa', 'icao', 'air travel',
        'notam', 'airworthiness', 'certification', 'grounding'
      ],
      oilEnergy: [
        'oil price', 'crude oil', 'fuel cost', 'jet fuel',
        'energy crisis', 'opec', 'petroleum', 'refinery',
        'fuel shortage', 'gas price', 'energy supply',
        'fuel efficiency', 'sustainable aviation fuel', 'biofuel'
      ],
      transport: [
        'transportation', 'logistics', 'supply chain', 'cargo',
        'freight', 'shipping', 'port', 'strike', 'union',
        'infrastructure', 'rail', 'trucking', 'maritime',
        'air cargo', 'ground handling', 'baggage handling'
      ],
      security: [
        'terrorist', 'terrorism', 'security threat', 'hijack',
        'bomb threat', 'screening', 'tsa', 'security alert',
        'suspicious activity', 'airport security', 'no-fly',
        'watchlist', 'cyber attack', 'drone threat',
        'biometric', 'passenger screening', 'cargo security'
      ]
    };

    this.aviationSources = {
      'Reuters Aviation': 'reuters aviation aerospace',
      'BBC Transport': 'transport aviation airline',
      'Aviation Week': 'aviation week aerospace',
      'Flight Global': 'flight global aviation news',
      'Air Transport World': 'air transport world airline',
      'Aviation International': 'aviation international news'
    };
  }

  /**
   * Calculate relevance scores for different categories
   */
  private calculateRelevanceScore(text: string): { [key: string]: number } {
    const textLower = text.toLowerCase();
    const scores: { [key: string]: number } = {};

    for (const [category, keywords] of Object.entries(this.keywords)) {
      let score = 0;
      
      for (const keyword of keywords) {
        // Exact phrase matches get higher weight
        if (textLower.includes(keyword.toLowerCase())) {
          const occurrences = (textLower.match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
          score += occurrences * 3;
        }
        
        // Word boundary matches for individual words
        const words = keyword.toLowerCase().split(' ');
        for (const word of words) {
          if (word.length > 3) { // Skip short words
            const wordRegex = new RegExp(`\\b${word}\\b`, 'gi');
            const wordMatches = (textLower.match(wordRegex) || []).length;
            score += wordMatches;
          }
        }
      }
      
      scores[category] = score;
    }

    return scores;
  }

  /**
   * Check if article is aviation-relevant
   */
  private isAviationRelevant(article: any, minScore: number = 3): boolean {
    const combinedText = `${article.title || ''} ${article.description || ''}`;
    const scores = this.calculateRelevanceScore(combinedText);
    
    // Article is relevant if total score exceeds threshold
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    return totalScore >= minScore;
  }

  /**
   * Classify article and add metadata
   */
  private classifyArticle(article: any, sourceName: string): AdvancedNewsArticle {
    const combinedText = `${article.title || ''} ${article.description || ''}`;
    const relevanceScores = this.calculateRelevanceScore(combinedText);
    
    // Find primary category (highest score)
    const primaryCategory = Object.keys(relevanceScores).reduce((max, category) => 
      relevanceScores[category] > relevanceScores[max] ? category : max
    );
    
    const totalScore = Object.values(relevanceScores).reduce((sum, score) => sum + score, 0);

    return {
      id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: article.title || '',
      description: article.description || '',
      url: article.url || '',
      publishedAt: article.publishedAt || new Date().toISOString(),
      source: article.source?.name || sourceName,
      sourceName,
      relevanceScores: {
        geopolitical: relevanceScores.geopolitical || 0,
        aviationEvents: relevanceScores.aviationEvents || 0,
        oilEnergy: relevanceScores.oilEnergy || 0,
        transport: relevanceScores.transport || 0,
        security: relevanceScores.security || 0
      },
      primaryCategory,
      totalScore,
      processedAt: new Date().toISOString(),
      region: this.detectRegion(combinedText)
    };
  }

  /**
   * Detect geographic region from article content
   */
  private detectRegion(text: string): string | undefined {
    const textLower = text.toLowerCase();
    
    const regionKeywords = {
      'North America': ['united states', 'usa', 'canada', 'mexico', 'american', 'washington', 'ottawa'],
      'Europe': ['europe', 'european', 'eu', 'nato', 'germany', 'france', 'uk', 'britain', 'italy'],
      'Asia': ['asia', 'china', 'japan', 'korea', 'india', 'singapore', 'bangkok', 'tokyo'],
      'Middle East': ['middle east', 'iran', 'iraq', 'syria', 'israel', 'saudi', 'dubai', 'qatar'],
      'Africa': ['africa', 'nigeria', 'south africa', 'egypt', 'morocco', 'kenya', 'ethiopia'],
      'South America': ['brazil', 'argentina', 'chile', 'colombia', 'venezuela', 'peru'],
      'Oceania': ['australia', 'new zealand', 'pacific', 'fiji', 'samoa']
    };

    for (const [region, keywords] of Object.entries(regionKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return region;
      }
    }

    return undefined;
  }

  /**
   * Fetch enhanced aviation news using NewsAPI with advanced queries
   */
  async fetchEnhancedAviationNews(): Promise<AdvancedNewsArticle[]> {
    if (!this.newsApiKey) {
      throw new Error('NewsAPI key not configured');
    }

    const articles: AdvancedNewsArticle[] = [];

    // Enhanced aviation-specific queries
    const queries = [
      'aviation OR aircraft OR airline OR airport',
      'airspace OR flight ban OR air traffic',
      'boeing OR airbus OR aircraft manufacturer',
      'jet fuel OR aviation fuel OR airline costs',
      'airport security OR aviation safety OR air transport',
      'pilot OR crew OR air traffic control',
      'cargo OR freight OR air cargo',
      'drone OR unmanned aircraft OR UAV'
    ];

    for (const query of queries) {
      try {
        const response = await axios.get('https://newsapi.org/v2/everything', {
          params: {
            q: query,
            sortBy: 'publishedAt',
            pageSize: 20,
            apiKey: this.newsApiKey,
            language: 'en',
            from: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // Last 24 hours
          }
        });

        const queryArticles = response.data.articles
          .filter((article: any) => this.isAviationRelevant(article))
          .map((article: any) => this.classifyArticle(article, 'NewsAPI Enhanced'));

        articles.push(...queryArticles);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error fetching news for query "${query}":`, error);
      }
    }

    // Remove duplicates based on URL
    const uniqueArticles = articles.reduce((unique, article) => {
      if (!unique.find(a => a.url === article.url)) {
        unique.push(article);
      }
      return unique;
    }, [] as AdvancedNewsArticle[]);

    // Sort by relevance score
    return uniqueArticles.sort((a, b) => b.totalScore - a.totalScore);
  }

  /**
   * Filter articles by category
   */
  filterByCategory(articles: AdvancedNewsArticle[], category: string): AdvancedNewsArticle[] {
    return articles.filter(article => article.primaryCategory === category);
  }

  /**
   * Filter articles by region
   */
  filterByRegion(articles: AdvancedNewsArticle[], region: string): AdvancedNewsArticle[] {
    return articles.filter(article => article.region === region);
  }

  /**
   * Generate advanced analytics summary
   */
  generateAdvancedSummary(articles: AdvancedNewsArticle[]): {
    totalArticles: number;
    categoryBreakdown: { [key: string]: number };
    regionBreakdown: { [key: string]: number };
    topCategories: string[];
    averageRelevanceScore: number;
    criticalAlerts: AdvancedNewsArticle[];
  } {
    const categoryBreakdown: { [key: string]: number } = {};
    const regionBreakdown: { [key: string]: number } = {};
    let totalScore = 0;

    for (const article of articles) {
      // Category breakdown
      categoryBreakdown[article.primaryCategory] = 
        (categoryBreakdown[article.primaryCategory] || 0) + 1;
      
      // Region breakdown
      if (article.region) {
        regionBreakdown[article.region] = 
          (regionBreakdown[article.region] || 0) + 1;
      }
      
      totalScore += article.totalScore;
    }

    // Top categories by article count
    const topCategories = Object.entries(categoryBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category]) => category);

    // Critical alerts (high-score security or geopolitical articles)
    const criticalAlerts = articles.filter(article => 
      (article.primaryCategory === 'security' || article.primaryCategory === 'geopolitical') &&
      article.totalScore >= 15
    );

    return {
      totalArticles: articles.length,
      categoryBreakdown,
      regionBreakdown,
      topCategories,
      averageRelevanceScore: articles.length > 0 ? totalScore / articles.length : 0,
      criticalAlerts
    };
  }

  /**
   * Get trending topics from recent articles
   */
  getTrendingTopics(articles: AdvancedNewsArticle[]): { topic: string; count: number; category: string }[] {
    const topicCounts: { [key: string]: { count: number; category: string } } = {};
    
    for (const article of articles) {
      const words = `${article.title} ${article.description}`
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 4 && !['flight', 'airline', 'airport', 'aircraft'].includes(word));
      
      for (const word of words) {
        if (!topicCounts[word]) {
          topicCounts[word] = { count: 0, category: article.primaryCategory };
        }
        topicCounts[word].count++;
      }
    }

    return Object.entries(topicCounts)
      .map(([topic, data]) => ({ topic, count: data.count, category: data.category }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
}

export const enhancedNewsMonitor = new EnhancedAviationNewsMonitor();