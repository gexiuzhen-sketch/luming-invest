#!/usr/bin/env node
/**
 * 股票代码格式验证脚本
 *
 * 验证规则：
 * - A股：6位数字 (000001-999999)
 * - 港股：5位数字，以0开头 (00000-09999)
 * - 美股：字母，可能包含点 (AAPL, BRK.B)
 *
 * 使用方法：
 *   node scripts/validate-stock-codes.js
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');

// 要检查的文件
const FILES_TO_CHECK = [
  'src/services/api.ts',
  'src/data/industryClassification.ts',
];

// 股票代码正则表达式
const STOCK_CODE_PATTERNS = {
  A_SHARE: /\b(000|002|300|600|601|603|605|688)\d{3}\b/g, // A股代码
  HK_STOCK: /\b0\d{4}\b/g, // 港股：5位，以0开头
  US_STOCK: /\b[A-Z]{1,5}(\.[A-Z])?\b/g, // 美股：字母，可能包含点
  FUND: /\b(5\d{5}|1[5-9]\d{4}|801\d{3})\b/g, // 基金：5开头、15-19开头、801开头
  INDEX: /\b(000\d{3}|399\d{3})\b/g, // 指数：000xxx或399xxx
};

// 基金代码白名单（申万行业指数等）
const FUND_CODE_WHITELIST = [
  '801010', '801020', '801030', '801040', '801050', '801060', '801070', '801080', '801090', '801100',
  '801110', '801120', '801130', '801140', '801150', '801160', '801170', '801180', '801190', '801200',
  '801210', '801220', '801230', '801240', '801250', '801260', '801270', '801280', '801290', '801710',
  '801730', '510300', '161725', '163406', '110011'
];

// 已知的问题代码（错误代码 -> 正确代码）
const KNOWN_ISSUES = {
  '01138': '01919', // 中远海控：01138不存在，应为01919
};

// 验证结果
const results = {
  valid: [],
  invalid: [],
  warnings: [],
};

/**
 * 检查股票代码是否有效
 */
function validateStockCode(code, context) {
  // 检查是否是已知问题代码
  if (KNOWN_ISSUES[code]) {
    results.warnings.push({
      code,
      issue: `已知问题代码，应为 ${KNOWN_ISSUES[code]}`,
      context,
      suggestion: `替换为 ${KNOWN_ISSUES[code]}`,
    });
    return false;
  }

  // 基金代码：在白名单中
  if (FUND_CODE_WHITELIST.includes(code)) {
    results.valid.push({ code, type: '基金/指数', context });
    return true;
  }

  // A股：6位数字
  if (/^\d{6}$/.test(code)) {
    const validPrefixes = ['000', '002', '300', '600', '601', '603', '605', '688'];
    const prefix = code.substring(0, 3);
    if (validPrefixes.includes(prefix)) {
      results.valid.push({ code, type: 'A股', context });
      return true;
    }
    // 指数代码：000xxx或399xxx
    if (/^(000|399)\d{3}$/.test(code)) {
      results.valid.push({ code, type: '指数', context });
      return true;
    }
  }

  // 港股：5位，以0开头
  if (/^0\d{4}$/.test(code)) {
    results.valid.push({ code, type: '港股', context });
    return true;
  }

  // 美股：字母，可能包含点
  if (/^[A-Z]{1,5}(\.[A-Z])?$/.test(code)) {
    results.valid.push({ code, type: '美股', context });
    return true;
  }

  // 无法识别的格式
  results.invalid.push({
    code,
    issue: '无法识别的股票代码格式',
    context,
  });
  return false;
}

/**
 * 从文件中提取股票代码
 */
function extractStockCodesFromFile(filePath, content) {
  const codes = [];

  // 匹配 code: '...' 或 code: "..." 模式
  const codePattern = /code\s*[:=]\s*['"]([^'"]+)['"]/g;
  let match;

  while ((match = codePattern.exec(content)) !== null) {
    codes.push({
      code: match[1],
      line: content.substring(0, match.index).split('\n').length,
      context: `${filePath}:${content.substring(0, match.index).split('\n').length}`,
    });
  }

  // 匹配对象键值（如 '01919': { ... }）
  const objectKeyPattern = /['"](\d{5,6}|[A-Z]{1,5}(\.[A-Z])?)['"]\s*:/g;
  while ((match = objectKeyPattern.exec(content)) !== null) {
    const potentialCode = match[1];
    // 只检查看起来像股票代码的
    if (/^\d{5,6}$/.test(potentialCode) || /^[A-Z]{1,5}(\.[A-Z])?$/.test(potentialCode)) {
      codes.push({
        code: potentialCode,
        line: content.substring(0, match.index).split('\n').length,
        context: `${filePath}:${content.substring(0, match.index).split('\n').length}`,
      });
    }
  }

  return codes;
}

/**
 * 主函数
 */
function main() {
  console.log('🔍 开始验证股票代码...\n');

  for (const relativePath of FILES_TO_CHECK) {
    const filePath = resolve(PROJECT_ROOT, relativePath);

    try {
      const content = readFileSync(filePath, 'utf-8');
      const extractedCodes = extractStockCodesFromFile(relativePath, content);

      console.log(`📄 检查文件: ${relativePath}`);

      for (const { code, line, context } of extractedCodes) {
        validateStockCode(code, context);
      }
    } catch (error) {
      console.error(`❌ 无法读取文件: ${relativePath}`);
      console.error(`   ${error.message}\n`);
    }
  }

  // 输出结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 验证结果');
  console.log('='.repeat(60));

  console.log(`\n✅ 有效的股票代码 (${results.valid.length}个):`);
  if (results.valid.length === 0) {
    console.log('   未找到股票代码');
  } else {
    // 按类型分组
    const byType = results.valid.reduce((acc, item) => {
      acc[item.type] = acc[item.type] || [];
      acc[item.type].push(item);
      return acc;
    }, {});

    for (const [type, codes] of Object.entries(byType)) {
      console.log(`\n   ${type}:`);
      codes.forEach(({ code, context }) => {
        console.log(`      ${code} - ${context}`);
      });
    }
  }

  if (results.warnings.length > 0) {
    console.log(`\n⚠️  警告 (${results.warnings.length}个):`);
    results.warnings.forEach(({ code, issue, context, suggestion }) => {
      console.log(`\n   📍 ${context}`);
      console.log(`      代码: ${code}`);
      console.log(`      问题: ${issue}`);
      if (suggestion) {
        console.log(`      建议: ${suggestion}`);
      }
    });
  }

  if (results.invalid.length > 0) {
    console.log(`\n❌ 无效的股票代码 (${results.invalid.length}个):`);
    results.invalid.forEach(({ code, issue, context }) => {
      console.log(`\n   📍 ${context}`);
      console.log(`      代码: ${code}`);
      console.log(`      问题: ${issue}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  // 返回退出码
  if (results.invalid.length > 0) {
    console.log('\n❌ 验证失败！发现无效的股票代码。\n');
    process.exit(1);
  } else if (results.warnings.length > 0) {
    console.log('\n⚠️  验证通过，但有警告需要注意。\n');
    process.exit(0);
  } else {
    console.log('\n✅ 验证通过！所有股票代码格式正确。\n');
    process.exit(0);
  }
}

main();
