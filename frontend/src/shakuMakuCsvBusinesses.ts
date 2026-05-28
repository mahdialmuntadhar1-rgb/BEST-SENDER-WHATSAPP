// @ts-nocheck
/* eslint-disable */

export interface CSVBiz {
  name: {
    ar: string;
    ku: string;
    en: string;
  };
  category: 'restaurant' | 'cafe_bakery' | 'pharmacy' | 'gym' | 'university' | 'hotel' | 'real_estate' | 'salon' | 'mobile_shop';
  bio: {
    ar: string;
    ku: string;
    en: string;
  };
  phone?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
}

export const CSV_BASE_BUSINESSES: CSVBiz[] = [
  {
    name: {
      ar: 'بوابة بغداد للحلول البرمجية',
      ku: 'دەروازەی تەکنەلۆژیا - بەغدا تێک هێب',
      en: 'Baghdad Tech Hub'
    },
    category: 'mobile_shop',
    bio: {
      ar: 'مزود حلول برمجية متكاملة تقدم تطوير مواقع الويب والشبكات والدعم الفني للشركات بمختلف أحجامها.',
      ku: 'پێشکەشکردنی باشترین خزمەتگوزاری تەکنەلۆجیا و پرۆگرامسازی بۆ کۆمپانیاکان.',
      en: 'Full-service IT solutions provider offering web development, networking, and software support for firms.'
    },
    phone: '+9647994291785',
    facebook: 'fb.com/baghdadtechhub'
  },
  {
    name: {
      ar: 'فندق دجلة الكبير',
      ku: 'ھۆتێلی دجلەی گەورە',
      en: 'Grand Tigris Hotel'
    },
    category: 'hotel',
    bio: {
      ar: 'فندق فاخر يطل على ضفاف نهر دجلة الساحر، يوفر أجنحة ملكية راقية وقاعات للمؤتمرات وأفخر المطابخ.',
      ku: 'ھۆتێلێکی لوکس کە سویتی شاهانە و خزمەتگوزاری ئاستی جیھانی پێشکەش دەکات.',
      en: 'Luxury riverside hotel offering premium suites, state-of-the-art conference halls, and magnificent dining.'
    },
    phone: '+9647858448502'
  },
  {
    name: {
      ar: 'صيدلية النهرين التخصصية',
      ku: 'دەرمانخانەی دجلە',
      en: 'Tigris Pharmacy'
    },
    category: 'pharmacy',
    bio: {
      ar: 'صيدلية متكاملة توفر كافة الأدوية والمستلزمات الطبية المعتمدة وخبرة تضمن سلامتكم وتوصيل سريع.',
      ku: 'دەرمانخانەیەکی گشتگیر بۆ پێشکەشکردنی باشترین چارەسەر و دەرمانی پزیشکی.',
      en: 'Fully stocked pharmacy offering certified prescription medications and fast medical delivery services.'
    },
    phone: '+9647913785529'
  },
  {
    name: {
      ar: 'ھۆتێلی شاری کوردستان',
      ku: 'ھۆتێلی شاری کوردستان',
      en: 'Kurdistan City Hotel'
    },
    category: 'hotel',
    bio: {
      ar: 'فندق متميز يقدم تجربة إقامة راقية مع غرف مجهزة بالكامل ومطعم يعكس الثقافة الكردية الأصيلة.',
      ku: 'ھۆتێلێکی لوکس کە سویتی فاخر و خزمەتگوزاری نایاب پێشکەش دەکات بۆ گەشتیاران.',
      en: 'A premium hotel delivering authentic Kurdish hospitality, exquisite dining, and family suites.'
    },
    phone: '+9647701103987'
  },
  {
    name: {
      ar: 'صيدلية الشفاء للمستلزمات',
      ku: 'دەرمانخانەی شیفا',
      en: 'Al-Shifa Pharmacy'
    },
    category: 'pharmacy',
    bio: {
      ar: 'توفير متميز للأدوية الاستيرادية وتأمين المستلزمات الطبية للأمراض المزمنة بدقة ونصح صيدلاني موثوق.',
      ku: 'دابینکردنی هەموو دەرمانە پزیشکییەکان بە چاودێری باشترین پزیشکی دەرمانساز.',
      en: 'Supplying verified medications and baby goods under veteran medical experts 24 hours daily.'
    },
    phone: '+9647918258157'
  },
  {
    name: {
      ar: 'مركز لياقة بغداد للرجال والسيدات',
      ku: 'سەنتەری ڕاهێنانی فیتنسی بەغدا',
      en: 'Baghdad Fitness Center'
    },
    category: 'gym',
    bio: {
      ar: 'صالة رياضية مجهزة بالكامل بأحدث الأجهزة الحديدية والكارديو مع كابتن مخصص لبناء الأجسام والتنحيف.',
      ku: 'باشترین هۆڵی وەرزش مجهز بە ئامێری مۆدێرن و ڕاهێنەری خاوەن ئەزموون.',
      en: 'State-of-the-art conditioning athletic center with custom strength programs and top local coaches.'
    },
    phone: '+9647725662601'
  },
  {
    name: {
      ar: 'مدرسة النور الأهلية النموذجية',
      ku: 'قوتابخانەی نووری ئەهلی',
      en: 'Al-Noor Private Academy'
    },
    category: 'university',
    bio: {
      ar: 'مدرسة أهلية تلتزم بتقديم تعليم ذي جودة متميزة لكافة المراحل الابتدائية والمتوسطة بنظم إلكترونية.',
      ku: 'قوتابخانەیەکی تایبەت بە پڕۆگرامی مۆدێرن بۆ پەرەپێدانی زانستی خوێندکاران.',
      en: 'Private elementary and secondary school offering elite digital tutoring and certified educational systems.'
    },
    phone: '+9647971018669'
  },
  {
    name: {
      ar: 'كافيه السليمانية التراثي',
      ku: 'کافێی سلێمانی',
      en: 'Slemani Café'
    },
    category: 'cafe_bakery',
    bio: {
      ar: 'مكان هادئ وجميل لتذوق الشاي الكردي الفاخر والقهوة المختصة مع معجنات يومية طازجة في قلب المنطقة.',
      ku: 'باشترین شوێن بۆ خواردنەوەی قاوەی نایاب و چا لەگەڵ کەشێکی ئارامی ماڵبات.',
      en: 'Relaxing lounge serving specialty Kurdish tea, fresh pastries, and double-shot espressos.'
    },
    phone: '+9647725221327'
  },
  {
    name: {
      ar: 'البوابة الذهبية للتسويق العقاري',
      ku: 'نووسینگەی عەقاراتی دەروازەی زێڕین',
      en: 'Golden Gate Real Estate'
    },
    category: 'real_estate',
    bio: {
      ar: 'نخبة مستشاري العقار في العراق لبيع وشراء البيوت والشقق السكنية الفاخرة والأراضي بمصداقية مطلقة.',
      ku: 'کڕین و فرۆشتنی خانوو و شوقە بە باشترین متمانە و گرەنتی یاسایی.',
      en: 'basras leading brokerage firm specializing in luxury villas, residential plots and modern office lets.'
    },
    phone: '+9647964495198'
  },
  {
    name: {
      ar: 'خواردنگەی سەرکەوتن للوجبات الكردية',
      ku: 'خواردنگەی سەرکەوتن',
      en: 'Sarkawtin Kurdish Restaurant'
    },
    category: 'restaurant',
    bio: {
      ar: 'مطعم كوردي شهير يقدم أشهى القوزي والمشاوي الكردية والشوربات الساخنة الطازجة يومياً بكل ترحاب.',
      ku: 'چێشتخانەیەکی نایابی کوردی بۆ پێشکەشکردنی تامترین قۆزی و کباب بۆ میوانان.',
      en: 'Iconic traditional Kurdish diner offering wood-fired kebabs, sizzling stews, and generous hospitality.'
    },
    phone: '+9647863510132'
  },
  {
    name: {
      ar: 'فندق بابل الرافدين الكبير',
      ku: 'ھۆتێلی میسۆپۆتامیا گراند',
      en: 'Mesopotamia Grand Hotel'
    },
    category: 'hotel',
    bio: {
      ar: 'واحة الضيافة فئة الخمس نجوم مع إطلالات ساحرة ومرافق استجمام تضمن لك أعلى مستويات الفخامة.',
      ku: 'گەورەترین هۆتێلی پێنج ئەستێرە بە شاهانەترین خزمەتگوزاری بۆ گەشتیاران.',
      en: 'A premier 5-star hospitality hub overlooking historic landmarks, featuring majestic halls and a gym.'
    },
    phone: '+9647713637048'
  },
  {
    name: {
      ar: 'مكتب موڵکی زێڕین للعقارات المعاصرة',
      ku: 'ئۆفیسی موڵکی زێڕین',
      en: 'Golden Property Real Estate'
    },
    category: 'real_estate',
    bio: {
      ar: 'مكتب مرخص رسمياً لخدمات العقارات والاستثمارات التجارية والوساطة الموثوقة لأصحاب الأعمال.',
      ku: 'نووسینگەی کڕینی خانوبەرەی زێڕین بۆ شوێنە بازرگانییەکان بە باشترین گرێبەست.',
      en: 'Licensed property investment firm focused on commercial property acquisitions and modern apartments.'
    },
    phone: '+9647986268855'
  },
  {
    name: {
      ar: 'شركة البناء الحديث للمقاولات العامة',
      ku: 'کۆمپانیای بیناسازی گشتی هاوچەرخ',
      en: 'Modern Build Co.'
    },
    category: 'real_estate',
    bio: {
      ar: 'نصمم ونبني مستقبلك بأعلى مواصفات السلامة الهندسية وتشييد الفلل السكنية وأبراج الأعمال.',
      ku: 'دیزاین و دروستکردنی باڵەخانەکان بە باشترین کەرەستە و کوالیتی پێشکەوتوو.',
      en: 'General engineering enterprise designing robust high-rises and premium smart homes.'
    },
    phone: '+9647983533001'
  },
  {
    name: {
      ar: 'صالون نجمة التجميل النسائي',
      ku: 'ساڵۆنی جوانکاری ستێرە',
      en: 'Star Beauty Salon & Spa'
    },
    category: 'salon',
    bio: {
      ar: 'صالون راقي ومتطور يقدم تسريحات وقصات شعر عصرية، رعاية طبية للبشرة، وباقات مكياج العرائس.',
      ku: 'پێشکەشکردنی جوانترین میکیاجی خانمان و چاککردنی قژ بۆ گشت بۆنەکان.',
      en: 'Premium luxury makeover escape providing therapeutic skincare, modern hairstyling, and bridal makeup.'
    },
    phone: '+9647869205494'
  },
  {
    name: {
      ar: 'کلۆبی وەرزشی ئەرێن للرشاقة',
      ku: 'کلۆبی وەرزشی ئەرێن',
      en: 'Areen Sports & Physical Club'
    },
    category: 'gym',
    bio: {
      ar: 'نادي رياضي متكامل للرشاقة وتنسيق القوام بإشراف خبراء تغذية ومعدات تفتح النفس للتدريب الممتاز.',
      ku: 'سەنتەري تەندروستی باش بۆ لاوازبوون و زیادکردنی ماسولکە بە باشترین بەرنامە.',
      en: 'Ultra-modern cardiovascular wellness lounge offering specialized training plans and fitness tracks.'
    },
    phone: '+9647945552626'
  },
  {
    name: {
      ar: 'كافيه الرافدين الحديث',
      ku: 'كافيه عێراقی نوێ',
      en: 'Iraq Cafe & Specialty Brew'
    },
    category: 'cafe_bakery',
    bio: {
      ar: 'كافيه شبابي وعائلي يوفر جلسات ساحرة لمشاهدة المباريات، لعب الشطرنج، مع ألذ أنواع الحلويات والقهوة.',
      ku: 'کافێیەکی گەنجانە بە قاوەی بەتام و کەشێکی پڕ یاری بە تەلەفزیۆنی گەورە.',
      en: 'Vibrant local hub specializing in cardamom drip coffee, double cold brews, and watching live sports.'
    },
    phone: '+9647929458311'
  },
  {
    name: {
      ar: 'صالون نور الجمال للأولاد والرجال',
      ku: 'ساڵۆنی نووری جوانکاری پیاوان',
      en: 'Noor Al-Jamal Men Salon'
    },
    category: 'salon',
    bio: {
      ar: 'حلاقة وقصات شعر وبخار ساخن وجلسات ليزر ومساج مريحة للاسترخاء والعناية الكاملة بمظهرك الأنيق.',
      ku: 'باشترین هێڵی جوانکاری پیاوان بە ستافی زۆر بەتوانا لە قژ و چاککردنی ڕیش.',
      en: 'Professional sharp haircuts, hot steam beard treatments, facial repairs, and head massages.'
    },
    phone: '+9647896192478'
  },
  {
    name: {
      ar: 'مطعم الرشيد البغدادي الشهير',
      ku: 'چێشتخانەی ڕەشید',
      en: 'Al-Rasheed Restaurant'
    },
    category: 'restaurant',
    bio: {
      ar: 'مطعم ومشاوي مميزة تقدم المشويات والمحاشي والشوربات العراقية العريقة بنفحة تراثية لا تقاوم للجميع.',
      ku: 'چێشتخانەیەکی عێرقی کۆن بۆ پێشکەشکردنی کەبابی ڕەسەن و گۆشتی سوور.',
      en: 'Historical culinary landmark serving premium sizzling kebabs, loaded rice dishes and traditional teas.'
    },
    phone: '+9647765156203'
  },
  {
    name: {
      ar: 'أكاديمية الآفاق الجديدة',
      ku: 'قوتابخانەی ئاسۆی نوێی تایبەت',
      en: 'New Horizon Academy'
    },
    category: 'university',
    bio: {
      ar: 'مؤسسة تعليمية نموذجية تهتم ببناء الشخصية والذكاء الإبداعي واللغات الأجنبية للأطفال واليافعين.',
      ku: 'پێشکەشکردنی زیاترین ئاستی زمانەوانی و زانستی هاوچەرخ بۆ بەهێزبوونی ئاستی مناڵان.',
      en: 'Certified global schooling system centered on digital intelligence and fluent English language training.'
    },
    phone: '+9647853912983'
  },
  {
    name: {
      ar: 'مطعم الشرقية للمأكولات البحرية والمشويات',
      ku: 'چێشتخانەی شەرقیەی بەناوبانگ',
      en: 'Al-Sharqiya Charcoal Grills'
    },
    category: 'restaurant',
    bio: {
      ar: 'أجود المشروبات الساخنة والباردة وأطباق المشويات الحلبية والسمك المسكوف الأصلي في صالة مميزة ومكيفة.',
      ku: 'باشترین ماسی مەسگوف و کەباب بە شێوازی عێراقی ڕەسەن بۆ ماڵباتەکان.',
      en: 'Symphony of golden wood-grilled river fish, organic salad bars, and luxury family floor seating.'
    },
    phone: '+9647778652405'
  },
  {
    name: {
      ar: 'المنارة الذكية للإلكترونيات وهواتف الجيل الخامس',
      ku: 'تەکنەلۆجیای زیرەکی فیدێڵ',
      en: 'Smart Electronics & Tech Hub'
    },
    category: 'mobile_shop',
    bio: {
      ar: 'متجركم المعتمد لشراء أحدث الهواتف الذكية وبطاقات الجيمز وإكسسوارات الحواسيب بضمانات رسمية حقيقية.',
      ku: 'دابینکردنی هەموو جۆرە مۆبایلێکی زیرەک و پلەیستەیشن بە نزمترین نرخ لە بازاڕ.',
      en: 'Premier device reseller specializing in custom gaming rigs, tablets and smart audio systems.'
    },
    phone: '+9647842125421'
  }
];

export interface PostTemplate {
  caption: { ar: string; ku: string; en: string };
  badge: { ar: string; ku: string; en: string };
  mediaUrl: string;
}

export const POST_TEMPLATES_BY_CATEGORY: Record<string, PostTemplate[]> = {
  restaurant: [
    {
      caption: {
        ar: 'مين يشتهي مشاوي على حطب السنديان عالحق؟ 🍢🔥 طبق الكباب المشكل مالتنا يحضر من أفضل لحوم الغنم العراقية الطازجة وتتبيلة سرية مميزة! كروشة خفيفة دافية مع العائلة تخلي يومك ولا أروع. هاتف للحجز والاستفسار متوفر بالوصف. زورونا اليوم!',
        ku: 'کێ حەزی لە کبابی ڕەسەنی عێراقییە؟ 🍢🔥 ئامادەکراو بە گۆشتی فرێش بە تامی داری سروشتی. پێشوازی لە گشت کڕیاران و خێزانەکان دەکەین بە داشکاندنی تایبەت.',
        en: "Gourmet, wood-fired Iraqi kebabs grilled to absolute perfection tonight! 🍢🔥 Hand-pressed local cuts blended with proprietary family spices. Bring your loved ones to enjoy our relaxing family hall with tables overlooking the scenery!"
      },
      badge: { ar: 'مشاوي ملوكية 🔥', ku: 'کەبابی ڕەسەن 🔥', en: 'King Grill Deal 🔥' },
      mediaUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
    },
    {
      caption: {
        ar: 'جمعتنا أحلى وأميز مع القوزي العراقي الفاخر من مطعمنا الحبيب! 👨‍👩‍👧‍👦 طعم يرجعك لدفء مائدة الأمهات والقرية العراقية الدافئة. الرز مزين بالمكسرات والزعفران مع اللحم البلدي الذائب. جربوه اليوم ومتعوا شهيتكم. نفتح لغاية الساعة 1:00 صباحاً.',
        ku: 'بە خۆشترین ژەمی قۆزی عێراقی ئێوارەکەت ڕووناک بکەرەوە! 👨‍👩‍👧‍👦 گۆشتی گەرم و زەعفەرانی شاهانە. تا درەنگانی شەو کراوەیە بۆ پێشوازیکردنی ئێوە.',
        en: 'Indulge in our signature slow-roasted local Quzi! 👨‍👩‍👧‍👦 Tender, fall-off-the-bone meat, hand-harvested basmati rice, saffron hints, and generous premium nuts topping. Relish authentic heritage tonight.'
      },
      badge: { ar: 'قوزي شيوخي 🥩', ku: 'قۆزی بەتام 🥩', en: 'Sovereign Quzi 🥩' },
      mediaUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
    }
  ],
  cafe_bakery: [
    {
      caption: {
        ar: 'صباح الرواق ونسيم الصباح الدافئ! ☕🥐 ابدأ يومك معنا بالطاقة والإيجابية وعطر القهوة المختصة المجهزة بعناية. الكابتشينو مالتنا مع رغوة كثيفة وهيل عراقي مميز فد شي يريح البال! انترنت فائق السرعة وزاوية هادئة لعشاق العمل والدراسة والمطالعة.',
        ku: 'بەیانیتان باش بە تامی کاپوچینۆی هێلی نایاب! ☕🥐 کەشێکی زۆر ئارام بۆ کارکردن و خوێندن لەگەڵ خێراترین هێڵی ئینتەرنێت.',
        en: 'Fuel your morning hustle with our award-winning Cardamom Infused Capuccino paired with flaky warm butter croissants. ☕🥐 Blazing fast fibre Wi-Fi, cozy acoustic music, and peaceful reading nooks in the heart of the district.'
      },
      badge: { ar: 'رواق صباحي ☕', ku: 'رەواقی بەیانیان ☕', en: 'Morning Hustle ☕' },
      mediaUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80'
    },
    {
      caption: {
        ar: 'حلوى متميزة مع كوب دبل اسبريسو ساحر! 🍰☕ خذ فاصل من ضغوط العمل اليومي ودلّع روحك بشرائح الكيك الطازجة والمحشوة بالكراميل المملح والمعد بيدي خبرائنا بمكونات مستوردة فاخرة. بانتظاركم في جلساتنا العائلية الراقية والمفتوحة.',
        ku: 'شیرینی شیک و قاوەی گەرم بۆ حەوانەوەی ئێوە! 🍰☕ پێشوازی لە گەنجان و مۆحبینان دەکەین ڕۆژانە تا درەنگ.',
        en: 'Satisfy your sweet cravings with our fresh artisanal Salted Caramel cakes and premium double espresso brews. 🍰☕ Unwind safely in our outdoor heated terrace.'
      },
      badge: { ar: 'دقائق السعادة 🍰', ku: 'کات بۆ حەوانەوە 🍰', en: 'Gourmet Dessert 🍰' },
      mediaUrl: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=800&auto=format&fit=crop&q=80'
    }
  ],
  pharmacy: [
    {
      caption: {
        ar: 'صحتكم وسلامة عوائلكم هي أمانتنا الأولى! 💊❤️ تفضل بزيارة صيدليتنا المعتمدة للحصول على نصح وإرشاد طبي من أكفأ الصيادلة المحترفين، مع توفير كامل لبروتوكولات علاج أمراض الضغط والسكري المزمنة المستوردة وبضمان حقيقي وتوصيل فوري لبيتك.',
        ku: 'تەندروستیتان لە سەرووی هەموو پێویستییەکەوەیە! 💊❤️ دابینکردنی تەواوی دەرمانەکانی نەخۆشی درێژخایەن بە گرەنتی نمرە یەک بۆ ئێوە.',
        en: "Your health is our absolute highest priority. 💊❤️ Stop by today for a complete consultation on imported medicine treatments, authentic certifications, and professional prescription guidance. Fast doorstep delivery is active!"
      },
      badge: { ar: 'رعاية وثقة ❤️', ku: 'چاودێری و متمانە ❤️', en: 'Certified Healthcare ❤️' },
      mediaUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80'
    }
  ],
  gym: [
    {
      caption: {
        ar: 'حرق السعرات وبناء العضلات بقوة واحترافية! 💪🏋️ انضم إلينا اليوم واستمتع بجلسات تدريب حصرية مع كباتن معتمدين، ومعدات قوية متكاملة تساعدك على تحقيق حلم الرشاقة والصحة وتنسيق القوام بأفضل الأسعار وبوفيه مكملات غذائية أصلي بالكامل.',
        ku: 'جەستەی خۆت بگۆڕە بە بەهێزترین ڕاهێنان لە ساڵۆنی وەرزشی! 💪🏋️ ڕاهێنەری تایبەتی، ئامێری مۆدێرن و باشترین بەرنامەی خۆراک.',
        en: "Crush your limits and shape your dream physique with our world-class cardio lines, lifting machinery, and direct mentorship from regional powerlifting champions. Join today and receive physical diagnostics!"
      },
      badge: { ar: 'تحدي الأبطال 🏋️', ku: 'ببن بە پاڵەوان 🏋️', en: 'Unleash Power 🏋️' },
      mediaUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80'
    }
  ],
  university: [
    {
      caption: {
        ar: 'إلهام بلا حدود لجيل المستقبل الواعد! 🎓📚 يسعدنا استقبال طلبات التسجيل للفصل الدراسي الجديد بمناهج علمية وعملية تفاعلية حديثة، غرف صفية مجهزة بأحدث تقنيات العرض الذكي وكادر تعليمي يمتلك سنين من الخبرة في توجيه مهارات الطالب وإبداعه.',
        ku: 'دەستپێکردنی قۆناغێکی نوێ لە فێربوون و فێرکاری نایاب بۆ مناڵەکانتان! 🎓📚 قوتابخانەی مۆدێرن بە باشترین مامۆستایان.',
        en: "Shaping the minds of tomorrow's visionary leaders today. 🎓📚 Admissions are now active for high-caliber programs with interactive tech-labs, certified professional tutors, and holistic extracurricular pursuits. Book a campus trip!"
      },
      badge: { ar: 'علم وتميز 🎓', ku: 'داهاتوویەکی گەش 🎓', en: 'Admissions Open 🎓' },
      mediaUrl: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80'
    }
  ],
  hotel: [
    {
      caption: {
        ar: 'الاستجمام الفخم الذي تبحث عنه تحت نجوم المساء الباردة! 🏨🏔️ باقة نهاية الأسبوع الفاخرة صممت لتمنح رغد العيش بأسعار ممتازة، بوفيه مفتوح مع طهاة عالميين وصالون سبا تخصصي لإعادة النشاط والحيوية لجسدك وعقلك. احجز اليوم بمكالمة سريعة.',
        ku: 'خۆشترین کاتی حەوانەوەی شاهانە لەگەڵ دیمەنی دڵگیر و مەلەوانگە! 🏨🏔️ تیمی مێوانداری باش لە خزمەتی ئێوەدایە.',
        en: 'Indulge in unmatched 5-star mountain luxury and therapeutic relaxation packages. 🏨🏔️ Enjoy multi-cuisine breakfast buffets, deep tissue herbal massages, and fully private executive suites. Secure your grand retreat today.'
      },
      badge: { ar: 'إقامة ملكية 🏨', ku: 'مانەوەی شاهانە 🏨', en: '5-Star Luxury 🏨' },
      mediaUrl: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=800&auto=format&fit=crop&q=80'
    }
  ],
  real_estate: [
    {
      caption: {
        ar: 'فيلا فخمة وعصرية مخصصة لذوقك الرفيع! 🏢🔑 نحن في مكتبنا مرخصون لتقريب المسافات وتوفير أفضل العروض القانونية الموثوقة لتأجير وشراء الفلل والشقق في المواقع الاستراتيجية بأفضل تسهيلات سداد وعائد استثماري مضمون ومستشار عقاري متاح دائماً.',
        ku: 'شوقە یان ڤێلای خەونەکانت لێرە بەدەستبهێنە یاسایی بە فەرمی! 🏢🔑 باشترین یارمەتیدەری یاسایی بۆ کڕینی خانوو.',
        en: 'Find your absolute dream modern estate or luxury commercial space today with our elite property consultants. 🏢🔑 Unlocked premium villas in high-security compounds with flexible payments. Call us for secure deals.'
      },
      badge: { ar: 'عقار موثوق 🏢', ku: 'عەقاراتی فەرمی 🏢', en: 'Prime Properties 🏢' },
      mediaUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80'
    }
  ],
  salon: [
    {
      caption: {
        ar: 'أناقتك وتسريحتك تنطق بجاذبيتك وثقتك! 💈💇 ستايلات عصرية لقص وتهذيب اللحى والعناية المتكاملة بالبشرة عن طريق استخدام ماسكات الطين وأجهزة البخار المغذية والمعطرة لتنظيف متكامل وعناية لا تضاهى تمنحك حضوراً متميزاً وسط الجميع.',
        ku: 'شیکترین ستایلی تاشینی قژ و چاککردنی ڕیش لێرە بە باشترین بەستەر! 💈💇 کەشێکی زۆر ئارامی پیاوان لە هۆڵی ساڵۆن.',
        en: 'Sharp customized skin-fades, premium charcoal face treatments, and outstanding organic beard repair packages from the top barbers in town! 💈💇 Relaxing chill beats and custom organic barista coffee for every guest.'
      },
      badge: { ar: 'مظهر الأناقة 💈', ku: 'ستایلی شاهانە 💈', en: 'Master Barber style 💈' },
      mediaUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80'
    }
  ],
  mobile_shop: [
    {
      caption: {
        ar: 'اقتنِ اليوم أقوى هواتف الجيل الخامس والسماعات بأسعار خرافية ومكفولة! 📱🔥 متجر الشراء المعتمد يوفر لك ضمان حقيقي لمدة سنة كاملة مع شاحن وباوربانك سريع هدية مضمونة لكل هاتف يتم شراؤه خلال الأسبوع. زرنا واكتشف هدايا ومزايا ممتازة.',
        ku: 'نوێترین مۆبایلی زیرەک و هێدفۆن بکڕە بە باشترین گرەنتی فەرمی ساڵێک! 📱🔥 دیاری بەنرخ و پاوەربانکی بەلاش لەگەڵ کڕین.',
        en: "Upgrade your handheld setups today with Basra's unmatched competitive pricing on official flagship mobile devices and robust laptop assets. 📱🔥 Receive a free fast-charging high-capacity powerbank with any purchase today!"
      },
      badge: { ar: 'هدايا ممتازة 📱', ku: 'دیاری نایاب 📱', en: 'Tech Upgrade 📱' },
      mediaUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80'
    }
  ]
};

/**
 * Dynamically picks a business from the CSV list and builds an elegant Social Media post tailored to its category 
 * with randomly customized comments, view count, reaction numbers, and time markers.
 */
export function generateLivePostFromCSV(gov: GovernorateCode): SocialPost {
  const govLabel = {
    all: { ar: 'العراق', ku: 'عێراق', en: 'Iraq' },
    baghdad: { ar: 'بغداد', ku: 'بەغداد', en: 'Baghdad' },
    erbil: { ar: 'إربيل', ku: 'هەولێر', en: 'Erbil' },
    basra: { ar: 'البصرة', ku: 'بەسرە', en: 'Basra' },
    sulaymaniyah: { ar: 'السليمانية', ku: 'سلێمانی', en: 'Sulaymaniyah' },
    najaf: { ar: 'النجف', ku: 'نەجەف', en: 'Najaf' },
    mosul: { ar: 'نينوى', ku: 'موسڵ', en: 'Nineveh' },
    karbala: { ar: 'كربلاء المقدسة', ku: 'کەربەلا', en: 'Karbala' },
    kirkuk: { ar: 'كركوك', ku: 'کەرکوک', en: 'Kirkuk' },
    anbar: { ar: 'الأنبار', ku: 'ئەنبار', en: 'Anbar' },
    duhok: { ar: 'دهوك', ku: 'دهۆک', en: 'Dohuk' },
    babil: { ar: 'بابل', ku: 'بابل', en: 'Babil' },
    diyala: { ar: 'ديالى', ku: 'دیالە', en: 'Diyala' },
    wasit: { ar: 'واسط', ku: 'واست', en: 'Wasit' },
    saladin: { ar: 'صلاح الدين', ku: 'سەلاحەدین', en: 'Saladin' },
    maysan: { ar: 'ميسان', ku: 'میسان', en: 'Maysan' },
    dhiqar: { ar: 'ذي قار', ku: 'زی قار', en: 'Dhi Qar' },
    muthanna: { ar: 'المثنى', ku: 'موسەنا', en: 'Muthanna' },
    qadisiya: { ar: 'القادسية', ku: 'قادسیە', en: 'Qadisiya' },
    halabja: { ar: 'حلبجة الشهيدة', ku: 'هەڵەبجە', en: 'Halabja' }
  }[gov];

  // Pick a random master business
  const randomBizIdx = Math.floor(Math.random() * CSV_BASE_BUSINESSES.length);
  const baseBiz = CSV_BASE_BUSINESSES[randomBizIdx];

  // Pick static localized elements
  const templates = POST_TEMPLATES_BY_CATEGORY[baseBiz.category] || POST_TEMPLATES_BY_CATEGORY['restaurant'];
  const template = templates[Math.floor(Math.random() * templates.length)];

  // Randomized engagements
  const likes = Math.floor(Math.random() * 210) + 15;
  const commentsCount = Math.floor(Math.random() * 5) + 1;
  const shares = Math.floor(Math.random() * 45) + 3;
  const views = likes * (Math.floor(Math.random() * 5) + 6);

  // Believable comments
  const commentPool = [
    { id: 'ca', username: 'hasan_bagh', textAr: 'والله شغلكم راقي وتستاهلون كل خير ⭐', textKu: 'دەستان خۆش بێت کارێکی زۆر جوانە', textEn: 'Excellent service, highly recommended!' },
    { id: 'cb', username: 'sara_kurd', textAr: 'عاشت الأيادي دائماً متميزين ومعاملة راقية', textKu: 'زور جوانة باشترینن هەمیشە سەركەوتوو بن', textEn: 'Beautiful setup and lovely customer support!' },
    { id: 'cc', username: 'ali_iraqi', textAr: 'زرته البارحة ومعاملة راقية والأسعار جداً مناسبة', textKu: 'تاقی مانی كراوە زۆر تایبەت بوو', textEn: 'Will definitely visit with my family this week.' },
    { id: 'cd', username: 'dr_noor', textAr: 'سرعة بالتوصيل وثقة ممتازة ربي يرزقكم 😇', textKu: 'سەرکەوتوو بن خزمەتگوزاریتان خێرایە چاکە', textEn: 'Superb! Legit and very smooth interaction.' }
  ];

  const selectedComments = [];
  for (let i = 0; i < commentsCount; i++) {
    const c = commentPool[(randomBizIdx + i) % commentPool.length];
    selectedComments.push({
      id: `c-gen-${Date.now()}-${i}`,
      username: c.username,
      text: c.textAr, // simple fallback
      time: '2h'
    });
  }

  const timesAr = ['منذ ساعة', 'منذ ٣ ساعات', 'منذ ٧ ساعات', 'منذ يوم', 'منذ يومين'];
  const timesKu = ['١ کاتژمێر پێش ئێستا', '٣ کاتژمێر پێش ئێستا', '٧ کاتژمێر پێش ئێستا', 'دوێنێ', '٢ ڕۆژ پێش ئێستا'];
  const timesEn = ['1 hour ago', '3 hours ago', '7 hours ago', 'yesterday', '2 days ago'];
  const timeIdx = Math.floor(Math.random() * timesAr.length);

  // Address and contact info inclusion matching the business
  const contactLineAr = baseBiz.phone 
    ? `\n\n📞 للتواصل والاستفسار: ${baseBiz.phone} • الموقع: ${govLabel.ar}، ${baseBiz.name.ar}`
    : `\n\n📍 الموقع: ${govLabel.ar}، ${baseBiz.name.ar}`;

  const contactLineKu = baseBiz.phone 
    ? `\n\n📞 بۆ پەیوەندی و زانیاری: ${baseBiz.phone} • ناونیشان: ${govLabel.ku}`
    : `\n\n📍 ناونیشان: ${govLabel.ku}`;

  const contactLineEn = baseBiz.phone 
    ? `\n\n📞 Hotline & Booking: ${baseBiz.phone} • Location: ${govLabel.en}`
    : `\n\n📍 Address: ${govLabel.en}`;

  return {
    id: `csv-post-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    businessId: `csv-biz-${randomBizIdx}`,
    businessName: `${baseBiz.name.ar} - ${govLabel?.ar || 'العراق'}`,
    businessAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
    category: baseBiz.category,
    governorate: gov,
    mediaUrl: template.mediaUrl,
    caption: {
      ar: template.caption.ar + contactLineAr,
      ku: template.caption.ku + contactLineKu,
      en: template.caption.en + contactLineEn
    },
    likes,
    commentsCount,
    shares,
    views,
    timeAgo: {
      ar: timesAr[timeIdx],
      ku: timesKu[timeIdx],
      en: timesEn[timeIdx]
    },
    comments: selectedComments,
    likedByUser: false,
    savedByUser: false,
    promotionBadge: template.badge
  };
}
