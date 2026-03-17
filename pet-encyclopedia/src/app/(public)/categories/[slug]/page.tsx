import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const categoryNames: Record<string, string> = {
    cats: '猫咪',
    dogs: '狗狗',
    general: '通用知识',
  };

  const categoryDescriptions: Record<string, string> = {
    cats: '猫咪品种、养护、健康、训练等全方位知识',
    dogs: '狗狗品种、养护、健康、训练等全方位知识',
    general: '养宠准备、常见疾病、法律法规等通用知识',
  };

  const name = categoryNames[params.slug] || params.slug;
  const description = categoryDescriptions[params.slug] || '';

  return {
    title: `${name} - 宠物百科全书`,
    description: description,
    openGraph: {
      title: `${name} - 宠物百科全书`,
      description: description,
      type: 'website',
      locale: 'zh_CN',
    },
  };
}

interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description?: string;
}

interface Subcategory extends Category {
  count?: number;
}

interface CategoryResponse {
  data: Category[];
}

interface SubcategoriesResponse {
  data: Subcategory[];
}

// 分类描述映射
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  cats: '猫咪品种、养护、健康、训练等全方位知识',
  dogs: '狗狗品种、养护、健康、训练等全方位知识',
  general: '养宠准备、常见疾病、法律法规等通用知识',
};

async function getCategoryData(slug: string): Promise<{
  category: Category;
  subcategories: Subcategory[];
} | null> {
  try {
    // 获取一级分类列表
    const categoriesRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/categories`, {
      cache: 'no-store',
    });
    
    if (!categoriesRes.ok) {
      return null;
    }

    const categoriesData: CategoryResponse = await categoriesRes.json();
    const category = categoriesData.data.find(c => c.slug === slug);

    if (!category) {
      return null;
    }

    // 获取子分类
    const subcategoriesRes = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || '/api/v1'}/categories?parent=${slug}`,
      { cache: 'no-store' }
    );

    let subcategories: Subcategory[] = [];
    if (subcategoriesRes.ok) {
      const subData: SubcategoriesResponse = await subcategoriesRes.json();
      subcategories = subData.data;
    }

    return {
      category: {
        ...category,
        description: CATEGORY_DESCRIPTIONS[slug] || '',
      },
      subcategories,
    };
  } catch (error) {
    console.error('Error fetching category:', error);
    return null;
  }
}

interface CategoryPageProps {
  params: {
    slug: string;
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const data = await getCategoryData(params.slug);

  if (!data) {
    notFound();
  }

  const { category, subcategories } = data;

  return (
    <div className="container py-8">
      {/* 分类标题 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-5xl">{category.icon || '📁'}</span>
          <div>
            <h1 className="text-4xl font-bold">{category.name}</h1>
            <p className="text-muted-foreground mt-1">{category.description}</p>
          </div>
        </div>
      </div>

      {/* 子分类列表 */}
      {subcategories && subcategories.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">子分类</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {subcategories.map((sub) => (
              <Link
                key={sub.slug}
                href={`/categories/${params.slug}/${sub.slug}`}
              >
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{sub.icon || '📄'}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold">{sub.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          点击查看文章
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 本分类文章列表 */}
      <section>
        <h2 className="text-2xl font-bold mb-6">本分类文章</h2>
        <div className="text-center py-12 text-muted-foreground">
          <p>内容正在准备中，敬请期待...</p>
          <div className="mt-4">
            <Link href="/">
              <Button>返回首页</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
