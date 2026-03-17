import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 文章列表缓存 2 分钟
export const revalidate = 120;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category');
    const status = searchParams.get('status') || 'published';

    const offset = (page - 1) * limit;

    // 构建查询条件
    let whereClause = 'WHERE status = $1';
    let params: any[] = [status];
    let paramIndex = 2;

    if (category) {
      whereClause += ` AND category_slug = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // 获取文章列表
    const articlesQuery = `
      SELECT 
        id, title, slug, summary, cover_image, status, view_count, created_at,
        category_id, category_name, category_slug,
        parent_category_id, parent_category_name, parent_category_slug
      FROM article_list_view
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);

    const articlesResult = await query(articlesQuery, params);

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM article_list_view
      ${whereClause}
    `;

    const countResult = await query(countQuery, params.slice(0, paramIndex - 2));
    const total = parseInt(countResult.rows[0].total);

    // 格式化响应数据
    const data = articlesResult.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      summary: row.summary,
      coverImage: row.cover_image,
      category: {
        id: row.category_id,
        name: row.category_name,
        slug: row.category_slug,
      },
      createdAt: row.created_at,
      viewCount: row.view_count,
    }));

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}
