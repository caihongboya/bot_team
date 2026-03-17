import Link from 'next/link';
import { query } from '@/lib/db';

interface Tag {
  id: number;
  name: string;
  slug: string;
  articleCount: number;
}

export const metadata = {
  title: '所有标签 - 宠物百科全书',
  description: '浏览所有标签，快速找到感兴趣的内容',
};

async function getTags(): Promise<Tag[]> {
  const result = await query(`
    SELECT 
      t.id,
      t.name,
      t.slug,
      COUNT(at.article_id) as article_count
    FROM tags t
    LEFT JOIN article_tags at ON t.id = at.tag_id
    LEFT JOIN articles a ON at.article_id = a.id AND a.status = 'published'
    GROUP BY t.id, t.name, t.slug
    ORDER BY article_count DESC
  `);
  
  return result.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    articleCount: parseInt(row.article_count),
  }));
}

export default async function TagsPage() {
  const tags = await getTags();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">所有标签</h1>
        <p className="text-muted-foreground">
          浏览所有标签，快速找到感兴趣的内容
        </p>
      </div>

      {tags.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">暂无标签</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tags.map((tag) => (
            <Link
              key={tag.id}
              href={`/tags/${tag.slug}`}
              className="p-6 border rounded-lg hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                    #{tag.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {tag.articleCount} 篇文章
                  </p>
                </div>
                <svg
                  className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
