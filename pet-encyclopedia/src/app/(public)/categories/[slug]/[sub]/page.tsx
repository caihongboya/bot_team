import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface Article {
  id: number;
  title: string;
  slug: string;
  summary: string;
  createdAt: string;
}

interface ArticlesResponse {
  data: Article[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface CategoryResponse {
  data: Category[];
}

async function getSubCategoryData(slug: string, sub: string): Promise<{
  parentCategory: Category;
  subCategory: Category;
  articles: Article[];
} | null> {
  try {
    // 获取父分类信息
    const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/categories`, {
      cache: 'no-store',
    });

    if (!categoriesRes.ok) {
      return null;
    }

    const categoriesData: CategoryResponse = await categoriesRes.json();
    const parentCategory = categoriesData.data.find(c => c.slug === slug);

    if (!parentCategory) {
      return null;
    }

    // 获取子分类信息
    const subcategoriesRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/categories?parent=${slug}`,
      { cache: 'no-store' }
    );

    let subCategory: Category | undefined;
    if (subcategoriesRes.ok) {
      const subData: CategoryResponse = await subcategoriesRes.json();
      subCategory = subData.data.find(c => c.slug === sub);
    }

    if (!subCategory) {
      return null;
    }

    // 获取文章列表
    const articlesRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/articles?category=${sub}&limit=20`,
      { cache: 'no-store' }
    );

    let articles: Article[] = [];
    if (articlesRes.ok) {
      const articlesData: ArticlesResponse = await articlesRes.json();
      articles = articlesData.data;
    }

    return {
      parentCategory,
      subCategory,
      articles,
    };
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    return null;
  }
}

interface SubCategoryPageProps {
  params: {
    slug: string;
    sub: string;
  };
}

export default async function SubCategoryPage({ params }: SubCategoryPageProps) {
  const data = await getSubCategoryData(params.slug, params.sub);

  if (!data) {
    notFound();
  }

  const { parentCategory, subCategory, articles } = data;

  return (
    <div className="container py-8">
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
              href={`/categories/${parentCategory.slug}`} 
              className="text-muted-foreground hover:text-foreground"
            >
              {parentCategory.name}
            </Link>
          </li>
          <li className="text-muted-foreground">/</li>
          <li className="text-foreground font-medium">{subCategory.name}</li>
        </ol>
      </nav>

      {/* 子分类标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{subCategory.name}</h1>
        <p className="text-muted-foreground">查看 {subCategory.name} 相关文章</p>
      </div>

      {/* 文章列表 */}
      <section>
        {articles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.slug} href={`/articles/${article.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
                      {article.summary}
                    </p>
                    <div className="text-xs text-muted-foreground">
                      {new Date(article.createdAt).toLocaleDateString('zh-CN')}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>暂无文章，敬请期待...</p>
          </div>
        )}
      </section>
    </div>
  );
}
