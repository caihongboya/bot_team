import type { Metadata } from 'next';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export const metadata: Metadata = {
  title: '宠物百科全书 - 专业宠物养护知识平台',
  description: '为养宠人提供一站式知识服务，涵盖猫狗品种、养护、健康、行为训练等全方位内容。专业、权威、实用的宠物百科大全。',
  keywords: ['宠物百科', '猫咪养护', '狗狗养护', '宠物健康', '宠物训练', '养宠指南'],
  authors: [{ name: '宠物百科全书团队' }],
  openGraph: {
    title: '宠物百科全书 - 专业宠物养护知识平台',
    description: '为养宠人提供一站式知识服务，涵盖猫狗品种、养护、健康、行为训练等全方位内容。',
    type: 'website',
    locale: 'zh_CN',
  },
};

const CATEGORIES = [
  {
    name: '猫咪',
    slug: 'cats',
    icon: '🐱',
    description: '猫咪品种、养护、健康、训练等全方位知识',
    color: 'bg-orange-100 dark:bg-orange-900/20',
  },
  {
    name: '狗狗',
    slug: 'dogs',
    icon: '🐶',
    description: '狗狗品种、养护、健康、训练等全方位知识',
    color: 'bg-blue-100 dark:bg-blue-900/20',
  },
  {
    name: '通用知识',
    slug: 'general',
    icon: '📚',
    description: '养宠准备、常见疾病、法律法规等通用知识',
    color: 'bg-green-100 dark:bg-green-900/20',
  },
];

const RECENT_ARTICLES = [
  {
    title: '英国短毛猫完全指南',
    slug: 'british-shorthair',
    category: '猫咪',
    summary: '英国短毛猫性格温顺，适应能力强，是理想的家庭宠物。本文详细介绍英短的品种特征、养护要点和常见健康问题。',
  },
  {
    title: '金毛寻回犬养护手册',
    slug: 'golden-retriever',
    category: '狗狗',
    summary: '金毛寻回犬友善、聪明、耐心，是最受欢迎的家庭犬之一。了解金毛的日常护理、训练方法和健康注意事项。',
  },
  {
    title: '新手养宠必备清单',
    slug: 'new-pet-checklist',
    category: '通用',
    summary: '第一次养宠物？这份清单涵盖了从用品选购到心理准备的所有要点，帮助你顺利迎接新成员。',
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero 区域 */}
      <section className="section bg-gradient-to-b from-primary/5 to-background">
        <div className="container text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
            宠物百科全书
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            为养宠人提供一站式知识服务，涵盖猫狗、异宠的养护、健康、行为训练等全方位内容
          </p>
          
          {/* 搜索框 */}
          <div className="max-w-xl mx-auto">
            <form action="/search" method="GET" className="flex gap-2">
              <Input
                type="search"
                name="q"
                placeholder="搜索宠物知识，例如：猫咪疫苗、狗狗训练..."
                className="flex-1"
              />
              <Button type="submit">
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* 分类展示 */}
      <section className="section">
        <div className="container">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-8">
            探索分类
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {CATEGORIES.map((category) => (
              <Link key={category.slug} href={`/categories/${category.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className={`w-16 h-16 rounded-full ${category.color} flex items-center justify-center mb-4`}>
                      <span className="text-3xl">{category.icon}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{category.name}</h3>
                    <p className="text-muted-foreground">{category.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 最新文章 */}
      <section className="section bg-muted/40">
        <div className="container">
          <h2 className="text-3xl font-bold tracking-tight mb-8">
            最新文章
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RECENT_ARTICLES.map((article) => (
              <Link 
                key={article.slug} 
                href={`/articles/${article.slug}`}
                className="block"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="text-sm text-primary mb-2">{article.category}</div>
                    <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-3">
                      {article.summary}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link href="/tags">
              <Button variant="outline">浏览所有标签</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 特色内容 */}
      <section className="section">
        <div className="container">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-8">
            为什么选择我们？
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">📖</div>
              <h3 className="text-xl font-semibold mb-2">专业内容</h3>
              <p className="text-muted-foreground">
                由兽医、宠物行为专家审核的权威内容
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">快速搜索</h3>
              <p className="text-muted-foreground">
                智能搜索，快速找到你需要的宠物知识
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">随时随地</h3>
              <p className="text-muted-foreground">
                响应式设计，手机电脑都能完美浏览
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
