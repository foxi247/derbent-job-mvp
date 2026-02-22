import { ListingStatus, PriceType, UserRole, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type SeedExecutor = {
  name: string;
  email: string;
  profile: {
    about: string;
    experienceYears: number;
    skills: string[];
    availability: string;
    isOnline: boolean;
    urgentToday: boolean;
  };
  listing: {
    title: string;
    category: string;
    description: string;
    priceType: PriceType;
    priceValue: number | null;
    district: string;
  };
};

const executors: SeedExecutor[] = [
  {
    name: "Магомед Алиев",
    email: "executor1@example.com",
    profile: {
      about: "Уборка офисов и квартир, аккуратно и с проверкой после работы.",
      experienceYears: 4,
      skills: ["Уборка", "Мытье окон", "Химчистка"],
      availability: "Пн-Сб, 08:00-20:00",
      isOnline: true,
      urgentToday: true
    },
    listing: {
      title: "Уборка офиса под ключ",
      category: "Уборка",
      description: "Быстро привожу в порядок офисы, магазины и помещения после смены.",
      priceType: PriceType.PER_SQM,
      priceValue: 120,
      district: "Центр"
    }
  },
  {
    name: "Расул Гаджиев",
    email: "executor2@example.com",
    profile: {
      about: "Грузчик для переездов, разгрузки фур и складских задач.",
      experienceYears: 6,
      skills: ["Переезды", "Разгрузка", "Склад"],
      availability: "Ежедневно, 09:00-22:00",
      isOnline: true,
      urgentToday: false
    },
    listing: {
      title: "Грузчик на час и смену",
      category: "Грузчики",
      description: "Помогу с подъемом мебели, бытовой техники и коробок без задержек.",
      priceType: PriceType.PER_HOUR,
      priceValue: 500,
      district: "Набережная"
    }
  },
  {
    name: "Зарема Мусаева",
    email: "executor3@example.com",
    profile: {
      about: "Няня с педагогическим образованием и рекомендациями.",
      experienceYears: 8,
      skills: ["Уход за детьми", "Подготовка к школе", "Развитие"],
      availability: "Будни, 07:30-19:00",
      isOnline: false,
      urgentToday: false
    },
    listing: {
      title: "Няня на день и вечер",
      category: "Няня",
      description: "Смотрю за детьми от 2 лет, соблюдаю режим и программу занятий.",
      priceType: PriceType.PER_HOUR,
      priceValue: 450,
      district: "Южный"
    }
  },
  {
    name: "Камиль Абдулаев",
    email: "executor4@example.com",
    profile: {
      about: "Курьер по Дербенту, доставка документов и заказов.",
      experienceYears: 3,
      skills: ["Доставка", "Навигация", "Коммуникация"],
      availability: "Ежедневно, 10:00-23:00",
      isOnline: true,
      urgentToday: true
    },
    listing: {
      title: "Курьер по Дербенту",
      category: "Курьер",
      description: "Быстрая доставка в пределах города, можно срочные заказы.",
      priceType: PriceType.FIXED,
      priceValue: 300,
      district: "Северный"
    }
  },
  {
    name: "Аминат Сулейманова",
    email: "executor5@example.com",
    profile: {
      about: "Бариста с опытом работы в кофейнях и на мероприятиях.",
      experienceYears: 5,
      skills: ["Espresso", "Latte Art", "Касса"],
      availability: "2/2, с 08:00",
      isOnline: false,
      urgentToday: true
    },
    listing: {
      title: "Бариста на смены",
      category: "Бариста",
      description: "Работаю на потоке, поддерживаю стабильное качество напитков.",
      priceType: PriceType.NEGOTIABLE,
      priceValue: null,
      district: "Центр"
    }
  },
  {
    name: "Арсен Керимов",
    email: "executor6@example.com",
    profile: {
      about: "Отделка и мелкий ремонт квартир и офисов.",
      experienceYears: 9,
      skills: ["Шпаклевка", "Покраска", "Плитка"],
      availability: "Пн-Сб, полный день",
      isOnline: true,
      urgentToday: false
    },
    listing: {
      title: "Строитель-универсал",
      category: "Строительство",
      description: "Выполняю отделочные работы, косметический ремонт и исправления.",
      priceType: PriceType.PER_SQM,
      priceValue: 950,
      district: "Рубас"
    }
  },
  {
    name: "Саид Рамазанов",
    email: "executor7@example.com",
    profile: {
      about: "Сантехник, выезд в день обращения по городу.",
      experienceYears: 7,
      skills: ["Смесители", "Трубы", "Устранение течи"],
      availability: "Ежедневно, 09:00-21:00",
      isOnline: true,
      urgentToday: true
    },
    listing: {
      title: "Сантехник срочно",
      category: "Сантехник",
      description: "Установка сантехники, ремонт течей, замена узлов и подключение.",
      priceType: PriceType.FIXED,
      priceValue: 1500,
      district: "Аэродром"
    }
  },
  {
    name: "Руслан Ахмедов",
    email: "executor8@example.com",
    profile: {
      about: "Электрик с инструментом, монтаж и диагностика.",
      experienceYears: 10,
      skills: ["Проводка", "Щиток", "Освещение"],
      availability: "Пн-Вс, 08:00-20:00",
      isOnline: false,
      urgentToday: false
    },
    listing: {
      title: "Электрик на дом",
      category: "Электрик",
      description: "Диагностика, замена розеток, монтаж автоматов и освещения.",
      priceType: PriceType.NEGOTIABLE,
      priceValue: null,
      district: "Коса"
    }
  },
  {
    name: "Патимат Исмаилова",
    email: "executor9@example.com",
    profile: {
      about: "Официант для банкетов, мероприятий и смен в зале.",
      experienceYears: 4,
      skills: ["Сервис", "Банкеты", "Командная работа"],
      availability: "Вечерние смены",
      isOnline: true,
      urgentToday: false
    },
    listing: {
      title: "Официант на мероприятия",
      category: "Официант",
      description: "Выходы на банкеты, свадьбы и корпоративы, аккуратный сервис.",
      priceType: PriceType.PER_HOUR,
      priceValue: 400,
      district: "Центр"
    }
  },
  {
    name: "Эльдар Гусейнов",
    email: "executor10@example.com",
    profile: {
      about: "Сборка мебели и мелкий домашний ремонт.",
      experienceYears: 5,
      skills: ["Сборка мебели", "Монтаж", "Ремонт"],
      availability: "Пн-Пт, 10:00-19:00",
      isOnline: false,
      urgentToday: true
    },
    listing: {
      title: "Сборка мебели",
      category: "Ремонт",
      description: "Соберу шкафы, кухни и кровати, помогу с мелкими ремонтами.",
      priceType: PriceType.FIXED,
      priceValue: 2000,
      district: "Южный"
    }
  },
  {
    name: "Зульфия Магомедова",
    email: "executor11@example.com",
    profile: {
      about: "Генеральная уборка и уборка после ремонта.",
      experienceYears: 6,
      skills: ["Генеральная уборка", "После ремонта", "Мытье стекол"],
      availability: "Ежедневно, с 09:00",
      isOnline: true,
      urgentToday: true
    },
    listing: {
      title: "Уборка после ремонта",
      category: "Уборка",
      description: "Удаляю строительную пыль, привожу помещение к чистому виду.",
      priceType: PriceType.PER_SQM,
      priceValue: 150,
      district: "Северный"
    }
  },
  {
    name: "Ибрагим Алискеров",
    email: "executor12@example.com",
    profile: {
      about: "Курьер на личном автомобиле по Дербенту.",
      experienceYears: 2,
      skills: ["Доставка еды", "Экспресс-доставка", "Документы"],
      availability: "Пт-Вс, полный день",
      isOnline: true,
      urgentToday: false
    },
    listing: {
      title: "Курьер на авто",
      category: "Курьер",
      description: "Доставка по городу, срочные отправки и маршруты по времени.",
      priceType: PriceType.FIXED,
      priceValue: 350,
      district: "Набережная"
    }
  }
];

async function main() {
  await prisma.message.deleteMany();
  await prisma.listingPromotion.deleteMany();
  await prisma.paymentPlan.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.paymentPlan.createMany({
    data: [
      { name: "Старт 7 дней", durationDays: 7, priceRub: 199 },
      { name: "Стандарт 14 дней", durationDays: 14, priceRub: 349 },
      { name: "Премиум 30 дней", durationDays: 30, priceRub: 699 }
    ]
  });

  for (const item of executors) {
    const user = await prisma.user.create({
      data: {
        name: item.name,
        email: item.email,
        role: UserRole.EXECUTOR
      }
    });

    await prisma.profile.create({
      data: {
        userId: user.id,
        city: "DERBENT",
        ...item.profile
      }
    });

    await prisma.listing.create({
      data: {
        userId: user.id,
        city: "DERBENT",
        currency: "RUB",
        status: ListingStatus.ACTIVE,
        ...item.listing
      }
    });
  }

  await prisma.user.create({
    data: {
      name: "Тестовый работодатель",
      email: "employer@example.com",
      role: UserRole.EMPLOYER
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
