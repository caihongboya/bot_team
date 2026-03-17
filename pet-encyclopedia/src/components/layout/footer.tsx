import Link from 'next/link';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* 品牌信息 */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🐾</span>
              <span className="text-lg font-bold">宠物百科全书</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              为养宠人提供一站式知识服务，涵盖猫狗、异宠的养护、健康、行为训练等全方位内容。
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <h3 className="font-semibold mb-3">快速链接</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/categories/cats" className="text-muted-foreground hover:text-foreground">
                  猫咪百科
                </Link>
              </li>
              <li>
                <Link href="/categories/dogs" className="text-muted-foreground hover:text-foreground">
                  狗狗百科
                </Link>
              </li>
              <li>
                <Link href="/categories/general" className="text-muted-foreground hover:text-foreground">
                  通用知识
                </Link>
              </li>
            </ul>
          </div>

          {/* 关于 */}
          <div>
            <h3 className="font-semibold mb-3">关于</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  关于我们
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  联系我们
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  隐私政策
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* 版权信息 */}
        <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {currentYear} 宠物百科全书。All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
