#!/usr/bin/env node

/**
 * 内容导入工具
 * 
 * 用法：
 * npm run content:import              # 导入所有内容
 * npm run content:import -- --path content/cats/cat-breeds  # 导入指定目录
 * npm run content:sync                # 同步元数据（不覆盖已有内容）
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, basename } from 'path';
import parse from 'front-matter';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 加载 .env.local 文件
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/pet_encyclopedia',
});

interface ArticleFrontmatter {
  title: string;
  slug: string;
  category: string;
  subcategory: string;
  tags?: string[];
  coverImage?: string;
  summary: string;
  status?: 'draft' | 'published' | 'archived';
  createdAt?: string;
  updatedAt?: string;
}

async function getCategorySlug(category: string, subcategory: string): Promise<{ categoryId: number; subcategoryId: number }> {
  // 获取父分类 ID
  const parentResult = await pool.query(
    'SELECT id FROM categories WHERE slug = $1',
    [category]
  );

  if (parentResult.rows.length === 0) {
    throw new Error(`Category not found: ${category}`);
  }

  const categoryId = parentResult.rows[0].id;

  // 获取子分类 ID
  const subResult = await pool.query(
    'SELECT id FROM categories WHERE slug = $1 AND parent_id = $2',
    [subcategory, categoryId]
  );

  if (subResult.rows.length === 0) {
    throw new Error(`Subcategory not found: ${subcategory} under ${category}`);
  }

  return {
    categoryId,
    subcategoryId: subResult.rows[0].id,
  };
}

async function upsertTags(articleId: number, tagNames: string[]): Promise<void> {
  for (const tagName of tagNames) {
    const slug = tagName.toLowerCase().replace(/\s+/g, '-');

    // 插入或获取标签
    const tagResult = await pool.query(
      `INSERT INTO tags (name, slug) VALUES ($1, $2)
       ON CONFLICT (slug) DO UPDATE SET name = $1
       RETURNING id`,
      [tagName, slug]
    );

    const tagId = tagResult.rows[0].id;

    // 关联文章标签
    await pool.query(
      'INSERT INTO article_tags (article_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [articleId, tagId]
    );
  }
}

async function importFile(filePath: string, syncOnly = false): Promise<void> {
  const content = await readFile(filePath, 'utf-8');
  const parsed = parse<ArticleFrontmatter>(content);

  const { title, slug, category, subcategory, tags, coverImage, summary, status = 'draft' } = parsed.attributes;
  const contentMd = parsed.body;

  console.log(`导入文章：${title} (${slug})`);

  // 获取分类 ID
  const { categoryId, subcategoryId } = await getCategorySlug(category, subcategory);

  // 检查文章是否已存在
  const existingResult = await pool.query(
    'SELECT id FROM articles WHERE slug = $1',
    [slug]
  );

  if (existingResult.rows.length > 0 && syncOnly) {
    console.log(`  ⏭️  跳过（已存在）: ${slug}`);
    return;
  }

  // 插入或更新文章
  const articleResult = await pool.query(
    `INSERT INTO articles (
       title, slug, category_id, subcategory_id, summary, content_md,
       cover_image, status
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (slug) DO UPDATE SET
       title = $1,
       category_id = $3,
       subcategory_id = $4,
       summary = $5,
       content_md = $6,
       cover_image = $7,
       status = $8,
       updated_at = CURRENT_TIMESTAMP
     RETURNING id`,
    [title, slug, categoryId, subcategoryId, summary, contentMd, coverImage || null, status]
  );

  const articleId = articleResult.rows[0].id;

  // 处理标签
  if (tags && tags.length > 0) {
    // 清除旧标签关联
    await pool.query('DELETE FROM article_tags WHERE article_id = $1', [articleId]);
    await upsertTags(articleId, tags);
    console.log(`  ✅ 标签：${tags.join(', ')}`);
  }

  console.log(`  ✅ 导入成功 (ID: ${articleId})`);
}

async function walkDir(dirPath: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subFiles = await walkDir(fullPath);
      files.push(...subFiles);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function main() {
  const args = process.argv.slice(2);
  const pathIndex = args.indexOf('--path');
  const syncIndex = args.indexOf('--sync');

  const contentPath = pathIndex !== -1 
    ? join(process.cwd(), args[pathIndex + 1])
    : join(process.cwd(), 'src/content');

  const syncOnly = syncIndex !== -1;

  console.log(`\n📚 内容导入工具`);
  console.log(`路径：${contentPath}`);
  console.log(`模式：${syncOnly ? '同步（跳过已有）' : '完整导入'}\n`);

  try {
    const files = await walkDir(contentPath);
    console.log(`找到 ${files.length} 个 Markdown 文件\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const file of files) {
      try {
        await importFile(file, syncOnly);
        successCount++;
      } catch (error: any) {
        console.error(`  ❌ 错误：${basename(file)} - ${error.message}`);
        errorCount++;
      }
    }

    console.log(`\n✅ 导入完成：${successCount} 成功，${errorCount} 失败`);
  } catch (error: any) {
    console.error(`\n❌ 导入失败：${error.message}`);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
