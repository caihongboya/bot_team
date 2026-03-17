import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，因为需要读取查询参数
export const dynamic = 'force-dynamic';

/**
 * 中文搜索优化函数
 * 1. 将中文查询词拆分为单个字符和词组组合
 * 2. 支持拼音首字母搜索（可选）
 * 3. 提高标题匹配权重
 */
function buildChineseSearchQuery(query: string): string {
  // 去除首尾空格
  const trimmed = query.trim();
  
  // 如果查询很短（1-2 个字符），直接返回
  if (trimmed.length <= 2) {
    return trimmed;
  }
  
  // 将查询拆分为字符，并用 | 连接（OR 关系）
  // 同时保留完整词组的匹配
  const chars = trimmed.split('').filter(c => c.trim());
  
  // 构建搜索查询：完整词组 + 单个字符
  // 例如："猫咪疾病" -> "猫咪疾病 | 猫 | 咪 | 疾 | 病"
  const charQuery = chars.join(' | ');
  
  return `${trimmed} | ${charQuery}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category'); // 可选：按分类筛选

    if (!q || q.trim() === '') {
      return NextResponse.json({
        query: '',
        data: [],
        pagination: {
          page: 1,
          limit,
          total: 0,
        },
      });
    }

    const offset = (page - 1) * limit;

    // 构建优化的中文搜索查询
    const searchQuery = buildChineseSearchQuery(q);

    // 基础查询条件
    const whereConditions = [
      'as.search_vector @@ websearch_to_tsquery(\'simple\', $1)',
      'a.status = \'published\''
    ];
    
    // 如果指定了分类，添加分类筛选
    const queryParams: unknown[] = [searchQuery];
    let paramIndex = 2;
    
    if (category) {
      whereConditions.push(`(c.slug = $${paramIndex} OR p.slug = $${paramIndex})`);
      queryParams.push(category);
      paramIndex++;
    }

    const whereClause = whereConditions.join(' AND ');

    const searchSql = `
      SELECT 
        a.id,
        a.title,
        a.slug,
        a.summary,
        a.cover_image,
        c.name as category_name,
        c.slug as category_slug,
        ts_rank(as.search_vector, websearch_to_tsquery('simple', $1)) as score,
        ts_headline(
          'simple',
          COALESCE(a.summary, a.content_md),
          websearch_to_tsquery('simple', $1),
          'StartSel=<b>, StopSel=</b>, MaxFragments=3, FragmentDelimiter=...'
        ) as highlight
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      JOIN article_search as ON a.id = as.article_id
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE ${whereClause}
      ORDER BY score DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const results = await query(searchSql, queryParams);

    // 获取总数
    const countWhereClause = whereConditions.join(' AND ');
    const countSql = `
      SELECT COUNT(*) as total
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      JOIN article_search as ON a.id = as.article_id
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE ${countWhereClause}
    `;

    const countQueryParams = category ? [searchQuery, category] : [searchQuery];
    const countResult = await query(countSql, countQueryParams);
    const total = parseInt(countResult.rows[0].total);

    // 格式化响应数据
    const data = results.rows.map((row: unknown) => {
      const r = row as Record<string, unknown>;
      return {
        id: r.id as number,
        title: r.title as string,
        slug: r.slug as string,
        summary: r.summary as string,
        highlight: r.highlight as string,
        category: {
          name: r.category_name as string,
          slug: r.category_slug as string,
        },
        score: parseFloat(r.score as string),
      };
    });

    return NextResponse.json({
      query: q,
      data,
      pagination: {
        page,
        limit,
        total,
      },
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      { error: 'Failed to search articles' },
      { status: 500 }
    );
  }
}
