import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { query } from '@/lib/db';

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverImage: string | null;
  createdAt: string;
  categoryName: string;
  categorySlug: string;
}

interface TagPageProps {
  params: {
    slug: string;
  };
}

async function getTagData(slug: string): Promise<{ name: string; slug: string } | null> {
  const result = await query(
    'SELECT name, slug FROM tags WHERE slug = $1',
    [slug]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return result.rows[0];
}

async function getTagArticles(slug: string): Promise<Article[]> {
  const result = await query(`
    SELECT 
      a.id,
      a.title,
      a.slug,
      a.summary,
      a.cover_image,
      a.created_at,
      c.name as category_name,
      c.slug as category_slug
    FROM articles a
    JOIN article_tags at ON a.id = at.article_id
    JOIN tags t ON at.tag_id = t.id
    JOIN categories c ON a.category_id = c.id
    WHERE t.slug = $1 AND a.status = 'published'
    ORDER BY a.created_at DESC
    LIMIT 20
  `, [slug]);
  
  return result.rows.map((row: any) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    coverImage: row.cover_image,
    createdAt: row.created_at,
    categoryName: row.category_name,
    categorySlug: row.category_slug,
  }));
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const tag = await getTagData(params.slug);
  
  if (!tag) {
    return {
      title: '标签未找到 - 宠物百科全书',
    };
  }

  return {
    title: `${tag.name} - 宠物百科全书`,
    description: `浏览关于"${tag.name}"的所有文章`,
  };
}

export default async function TagPage({ params }: TagPageProps) {
  const tag = await getTagData(params.slug);
  
  if (!tag) {
    notFound();
  }

  const articles = await getTagArticles(params.slug);

  return (
    <div className="container py-8">
      {/* 标签头部 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link href="/" className="hover:text-foreground">首页</Link>
          <span>/</span>
          <Link href="/tags" className="hover:text-foreground">标签</Link>
          <span>/</span>
          <span className="text-foreground">{tag.name}</span>
        </div>
        
        <h1 className="text-4xl font-bold mb-4">#{tag.name}</h1>
        <p className="text-muted-foreground">
          共 {articles.length} 篇文章
        </p>
      </div>

      {/* 文章列表 */}
      {articles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">该标签下暂无文章</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/articles/${article.slug}`}
              className="group block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {article.coverImage ? (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              ) : (
                <div className="aspect-video bg-muted" />
              )}
              <div className="p-4">
                <div className="text-sm text-muted-foreground mb-2">
                  <Link 
                    href={`/categories/${article.categorySlug}`}
                    className="hover:text-foreground"
                  >
                    {article.categoryName}
                  </Link>
                  <span className="mx-2">•</span>
                  <time>{formatDate(article.createdAt)}</time>
                </div>
                <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {article.summary}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
