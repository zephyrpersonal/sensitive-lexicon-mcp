import fetch from 'node-fetch';

export interface SensitiveWord {
  word: string;
  category: string;
}

export interface DetectionResult {
  isSensitive: boolean;
  sensitiveWords: SensitiveWord[];
  originalText: string;
  filteredText?: string;
}

export class SensitiveDetector {
  private wordLists: Map<string, Set<string>> = new Map();
  private isInitialized = false;

  private readonly vocabularyFiles = [
    'COVID-19词库.txt',
    'GFW补充词库.txt',
    '其他词库.txt',
    '反动词库.txt',
    '广告类型.txt',
    '政治类型.txt',
    '暴恐词库.txt',
    '民生词库.txt',
    '涉枪涉爆.txt',
    '色情类型.txt',
    '色情词库.txt',
    '补充词库.txt',
    '贪腐词库.txt',
    '零时-Tencent.txt',
    '非法网址.txt'
  ];

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    for (const filename of this.vocabularyFiles) {
      try {
        const category = this.getCategoryFromFilename(filename);
        const words = await this.fetchWordList(filename);
        this.wordLists.set(category, new Set(words));
      } catch (error) {
        console.warn(`Failed to load ${filename}:`, error);
      }
    }

    this.isInitialized = true;
  }

  private getCategoryFromFilename(filename: string): string {
    const mapping: Record<string, string> = {
      'COVID-19词库.txt': 'covid19',
      'GFW补充词库.txt': 'gfw',
      '其他词库.txt': 'other',
      '反动词库.txt': 'subversive',
      '广告类型.txt': 'advertisement',
      '政治类型.txt': 'political',
      '暴恐词库.txt': 'violence',
      '民生词库.txt': 'livelihood',
      '涉枪涉爆.txt': 'weapons',
      '色情类型.txt': 'pornography-type',
      '色情词库.txt': 'pornography',
      '补充词库.txt': 'supplementary',
      '贪腐词库.txt': 'corruption',
      '零时-Tencent.txt': 'tencent',
      '非法网址.txt': 'illegal-urls'
    };
    return mapping[filename] || 'unknown';
  }

  private async fetchWordList(filename: string): Promise<string[]> {
    const url = `https://raw.githubusercontent.com/konsheng/Sensitive-lexicon/master/Vocabulary/${encodeURIComponent(filename)}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.startsWith('#'));
    } catch (error) {
      console.error(`Error fetching ${filename}:`, error);
      return [];
    }
  }

  detect(text: string, categories?: string[]): DetectionResult {
    if (!this.isInitialized) {
      throw new Error('SensitiveDetector not initialized. Call initialize() first.');
    }

    const sensitiveWords: SensitiveWord[] = [];
    const categoriesToCheck = categories || Array.from(this.wordLists.keys());

    for (const category of categoriesToCheck) {
      const wordSet = this.wordLists.get(category);
      if (!wordSet) continue;

      for (const word of wordSet) {
        if (text.toLowerCase().includes(word.toLowerCase())) {
          sensitiveWords.push({ word, category });
        }
      }
    }

    return {
      isSensitive: sensitiveWords.length > 0,
      sensitiveWords,
      originalText: text
    };
  }

  filter(text: string, replacement: string = '***', categories?: string[]): DetectionResult {
    const result = this.detect(text, categories);
    
    if (!result.isSensitive) {
      result.filteredText = text;
      return result;
    }

    let filteredText = text;
    for (const { word } of result.sensitiveWords) {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      filteredText = filteredText.replace(regex, replacement);
    }

    result.filteredText = filteredText;
    return result;
  }

  getAvailableCategories(): string[] {
    return Array.from(this.wordLists.keys());
  }

  getWordCount(category?: string): number {
    if (category) {
      const wordSet = this.wordLists.get(category);
      return wordSet ? wordSet.size : 0;
    }
    
    let total = 0;
    for (const wordSet of this.wordLists.values()) {
      total += wordSet.size;
    }
    return total;
  }
}