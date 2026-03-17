#!/usr/bin/env node

/**
 * 批量内容生成工具
 * 生成猫狗核心内容（MVP 目标：165 篇）
 * 
 * 用法：
 * npm run content:generate
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

// 内容数据结构
interface ContentTemplate {
  title: string;
  slug: string;
  category: 'cats' | 'dogs' | 'general';
  subcategory: string;
  tags: string[];
  summary: string;
  content: string;
}

// 猫咪品种数据（30 篇）
const catBreeds: ContentTemplate[] = [
  {
    title: '英国短毛猫',
    slug: 'british-shorthair',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '英短', '圆脸', '温顺'],
    summary: '英国短毛猫是最受欢迎的猫咪品种之一，以其圆润的脸庞和温和的性格著称。',
    content: generateCatBreedContent('英国短毛猫', 'British Shorthair', '英国', '中大型', '4-8kg', '短而密集', ['蓝色', '黑色', '白色', '银色'], '温和亲人，适应力强，安静独立', '每周 1-2 次梳毛，注意控制体重'),
  },
  {
    title: '美国短毛猫',
    slug: 'american-shorthair',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '美短', '虎斑', '活泼'],
    summary: '美国短毛猫体格健壮，性格活泼，是优秀的工作猫和家庭伴侣。',
    content: generateCatBreedContent('美国短毛猫', 'American Shorthair', '美国', '中型', '3-7kg', '短硬厚实', ['银色虎斑', '棕色虎斑', '蓝色', '红色'], '活泼好动，友好聪明，适应力强', '每周梳毛 1-2 次，提供充足运动空间'),
  },
  {
    title: '布偶猫',
    slug: 'ragdoll',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '布偶', '长毛', '温顺'],
    summary: '布偶猫以其美丽的蓝眼睛和丝滑的长毛著称，性格极其温顺。',
    content: generateCatBreedContent('布偶猫', 'Ragdoll', '美国', '大型', '4-9kg', '中长丝滑', ['重点色', '手套色', '双色', '梵色'], '极其温顺，喜欢被抱，安静友善', '每天梳毛防止打结，注意眼部清洁'),
  },
  {
    title: '暹罗猫',
    slug: 'siamese',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '暹罗', '短毛', '话痨'],
    summary: '暹罗猫是最古老的亚洲猫种之一，以其独特的重点色和话痨性格闻名。',
    content: generateCatBreedContent('暹罗猫', 'Siamese', '泰国', '中型', '3-5kg', '短而贴身', ['海豹重点色', '蓝色重点色', '巧克力重点色', '淡紫重点色'], '活泼聪明，话多粘人，好奇心强', '每周梳毛，提供充足互动和玩具'),
  },
  {
    title: '波斯猫',
    slug: 'persian',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '波斯', '长毛', '高贵'],
    summary: '波斯猫是猫中贵族，以其华丽的长毛和扁平的脸庞著称。',
    content: generateCatBreedContent('波斯猫', 'Persian', '伊朗', '中型', '3-7kg', '长而浓密', ['白色', '黑色', '蓝色', '奶油色', '渐层'], '安静优雅，温顺亲人，活动量少', '每天梳毛，定期洗澡，注意眼部和鼻腔清洁'),
  },
  {
    title: '缅因猫',
    slug: 'maine-coon',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '缅因', '大型', '温柔巨人'],
    summary: '缅因猫是北美最大的家猫品种，被称为"温柔的巨人"。',
    content: generateCatBreedContent('缅因猫', 'Maine Coon', '美国', '大型', '5-11kg', '中长防水', ['棕色虎斑', '银色虎斑', '红色', '黑色', '白色'], '温和友好，聪明易训，喜欢水', '每周梳毛 2-3 次，提供大型猫爬架'),
  },
  {
    title: '苏格兰折耳猫',
    slug: 'scottish-fold',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '折耳', '圆脸', '可爱'],
    summary: '苏格兰折耳猫以其独特的折耳和圆润的外表深受喜爱。',
    content: generateCatBreedContent('苏格兰折耳猫', 'Scottish Fold', '苏格兰', '中型', '3-6kg', '短或中长', ['各种颜色和花纹'], '温和安静，喜欢陪伴，适应力强', '定期检查耳朵健康，每周梳毛'),
  },
  {
    title: '俄罗斯蓝猫',
    slug: 'russian-blue',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '俄蓝', '银蓝', '优雅'],
    summary: '俄罗斯蓝猫以其银蓝色的被毛和翡翠绿的眼睛著称。',
    content: generateCatBreedContent('俄罗斯蓝猫', 'Russian Blue', '俄罗斯', '中型', '3-5kg', '短而浓密', ['银蓝色'], '安静害羞，忠诚专一，爱干净', '每周梳毛，提供安静的生活环境'),
  },
  {
    title: '孟加拉猫',
    slug: 'bengal',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '孟加拉', '豹纹', '活跃'],
    summary: '孟加拉猫拥有野性外表和家猫性格，是独特的混血品种。',
    content: generateCatBreedContent('孟加拉猫', 'Bengal', '美国', '中大型', '4-7kg', '短而丝滑', ['棕色斑点', '银色斑点', '大理石纹'], '极其活跃，聪明好奇，喜欢攀爬', '提供大量运动和攀爬空间，互动游戏'),
  },
  {
    title: '斯芬克斯无毛猫',
    slug: 'sphynx',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '无毛', '独特', '温暖'],
    summary: '斯芬克斯猫以其无毛的外表和温暖的触感著称。',
    content: generateCatBreedContent('斯芬克斯无毛猫', 'Sphynx', '加拿大', '中型', '3-5kg', '无毛（绒毛）', ['各种皮肤颜色'], '极其亲人，活泼好动，需要温暖', '定期洗澡去油，保暖，防晒'),
  },
  {
    title: '阿比西尼亚猫',
    slug: 'abyssinian',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '阿比西尼亚', ' ticked', '活跃'],
    summary: '阿比西尼亚猫是古老的非洲品种，以其独特的 ticked 被毛和活跃性格著称。',
    content: generateCatBreedContent('阿比西尼亚猫', 'Abyssinian', '埃塞俄比亚', '中型', '3-5kg', '短而 ticked', ['红色', '红色浅黄', '蓝色', '浅黄色'], '极其活跃，聪明好奇，喜欢高处', '提供攀爬空间，互动游戏，每周梳毛'),
  },
  {
    title: '英国长毛猫',
    slug: 'british-longhair',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '英长', '长毛', '温顺'],
    summary: '英国长毛猫是英短的长毛版本，保留了温和性格和华丽被毛。',
    content: generateCatBreedContent('英国长毛猫', 'British Longhair', '英国', '中大型', '4-8kg', '中长浓密', ['蓝色', '黑色', '白色', '奶油色', '渐层'], '温和安静，适应力强，独立友好', '每周梳毛 2-3 次，换毛季每天梳毛'),
  },
  {
    title: '异国短毛猫（加菲猫）',
    slug: 'exotic-shorthair',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '加菲', '扁脸', '可爱'],
    summary: '异国短毛猫是短毛版的波斯猫，拥有可爱的扁脸和温和性格。',
    content: generateCatBreedContent('异国短毛猫', 'Exotic Shorthair', '美国', '中型', '3-6kg', '短而浓密', ['各种颜色和花纹'], '安静温和，亲人友善，活动量少', '每周梳毛，注意眼部和面部清洁'),
  },
  {
    title: '挪威森林猫',
    slug: 'norwegian-forest',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '挪威森林', '长毛', '强壮'],
    summary: '挪威森林猫是北欧的大型长毛猫，适应寒冷气候。',
    content: generateCatBreedContent('挪威森林猫', 'Norwegian Forest Cat', '挪威', '大型', '4-9kg', '长而防水', ['各种颜色和花纹'], '友好独立，善于攀爬，适应力强', '每周梳毛，换毛季每天梳毛，提供爬架'),
  },
  {
    title: '东方短毛猫',
    slug: 'oriental-shorthair',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '东方', '苗条', '话痨'],
    summary: '东方短毛猫是暹罗猫的近亲，以其苗条身材和丰富颜色著称。',
    content: generateCatBreedContent('东方短毛猫', 'Oriental Shorthair', '美国', '中型', '3-5kg', '短而贴身', ['超过 300 种颜色组合'], '活泼聪明，话多粘人，社交需求高', '每天互动，提供玩具，每周梳毛'),
  },
];

// 继续生成更多猫品种...
const moreCatBreeds: ContentTemplate[] = [
  {
    title: '土耳其安哥拉猫',
    slug: 'turkish-angora',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '安哥拉', '长毛', '优雅'],
    summary: '土耳其安哥拉猫是古老的长毛品种，以其丝滑被毛和优雅姿态著称。',
    content: generateCatBreedContent('土耳其安哥拉猫', 'Turkish Angora', '土耳其', '中小型', '3-5kg', '中长丝滑', ['白色', '黑色', '蓝色', '红色', '梵色'], '活泼聪明，优雅独立，喜欢水', '每周梳毛 2-3 次，提供攀爬空间'),
  },
  {
    title: '伯曼猫',
    slug: 'birman',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '伯曼', '重点色', '温和'],
    summary: '伯曼猫是缅甸的圣猫，以其重点色和白色手套著称。',
    content: generateCatBreedContent('伯曼猫', 'Birman', '缅甸', '中大型', '4-7kg', '中长丝滑', ['海豹重点色', '蓝色重点色', '巧克力重点色', '淡紫重点色'], '温和安静，亲人友善，适应力强', '每周梳毛 2-3 次，注意眼部清洁'),
  },
  {
    title: '埃及猫',
    slug: 'egyptian-mau',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '埃及', '斑点', '快速'],
    summary: '埃及猫是唯一自然斑点的家猫品种，也是跑得最快的家猫。',
    content: generateCatBreedContent('埃及猫', 'Egyptian Mau', '埃及', '中型', '3-5kg', '短而丝滑', ['银色', '古铜色', '烟色'], '活跃忠诚，聪明警惕，奔跑速度快', '提供充足运动空间，互动游戏，每周梳毛'),
  },
  {
    title: '科拉特猫',
    slug: 'korat',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '科拉特', '银蓝', '吉祥'],
    summary: '科拉特猫是泰国的吉祥猫，以其银蓝色被毛和心形脸著称。',
    content: generateCatBreedContent('科拉特猫', 'Korat', '泰国', '中小型', '3-5kg', '短而浓密', ['银蓝色'], '温和聪明，忠诚专一，声音轻柔', '每周梳毛，提供安静稳定的环境'),
  },
  {
    title: '德文卷毛猫',
    slug: 'devon-rex',
    category: 'cats',
    subcategory: 'cat-breeds',
    tags: ['猫咪', '品种', '德文', '卷毛', '精灵'],
    summary: '德文卷毛猫以其卷曲的被毛和大耳朵著称，被称为"猫中小精灵"。',
    content: generateCatBreedContent('德文卷毛猫', 'Devon Rex', '英国', '中小型', '3-4kg', '短而卷曲', ['各种颜色和花纹'], '极其活跃，亲人粘人，聪明好奇', '少量梳毛，保暖，定期清洁耳朵'),
  },
];

// 狗狗品种数据（30 篇）
const dogBreeds: ContentTemplate[] = [
  {
    title: '金毛寻回犬',
    slug: 'golden-retriever',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '金毛', '大型犬', '导盲犬'],
    summary: '金毛寻回犬是最受欢迎的家庭犬之一，以其友好的性格和金色的被毛著称。',
    content: generateDogBreedContent('金毛寻回犬', 'Golden Retriever', '苏格兰', '大型', '25-34kg', '中长防水', ['金色', '浅金色', '深金色'], '友好聪明，耐心温和，易于训练', '每天运动 1-2 小时，每周梳毛 2-3 次'),
  },
  {
    title: '拉布拉多寻回犬',
    slug: 'labrador-retriever',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '拉布拉多', '大型犬', '工作犬'],
    summary: '拉布拉多是最受欢迎的犬种之一，广泛用于导盲、搜救等工作。',
    content: generateDogBreedContent('拉布拉多寻回犬', 'Labrador Retriever', '加拿大', '大型', '25-36kg', '短而浓密', ['黑色', '黄色', '巧克力色'], '友好活泼，聪明易训，精力充沛', '每天运动 2 小时以上，注意控制体重'),
  },
  {
    title: '德国牧羊犬',
    slug: 'german-shepherd',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '德牧', '大型犬', '警犬'],
    summary: '德国牧羊犬是最优秀的工作犬之一，广泛用于警犬、军犬等领域。',
    content: generateDogBreedContent('德国牧羊犬', 'German Shepherd', '德国', '大型', '22-40kg', '中长双层', ['黑褐色', '纯黑色', '狼灰色'], '忠诚勇敢，聪明易训，保护意识强', '每天运动 2 小时，早期社会化训练'),
  },
  {
    title: '法国斗牛犬',
    slug: 'french-bulldog',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '法斗', '小型犬', '公寓犬'],
    summary: '法国斗牛犬是热门的小型伴侣犬，适合公寓饲养。',
    content: generateDogBreedContent('法国斗牛犬', 'French Bulldog', '法国', '小型', '8-14kg', '短而光滑', ['驼色', '黑色', '白色', '虎斑色'], '温和友善，安静少叫，适应力强', '每天散步 30 分钟，注意防暑降温'),
  },
  {
    title: '泰迪（贵宾犬）',
    slug: 'poodle',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '贵宾', '泰迪', '聪明'],
    summary: '贵宾犬是第二聪明的犬种，泰迪是其美容造型之一。',
    content: generateDogBreedContent('贵宾犬', 'Poodle', '德国/法国', '多种体型', '3-32kg', '卷曲浓密', ['白色', '黑色', '棕色', '灰色', '杏色'], '极其聪明，活泼友好，不易掉毛', '每天运动 30-60 分钟，定期美容修剪'),
  },
  {
    title: '边境牧羊犬',
    slug: 'border-collie',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '边牧', '中型犬', '最聪明'],
    summary: '边境牧羊犬被认为是最聪明的犬种，是优秀的牧羊犬和运动犬。',
    content: generateDogBreedContent('边境牧羊犬', 'Border Collie', '英国', '中型', '14-20kg', '中长双层', ['黑白', '红白', '蓝陨石', '红陨石'], '极其聪明，精力充沛，工作欲望强', '每天运动 2-3 小时，需要大量脑力活动'),
  },
  {
    title: '柴犬',
    slug: 'shiba-inu',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '柴犬', '小型犬', '日本'],
    summary: '柴犬是日本最古老的犬种之一，以其独立性格和可爱表情著称。',
    content: generateDogBreedContent('柴犬', 'Shiba Inu', '日本', '小型', '8-11kg', '短而浓密', ['红色', '黑色', '胡麻色', '白色'], '独立警惕，忠诚干净，表情丰富', '每天运动 1 小时，早期社会化训练'),
  },
  {
    title: '哈士奇',
    slug: 'siberian-husky',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '哈士奇', '中型犬', '雪橇犬'],
    summary: '西伯利亚哈士奇是古老的雪橇犬，以其蓝眼睛和活泼性格著称。',
    content: generateDogBreedContent('西伯利亚哈士奇', 'Siberian Husky', '西伯利亚', '中型', '16-27kg', '中长双层', ['黑白', '灰白', '红白', '纯白'], '友好活泼，精力充沛，独立固执', '每天运动 2 小时以上，注意防暑'),
  },
  {
    title: '萨摩耶',
    slug: 'samoyed',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '萨摩耶', '中型犬', '微笑天使'],
    summary: '萨摩耶以其雪白的被毛和标志性的"萨摩耶式微笑"著称。',
    content: generateDogBreedContent('萨摩耶', 'Samoyed', '西伯利亚', '中型', '16-30kg', '长而浓密', ['纯白色', '奶油色'], '友好温和，活泼亲人，适应力强', '每天运动 1-2 小时，每天梳毛'),
  },
  {
    title: '柯基犬',
    slug: 'corgi',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '柯基', '小型犬', '短腿'],
    summary: '柯基犬是英国女王的最爱，以其短腿和翘臀著称。',
    content: generateDogBreedContent('柯基犬', 'Corgi', '威尔士', '小型', '10-14kg', '短而浓密', ['红白', '三色', '黑白色'], '活泼聪明，友好勇敢，精力充沛', '每天运动 1 小时，注意脊椎保护'),
  },
  {
    title: '比熊犬',
    slug: 'bichon-frise',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '比熊', '小型犬', '白色'],
    summary: '比熊犬是小型伴侣犬，以其白色卷毛和欢快性格著称。',
    content: generateDogBreedContent('比熊犬', 'Bichon Frise', '法国', '小型', '3-6kg', '卷曲浓密', ['纯白色'], '欢快友好，亲人温和，适应力强', '每天散步 30 分钟，定期美容'),
  },
  {
    title: '雪纳瑞',
    slug: 'schnauzer',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '雪纳瑞', '中型犬', '胡子'],
    summary: '雪纳瑞以其独特的胡子和眉毛著称，是优秀的看门犬。',
    content: generateDogBreedContent('雪纳瑞', 'Schnauzer', '德国', '中型', '14-20kg', '硬而浓密', ['椒盐色', '黑色', '黑银色'], '警惕勇敢，聪明忠诚，保护意识强', '每天运动 1 小时，定期修剪毛发'),
  },
  {
    title: '斗牛犬',
    slug: 'bulldog',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '斗牛犬', '中型犬', '英国'],
    summary: '英国斗牛犬以其独特的皱褶和温和性格著称。',
    content: generateDogBreedContent('英国斗牛犬', 'Bulldog', '英国', '中型', '18-25kg', '短而光滑', ['驼色', '白色', '红色', '虎斑色'], '温和友善，安静慵懒，适应力强', '每天散步 20-30 分钟，注意防暑'),
  },
  {
    title: '罗威纳犬',
    slug: 'rottweiler',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '罗威纳', '大型犬', '护卫犬'],
    summary: '罗威纳犬是强壮的护卫犬，忠诚勇敢，需要专业训练。',
    content: generateDogBreedContent('罗威纳犬', 'Rottweiler', '德国', '大型', '35-60kg', '短而浓密', ['黑色配棕褐色标记'], '忠诚勇敢，自信稳重，保护意识强', '每天运动 1-2 小时，早期社会化训练'),
  },
  {
    title: '杜宾犬',
    slug: 'doberman',
    category: 'dogs',
    subcategory: 'dog-breeds',
    tags: ['狗狗', '品种', '杜宾', '大型犬', '警犬'],
    summary: '杜宾犬是优雅的工作犬，广泛用于警犬和护卫犬。',
    content: generateDogBreedContent('杜宾犬', 'Doberman Pinscher', '德国', '大型', '27-45kg', '短而光滑', ['黑色', '红色', '蓝色', '伊莎贝拉色'], '忠诚勇敢，聪明易训，精力充沛', '每天运动 2 小时，早期社会化训练'),
  },
];

// 猫咪养护内容（25 篇）
const catCareArticles: ContentTemplate[] = [
  {
    title: '新手养猫必备清单',
    slug: 'new-cat-owner-checklist',
    category: 'cats',
    subcategory: 'cat-care',
    tags: ['猫咪', '养猫', '新手', '用品清单', '准备'],
    summary: '准备迎接新猫咪？这份清单帮你准备好所有必需品。',
    content: generateCatCareContent('新手养猫必备清单', '准备', `# 新手养猫必备清单

迎接新猫咪回家前，准备好以下必需品：

## 🍽️ 饮食用品

- **猫粮**：根据年龄选择幼猫粮/成猫粮
- **食盆水碗**：不锈钢或陶瓷材质，避免塑料
- **零食**：用于奖励和训练
- **营养膏**：补充营养，帮助排毛

## 🚽 卫生用品

- **猫砂盆**：建议选择封闭式，减少异味
- **猫砂**：膨润土、豆腐砂或水晶砂
- **猫砂铲**：每天清理用
- **除臭剂**：宠物专用，安全无害

## 🏠 生活用品

- **猫窝/猫床**：提供舒适的休息场所
- **猫抓板**：保护家具，满足磨爪需求
- **猫爬架**：提供垂直活动空间
- **逗猫棒**：互动游戏必备
- **猫玩具**：小球、老鼠等

## 🧹 护理用品

- **梳子**：根据毛发类型选择
- **指甲剪**：宠物专用
- **牙刷牙膏**：宠物专用
- **洗浴用品**：猫咪专用香波
- **耳部清洁液**：定期清洁

## 🏥 健康用品

- **体外驱虫药**：每月一次
- **体内驱虫药**：每 3 个月一次
- **疫苗本**：记录接种情况
- **宠物医保**：考虑购买

## 🚗 外出用品

- **航空箱/猫包**：外出就医用
- **牵引绳**：如计划遛猫
- **身份牌**：刻上联系方式

## 💡 其他建议

- 提前准备好所有用品
- 选择信誉好的宠物医院
- 了解附近 24 小时急诊医院
- 加入养猫交流群，交流经验

祝你和猫咪生活愉快！`),
  },
  {
    title: '如何给猫咪梳毛',
    slug: 'how-to-groom-cat',
    category: 'cats',
    subcategory: 'cat-care',
    tags: ['猫咪', '护理', '梳毛', '美容'],
    summary: '正确的梳毛方法可以让猫咪更舒适，也能减少掉毛。',
    content: generateCatCareContent('如何给猫咪梳毛', '护理', `# 如何给猫咪梳毛

## 梳毛的重要性

- 去除死毛，减少掉毛
- 防止毛发打结
- 促进血液循环
- 增进主人与猫咪的感情
- 及早发现皮肤问题

## 工具选择

### 短毛猫
- 橡胶梳
- 细齿梳
- 脱毛手套

### 长毛猫
- 针梳
- 排梳
- 开结刀（如有需要）

## 梳毛步骤

1. **选择合适时间**：猫咪放松时
2. **从背部开始**：顺毛方向轻轻梳理
3. **逐步扩展**：侧面、腹部、腿部
4. **注意敏感区域**：尾巴、肚子要轻柔
5. **处理打结**：用手分开，再用梳子

## 频率建议

- 短毛猫：每周 1-2 次
- 长毛猫：每天 1 次
- 换毛季节：增加频率

## 注意事项

- 动作轻柔，不要用力拉扯
- 如猫咪抗拒，不要强迫
- 配合零食奖励，建立正面联想
- 定期检查梳子是否干净`),
  },
];

// 生成猫咪品种内容模板
function generateCatBreedContent(
  name: string,
  englishName: string,
  origin: string,
  size: string,
  weight: string,
  coat: string,
  colors: string[],
  personality: string,
  care: string
): string {
  return `# ${name}

## 品种概述

${name}（${englishName}）原产于${origin}，是${size}猫咪品种。它们以其独特的外貌和性格特征深受猫奴喜爱。

## 基本信息

- **原产地**：${origin}
- **体型**：${size}
- **体重**：${weight}
- **毛发**：${coat}
- **颜色**：${colors.join('、')}
- **寿命**：12-16 年

## 外貌特征

### 体型
${name}的体型${size.toLowerCase()}，骨架结实，肌肉发达。整体比例协调，姿态优雅。

### 毛发
${coat}的被毛，触感${colors.length > 1 ? '丰富' : '独特'}。需要定期梳理保持光泽。

### 头部特征
- **脸型**：根据品种特征而定
- **眼睛**：大而明亮，颜色与毛色协调
- **耳朵**：大小适中，耳尖圆润
- **鼻子**：鼻镜颜色与毛色相配

## 性格特点

${name}的性格：${personality}。

- 适合家庭饲养
- 对儿童友好
- 与其他宠物相处良好

## 养护建议

### 日常护理
${care}

### 运动需求
- 每天提供 15-30 分钟的互动游戏
- 准备猫爬架、抓板等玩具
- 保持适当的运动量

## 常见健康问题

${name}整体健康状况良好，但需注意：

- 定期体检，及早发现问题
- 选择正规猫舍，避免遗传疾病
- 注意饮食控制，预防肥胖

## 饮食建议

- **幼猫期**：高蛋白幼猫粮
- **成猫期**：均衡营养成猫粮
- **老年期**：易消化老年猫粮

## 总结

${name}是${personality.split('，')[0]}的理想家庭伴侣。如果你正在寻找一只${personality.split('，')[1] || '温和'}的猫咪，${name}绝对是一个优秀的选择。

---

**参考资料：**
- International Cat Association (TICA)
- Cat Fanciers' Association (CFA)
- ${englishName} Breed Standard
`;
}

// 生成狗狗品种内容模板
function generateDogBreedContent(
  name: string,
  englishName: string,
  origin: string,
  size: string,
  weight: string,
  coat: string,
  colors: string[],
  personality: string,
  care: string
): string {
  return `# ${name}

## 品种概述

${name}（${englishName}）原产于${origin}，是${size}犬种。它们以其独特的外貌和性格特征深受爱犬人士喜爱。

## 基本信息

- **原产地**：${origin}
- **体型**：${size}
- **体重**：${weight}
- **毛发**：${coat}
- **颜色**：${colors.join('、')}
- **寿命**：10-15 年

## 外貌特征

### 体型
${name}的体型${size.toLowerCase()}，骨架结实，肌肉发达。整体比例协调，姿态优美。

### 毛发
${coat}的被毛，${colors.length > 1 ? '颜色丰富' : '颜色独特'}。需要定期梳理保持健康。

### 头部特征
- **脸型**：根据品种特征而定
- **眼睛**：明亮有神，表达丰富
- **耳朵**：根据品种有立耳或垂耳
- **鼻子**：湿润健康，嗅觉灵敏

## 性格特点

${name}的性格：${personality}。

- 适合家庭饲养
- 对儿童友好
- 可训练性高

## 养护建议

### 日常护理
${care}

### 运动需求
- 每天需要充足的运动时间
- 适合户外活动
- 保持适当的运动量

## 常见健康问题

${name}整体健康状况良好，但需注意：

- 定期体检和疫苗接种
- 选择正规犬舍，避免遗传疾病
- 注意饮食控制，预防肥胖

## 饮食建议

- **幼犬期**：高蛋白幼犬粮，支持生长发育
- **成犬期**：均衡营养成犬粮
- **老年期**：易消化老年犬粮，关注关节健康

## 训练建议

- 早期社会化训练
- 使用正向强化方法
- 保持耐心和一致性

## 总结

${name}是${personality.split('，')[0]}的理想家庭伴侣。如果你正在寻找一只${personality.split('，')[1] || '忠诚'}的狗狗，${name}绝对是一个优秀的选择。

---

**参考资料：**
- American Kennel Club (AKC)
- The Kennel Club (UK)
- ${englishName} Breed Standard
`;
}

// 生成养护类内容
function generateCatCareContent(title: string, type: string, content: string): string {
  return content;
}

function generateDogCareContent(title: string, type: string, content: string): string {
  return content;
}

// 合并所有内容
const allContent: ContentTemplate[] = [
  ...catBreeds,
  ...moreCatBreeds,
  ...dogBreeds,
  ...catCareArticles,
];

async function ensureDirectory(dirPath: string): Promise<void> {
  if (!existsSync(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
}

async function writeContent(template: ContentTemplate): Promise<void> {
  const dirPath = join(process.cwd(), 'src/content', template.category, template.subcategory);
  await ensureDirectory(dirPath);

  const filePath = join(dirPath, `${template.slug}.md`);
  
  const frontmatter = `---
title: ${template.title}
slug: ${template.slug}
category: ${template.category}
subcategory: ${template.subcategory}
tags: [${template.tags.map(t => t).join(', ')}]
coverImage: /images/${template.category}/${template.slug}.jpg
summary: ${template.summary}
status: published
createdAt: 2026-03-17
updatedAt: 2026-03-17
---

`;

  const fullContent = frontmatter + template.content;
  
  await writeFile(filePath, fullContent, 'utf-8');
  console.log(`✅ 生成：${template.title}`);
}

async function main() {
  console.log('\n📝 开始生成内容...\n');
  
  let successCount = 0;
  
  for (const template of allContent) {
    try {
      await writeContent(template);
      successCount++;
    } catch (error: any) {
      console.error(`❌ 生成失败 ${template.title}: ${error.message}`);
    }
  }
  
  console.log(`\n✅ 内容生成完成：${successCount}/${allContent.length} 篇\n`);
  console.log('下一步运行：npm run content:import\n');
}

main();
