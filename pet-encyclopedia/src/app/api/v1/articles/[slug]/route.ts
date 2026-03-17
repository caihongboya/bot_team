import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 强制动态渲染，因为需要读取路由参数
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    // 获取文章详情
    const articleQuery = `
      SELECT 
        a.id, a.title, a.slug, a.summary, a.content_md, a.content_html,
        a.cover_image, a.status, a.view_count, a.created_at, a.updated_at,
        a.category_id, a.subcategory_id,
        c.id as category_id, c.name as category_name, c.slug as category_slug,
        c.icon as category_icon, c.parent_id,
        p.id as parent_category_id, p.name as parent_category_name, p.slug as parent_category_slug
      FROM articles a
      JOIN categories c ON a.category_id = c.id
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE a.slug = $1
    `;

    const articleResult = await query(articleQuery, [slug]);

    if (articleResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const article = articleResult.rows[0];

    // 获取文章标签
    const tagsQuery = `
      SELECT t.id, t.name, t.slug
      FROM tags t
      JOIN article_tags at ON t.id = at.tag_id
      WHERE at.article_id = $1
    `;

    const tagsResult = await query(tagsQuery, [article.id]);

    // 获取相关文章
    const relatedQuery = `
      SELECT * FROM get_related_articles($1, $2, 5)
    `;

    const relatedResult = await query(relatedQuery, [article.id, article.category_id]);

    // 增加浏览量
    await query(
      'UPDATE articles SET view_count = view_count + 1 WHERE id = $1',
      [article.id]
    );

    // 格式化响应数据
    const response = {
      id: article.id,
      title: article.title,
      slug: article.slug,
      contentHtml: article.content_html || article.content_md,
      contentMd: article.content_md,
      summary: article.summary,
      coverImage: article.cover_image,
      category: {
        id: article.category_id,
        name: article.category_name,
        slug: article.category_slug,
        icon: article.category_icon,
        parentId: article.parent_id,
      },
      parentCategory: article.parent_category_id ? {
        id: article.parent_category_id,
        name: article.parent_category_name,
        slug: article.parent_category_slug,
      } : null,
      tags: tagsResult.rows.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      })),
      relatedArticles: relatedResult.rows.map((rel: any) => ({
        id: rel.id,
        title: rel.title,
        slug: rel.slug,
        summary: rel.summary,
        coverImage: rel.cover_image,
        createdAt: rel.created_at,
        viewCount: rel.view_count,
      })),
      createdAt: article.created_at,
      updatedAt: article.updated_at,
      viewCount: article.view_count + 1,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}
