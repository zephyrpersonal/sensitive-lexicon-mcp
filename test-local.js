// 简单的本地测试脚本
import { SensitiveDetector } from './src/sensitive-detector.js';

async function test() {
  console.log('开始测试敏感词检测器...');
  
  const detector = new SensitiveDetector();
  
  try {
    console.log('正在初始化敏感词库...');
    await detector.initialize();
    console.log('初始化完成');
    
    // 测试检测功能
    const testText = "这是一个测试文本，包含一些可能的敏感内容";
    console.log(`\n测试文本: "${testText}"`);
    
    const result = detector.detect(testText);
    console.log('检测结果:', JSON.stringify(result, null, 2));
    
    // 测试过滤功能
    const filterResult = detector.filter(testText);
    console.log('过滤结果:', JSON.stringify(filterResult, null, 2));
    
    // 获取分类信息
    const categories = detector.getAvailableCategories();
    console.log(`\n可用分类 (${categories.length}个):`, categories);
    
    // 获取词汇统计
    const totalWords = detector.getWordCount();
    console.log(`\n总词汇数: ${totalWords}`);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

test();