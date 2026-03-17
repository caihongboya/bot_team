'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { Search as SearchIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchResult {
  id: number;
  title: string;
  slug: string;
  summary: string;
  highlight?: string;
  category: {
    name: string;
    slug: string;
  };
  score: number;
}

interface SearchResponse {
  query: string;
  data: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query) {
      setResults(null);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
          throw new Error('搜索失败');
        }
        const data = await response.json();
        setResults(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '搜索失败');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <div className="container py-8">
      {/* 搜索框 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">搜索结果</h1>
        <form className="flex gap-2">
          <Input
            type="search"
            name="q"
            placeholder="搜索宠物知识..."
            defaultValue={query}
            className="flex-1"
          />
          <Button type="submit">
            <SearchIcon className="h-4 w-4 mr-2" />
            搜索
          </Button>
        </form>
      </div>

      {/* 搜索结果 */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">搜索中...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12 text-destructive">
          <p>{error}</p>
        </div>
      )}

      {!query && (
        <div className="text-center py-12 text-muted-foreground">
          <p>请输入搜索关键词</p>
        </div>
      )}

      {results && results.data.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>未找到相关内容</p>
          <p className="text-sm mt-2">试试其他关键词</p>
        </div>
      )}

      {results && results.data.length > 0 && (
        <div>
          <p className="text-sm text-muted-foreground mb-6">
            找到 {results.pagination.total} 条结果
          </p>
          <div className="space-y-4">
            {results.data.map((result) => (
              <Link key={result.id} href={`/articles/${result.slug}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                        {result.category.name}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      <span dangerouslySetInnerHTML={{ __html: result.title }} />
                    </h3>
                    {result.highlight ? (
                      <p 
                        className="text-muted-foreground text-sm"
                        dangerouslySetInnerHTML={{ __html: result.highlight }}
                      />
                    ) : (
                      <p className="text-muted-foreground text-sm">
                        {result.summary}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="container py-8 text-center text-muted-foreground">
        加载中...
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
