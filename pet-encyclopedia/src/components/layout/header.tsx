'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { name: '猫咪', slug: 'cats', icon: '🐱' },
  { name: '狗狗', slug: 'dogs', icon: '🐶' },
  { name: '通用知识', slug: 'general', icon: '📚' },
];

export function Header() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 mr-8">
          <span className="text-2xl">🐾</span>
          <span className="text-xl font-bold">宠物百科全书</span>
        </Link>

        {/* 导航菜单 */}
        <nav className="flex items-center space-x-6 text-sm font-medium mr-8">
          {CATEGORIES.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              <span className="mr-1">{category.icon}</span>
              {category.name}
            </Link>
          ))}
        </nav>

        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="flex-1 flex items-center space-x-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索宠物知识..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button type="submit" variant="ghost" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
