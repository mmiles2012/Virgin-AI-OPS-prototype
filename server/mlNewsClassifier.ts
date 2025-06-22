import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import path from 'path';

interface NewsArticle {
  title: string;
  content: string;
  source: string;
  publishedAt: string;
}

interface MLClassificationResult {
  relevance_score: number;
  categories: string[];
  impact_level: string;
  operational_significance: string;
  confidence: number;
}

class MLNewsClassifier {
  private pythonScript: string;
  private modelPath: string;
  private isTraining: boolean = false;

  constructor() {
    this.pythonScript = path.join(process.cwd(), 'aviation_news_intelligence.py');
    this.modelPath = path.join(process.cwd(), 'news_ml_model.pkl');
  }

  async classifyArticle(article: NewsArticle): Promise<MLClassificationResult> {
    return new Promise((resolve, reject) => {
      const inputData = {
        title: article.title,
        content: article.content || '',
        source: article.source,
        published_at: article.publishedAt
      };

      // Write input data to temporary file
      const inputFile = path.join(process.cwd(), 'temp_article.json');
      writeFileSync(inputFile, JSON.stringify(inputData));

      // Run Python ML classifier
      const pythonProcess = spawn('python3', [
        this.pythonScript,
        '--classify',
        '--input', inputFile
      ]);

      let output = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve({
              relevance_score: result.relevance_score || this.calculateFallbackScore(article),
              categories: result.categories || this.classifyFallback(article),
              impact_level: result.impact_level || this.getImpactLevel(result.relevance_score || 50),
              operational_significance: result.operational_significance || this.getOperationalSignificance(article),
              confidence: result.confidence || 0.75
            });
          } catch (parseError) {
            // Fallback to rule-based classification
            resolve(this.fallbackClassification(article));
          }
        } else {
          // Fallback to rule-based classification on Python error
          resolve(this.fallbackClassification(article));
        }
      });

      pythonProcess.on('error', () => {
        // Fallback to rule-based classification
        resolve(this.fallbackClassification(article));
      });
    });
  }

  private fallbackClassification(article: NewsArticle): MLClassificationResult {
    const relevanceScore = this.calculateFallbackScore(article);
    return {
      relevance_score: relevanceScore,
      categories: this.classifyFallback(article),
      impact_level: this.getImpactLevel(relevanceScore),
      operational_significance: this.getOperationalSignificance(article),
      confidence: 0.65 // Lower confidence for fallback
    };
  }

  private calculateFallbackScore(article: NewsArticle): number {
    const text = (article.title + ' ' + (article.content || '')).toLowerCase();
    let score = 0;

    // High-value aviation keywords
    const highValueKeywords = ['virgin atlantic', 'boeing 787', 'airbus a350', 'icao', 'faa', 'safety'];
    const mediumValueKeywords = ['aviation', 'airline', 'aircraft', 'airport', 'fuel', 'maintenance'];
    const lowValueKeywords = ['flight', 'pilot', 'crew', 'passenger', 'route'];

    highValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 30;
    });

    mediumValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 15;
    });

    lowValueKeywords.forEach(keyword => {
      if (text.includes(keyword)) score += 5;
    });

    // Boost for recency
    const publishedDate = new Date(article.publishedAt);
    const hoursAgo = (Date.now() - publishedDate.getTime()) / (1000 * 3600);
    if (hoursAgo < 6) score += 20;
    else if (hoursAgo < 24) score += 10;

    return Math.min(score, 100);
  }

  private classifyFallback(article: NewsArticle): string[] {
    const text = (article.title + ' ' + (article.content || '')).toLowerCase();
    const categories = [];

    if (/aviation|airline|aircraft|airport|flight|pilot|crew|boeing|airbus/.test(text)) {
      categories.push('direct_aviation');
    }
    if (/fuel|oil|energy|cost|price/.test(text)) {
      categories.push('energy');
    }
    if (/icao|faa|regulation|safety|compliance/.test(text)) {
      categories.push('regulation');
    }
    if (/economic|financial|market|stock|revenue/.test(text)) {
      categories.push('economics');
    }
    if (/weather|storm|climate|delay|cancel/.test(text)) {
      categories.push('weather');
    }

    return categories.length > 0 ? categories : ['general'];
  }

  private getImpactLevel(score: number): string {
    if (score >= 70) return 'high';
    if (score >= 40) return 'medium';
    return 'low';
  }

  private getOperationalSignificance(article: NewsArticle): string {
    const text = (article.title + ' ' + (article.content || '')).toLowerCase();
    
    if (text.includes('virgin atlantic') || text.includes('british airways')) {
      return 'Direct operational relevance - UK carrier impact';
    }
    if (text.includes('safety') || text.includes('emergency')) {
      return 'Critical - Safety implications';
    }
    if (text.includes('fuel') || text.includes('cost')) {
      return 'Medium - Cost optimization required';
    }
    if (text.includes('maintenance') || text.includes('technology')) {
      return 'Operational efficiency potential';
    }
    
    return 'Industry intelligence monitoring';
  }

  async trainModel(trainingData: NewsArticle[]): Promise<boolean> {
    if (this.isTraining) return false;
    
    this.isTraining = true;
    
    return new Promise((resolve) => {
      const trainingFile = path.join(process.cwd(), 'training_data.json');
      writeFileSync(trainingFile, JSON.stringify(trainingData));

      const pythonProcess = spawn('python3', [
        this.pythonScript,
        '--train',
        '--data', trainingFile
      ]);

      pythonProcess.on('close', (code) => {
        this.isTraining = false;
        resolve(code === 0);
      });

      pythonProcess.on('error', () => {
        this.isTraining = false;
        resolve(false);
      });
    });
  }

  isModelTrained(): boolean {
    return existsSync(this.modelPath);
  }

  getModelStatus(): { trained: boolean, training: boolean, lastUpdated?: string } {
    return {
      trained: this.isModelTrained(),
      training: this.isTraining,
      lastUpdated: this.isModelTrained() ? new Date().toISOString() : undefined
    };
  }
}

export default MLNewsClassifier;