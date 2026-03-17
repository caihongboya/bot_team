import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// 分类数据不常变化，使用 ISR 缓存 5 分钟
export const revalidate = 300;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parent = searchParams.get('parent');

    let categoryQuery;
    let categoryParams: any[] = [];

    if (parent) {
      // 获取指定父分类的子分类
      categoryQuery = `
        SELECT 
          c.id, c.name, c.slug, c.parent_id, c.icon, c.sort_order, c.created_at, c.updated_at,
          p.name as parent_name, p.slug as parent_slug
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE c.parent_id = (SELECT id FROM categories WHERE slug = $1)
        ORDER BY c.sort_order, c.name
      `;
      categoryParams = [parent];
    } else {
      // 获取所有一级分类
      categoryQuery = `
        SELECT 
          c.id, c.name, c.slug, c.parent_id, c.icon, c.sort_order, c.created_at, c.updated_at,
          p.name as parent_name, p.slug as parent_slug
        FROM categories c
        LEFT JOIN categories p ON c.parent_id = p.id
        WHERE c.parent_id IS NULL
        ORDER BY c.sort_order, c.name
      `;
    }

    const categoriesResult = await query(categoryQuery, categoryParams);

    // 格式化响应数据
    const categories = categoriesResult.rows.map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      parentId: row.parent_id,
      icon: row.icon,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      parent: row.parent_name ? {
        name: row.parent_name,
        slug: row.parent_slug,
      } : null,
    }));

    return NextResponse.json({
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
