import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  contentMd: string;
  contentHtml: string | null;
  coverImage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    parentId: number | null;
  };
  subcategory?: {
    id: number;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  relatedArticles: RelatedArticle[];
}

interface RelatedArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  coverImage: string | null;
  createdAt: string;
  viewCount: number;
}

interface ArticleResponse {
  id: number;
  title: string;
  slug: string;
  contentHtml: string;
  contentMd: string;
  summary: string;
  coverImage: string | null;
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string | null;
    parentId: number | null;
  };
  parentCategory: {
    id: number;
    name: string;
    slug: string;
  } | null;
  tags: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  relatedArticles: RelatedArticle[];
  createdAt: string;
  updatedAt: string;
}

interface ArticlePageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const article = await getArticleData(params.slug);
  
  if (!article) {
    return {
      title: '文章未找到 - 宠物百科全书',
    };
  }

  return {
    title: `${article.title} - 宠物百科全书`,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      type: 'article',
      publishedTime: article.createdAt,
      modifiedTime: article.updatedAt,
      authors: ['宠物百科全书团队'],
      locale: 'zh_CN',
    },
  };
}

async function getArticleData(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/articles/${slug}`,
      { cache: 'no-store' }
    );

    if (!res.ok) {
      return null;
    }

    const data: ArticleResponse = await res.json();
    
    // 转换为页面需要的格式
    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      summary: data.summary,
      contentMd: data.contentMd,
      contentHtml: data.contentHtml,
      coverImage: data.coverImage,
      status: 'published',
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      category: data.category,
      subcategory: data.parentCategory || undefined,
      tags: data.tags,
      relatedArticles: data.relatedArticles || [],
    };
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

// 简单的 Markdown 渲染器
function renderMarkdown(content: string): JSX.Element[] {
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let inList = false;
  let listItems: JSX.Element[] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-disc list-inside mb-4 space-y-1">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    // 标题
    if (line.startsWith('# ')) {
      flushList();
      elements.push(
        <h1 key={index} className="text-3xl font-bold mt-8 mb-4">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={index} className="text-2xl font-bold mt-6 mb-3">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={index} className="text-xl font-bold mt-4 mb-2">
          {line.slice(4)}
        </h3>
      );
    }
    // 列表项
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      inList = true;
      listItems.push(
        <li key={index} className="ml-4">
          {line.slice(2)}
        </li>
      );
    } else if (line.match(/^\d+\. /)) {
      inList = true;
      listItems.push(
        <li key={index} className="ml-4 list-decimal">
          {line.replace(/^\d+\. /, '')}
        </li>
      );
    }
    // 空行
    else if (line.trim() === '') {
      flushList();
    }
    // 普通段落
    else {
      flushList();
      elements.push(
        <p key={index} className="mb-4 leading-relaxed">
          {line}
        </p>
      );
    }
  });

  flushList();
  return elements;
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const article = await getArticleData(params.slug);

  if (!article) {
    notFound();
  }

  return (
    <article className="container py-8 max-w-4xl">
      {/* 面包屑导航 */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center space-x-2">
          <li>
            <Link href="/" className="text-muted-foreground hover:text-foreground">
              首页
            </Link>
          </li>
          <li className="text-muted-foreground">/</li>
          <li>
            <Link 
              href={`/categories/${article.category.slug}`} 
              className="text-muted-foreground hover:text-foreground"
            >
              {article.category.name}
            </Link>
          </li>
          {article.subcategory && (
            <>
              <li className="text-muted-foreground">/</li>
              <li>
                <Link 
                  href={`/categories/${article.category.slug}/${article.subcategory.slug}`} 
                  className="text-muted-foreground hover:text-foreground"
                >
                  {article.subcategory.name}
                </Link>
              </li>
            </>
          )}
          <li className="text-muted-foreground">/</li>
          <li className="text-foreground font-medium">{article.title}</li>
        </ol>
      </nav>

      {/* 文章标题 */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold mb-4">{article.title}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
          <Link 
            href={`/categories/${article.category.slug}`}
            className="hover:text-foreground"
          >
            {article.category.name}
          </Link>
          <span>•</span>
          <time>{formatDate(article.createdAt)}</time>
          {article.updatedAt !== article.createdAt && (
            <>
              <span>•</span>
              <span>更新于 {formatDate(article.updatedAt)}</span>
            </>
          )}
        </div>
      </header>

      {/* 封面图 */}
      {article.coverImage && (
        <div className="mb-8 rounded-lg overflow-hidden">
          <img 
            src={article.coverImage} 
            alt={article.title}
            className="w-full h-auto object-cover max-h-[400px]"
            loading="lazy"
            decoding="async"
          />
        </div>
      )}

      {/* 文章内容 */}
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {renderMarkdown(article.contentMd)}
      </div>

      {/* 标签 */}
      {article.tags && article.tags.length > 0 && (
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-wrap gap-2">
            {article.tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.slug}`}
                className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm hover:bg-secondary/80 transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* 相关文章 */}
      {article.relatedArticles && article.relatedArticles.length > 0 && (
        <section className="mt-12 pt-8 border-t">
          <h2 className="text-2xl font-bold mb-6">相关文章</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {article.relatedArticles.map((related) => (
              <Link
                key={related.id}
                href={`/articles/${related.slug}`}
                className="group block border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                {related.coverImage ? (
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={related.coverImage}
                      alt={related.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-muted" />
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                    {related.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {related.summary}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
