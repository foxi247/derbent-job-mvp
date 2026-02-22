import {
  JobPostStatus,
  ListingStatus,
  PayType,
  Prisma,
  PriceType,
  PrismaClient,
  UserRole
} from "@prisma/client";

const prisma = new PrismaClient();

type SeedExecutor = {
  name: string;
  email: string;
  phone: string;
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

type SeedEmployerJob = {
  title: string;
  category: string;
  description: string;
  payType: PayType;
  payValue: number | null;
  district: string;
  phone?: string;
  urgentToday: boolean;
  status: JobPostStatus;
};

const executors: SeedExecutor[] = [
  {
    name: "Магомед Алиев",
    email: "executor1@example.com",
    phone: "+7 960 100-10-10",
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
    phone: "+7 960 100-10-11",
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
    phone: "+7 960 100-10-12",
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
    phone: "+7 960 100-10-13",
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
    phone: "+7 960 100-10-14",
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
    phone: "+7 960 100-10-15",
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
    phone: "+7 960 100-10-16",
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
    phone: "+7 960 100-10-17",
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
    phone: "+7 960 100-10-18",
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
    phone: "+7 960 100-10-19",
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
    phone: "+7 960 100-10-20",
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
    phone: "+7 960 100-10-21",
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

const employerJobs: SeedEmployerJob[] = [
  {
    title: "Нужен бариста в кофейню",
    category: "Бариста",
    description: "Смена 8 часов, работа на потоке, важно вежливое общение.",
    payType: PayType.PER_HOUR,
    payValue: 350,
    district: "Центр",
    urgentToday: true,
    status: JobPostStatus.ACTIVE
  },
  {
    title: "Разгрузка товара на склад",
    category: "Грузчики",
    description: "Разгрузка машины и размещение коробок на стеллажах.",
    payType: PayType.FIXED,
    payValue: 3000,
    district: "Северный",
    urgentToday: true,
    status: JobPostStatus.ACTIVE
  },
  {
    title: "Няня на вечерние часы",
    category: "Няня",
    description: "Нужна няня 3 раза в неделю, опыт обязателен.",
    payType: PayType.PER_HOUR,
    payValue: 500,
    district: "Южный",
    urgentToday: false,
    status: JobPostStatus.ACTIVE
  },
  {
    title: "Уборка салона красоты",
    category: "Уборка",
    description: "Ежедневная вечерняя уборка помещения, около 80 м2.",
    payType: PayType.FIXED,
    payValue: 1800,
    district: "Центр",
    urgentToday: false,
    status: JobPostStatus.PAUSED
  },
  {
    title: "Электрик для офиса",
    category: "Электрик",
    description: "Проверка проводки и установка дополнительных линий освещения.",
    payType: PayType.NEGOTIABLE,
    payValue: null,
    district: "Набережная",
    urgentToday: false,
    status: JobPostStatus.COMPLETED
  },
  {
    title: "Курьер на доставку документов",
    category: "Курьер",
    description: "Доставка документов по точкам в течение дня.",
    payType: PayType.PER_HOUR,
    payValue: 320,
    district: "Центр",
    urgentToday: true,
    status: JobPostStatus.ACTIVE
  }
];

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function main() {
  await prisma.contactView.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.listingPromotion.deleteMany();
  await prisma.paymentPlan.deleteMany();
  await prisma.jobPost.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const demoPlan = await prisma.paymentPlan.create({
    data: { name: "7 дней / 200₽", durationDays: 7, priceRub: 200, isActive: true }
  });

  await prisma.paymentPlan.createMany({
    data: [
      { name: "14 дней / 350₽", durationDays: 14, priceRub: 350, isActive: true },
      { name: "30 дней / 700₽", durationDays: 30, priceRub: 700, isActive: true }
    ]
  });

  const executorUsers: { id: string; name: string }[] = [];
  const listingIds: string[] = [];

  for (const [index, item] of executors.entries()) {
    const user = await prisma.user.create({
      data: {
        name: item.name,
        email: item.email,
        role: UserRole.EXECUTOR
      }
    });

    executorUsers.push({ id: user.id, name: item.name });

    await prisma.profile.create({
      data: {
        userId: user.id,
        city: "DERBENT",
        phone: item.phone,
        ...item.profile
      }
    });

    const expiresAt = addDays(7 + (index % 4));

    const listing = await prisma.listing.create({
      data: {
        userId: user.id,
        city: "DERBENT",
        currency: "RUB",
        status: ListingStatus.ACTIVE,
        expiresAt,
        ...item.listing
      }
    });

    listingIds.push(listing.id);

    await prisma.listingPromotion.create({
      data: {
        listingId: listing.id,
        paymentPlanId: demoPlan.id,
        endsAt: expiresAt,
        isDemo: true
      }
    });
  }

  const employerOne = await prisma.user.create({
    data: {
      name: "Сеть кофеен Derbent Coffee",
      email: "employer1@example.com",
      role: UserRole.EMPLOYER
    }
  });

  const employerTwo = await prisma.user.create({
    data: {
      name: "Склад Логистик Дербент",
      email: "employer2@example.com",
      role: UserRole.EMPLOYER
    }
  });

  await prisma.profile.createMany({
    data: [
      {
        userId: employerOne.id,
        city: "DERBENT",
        about: "Кофейни в центре Дербента",
        experienceYears: 0,
        skills: [],
        availability: "",
        phone: "+7 988 700-70-70"
      },
      {
        userId: employerTwo.id,
        city: "DERBENT",
        about: "Логистический склад и доставка",
        experienceYears: 0,
        skills: [],
        availability: "",
        phone: "+7 988 711-11-11"
      }
    ]
  });

  const createdJobs: { id: string; userId: string; status: JobPostStatus }[] = [];

  for (const [index, job] of employerJobs.entries()) {
    const owner = index % 2 === 0 ? employerOne : employerTwo;

    const expiresAt =
      job.status === JobPostStatus.ACTIVE
        ? addDays(7 + (index % 3))
        : job.status === JobPostStatus.PAUSED
          ? addDays(-1)
          : addDays(3);

    const jobPost = await prisma.jobPost.create({
      data: {
        userId: owner.id,
        city: "DERBENT",
        currency: "RUB",
        expiresAt,
        ...job
      }
    });

    createdJobs.push({ id: jobPost.id, userId: owner.id, status: job.status });

    if (job.status === JobPostStatus.ACTIVE) {
      await prisma.listingPromotion.create({
        data: {
          jobPostId: jobPost.id,
          paymentPlanId: demoPlan.id,
          endsAt: expiresAt,
          isDemo: true
        }
      });
    }
  }

  const completedJob = createdJobs.find((job) => job.status === JobPostStatus.COMPLETED);
  if (completedJob) {
    await prisma.review.createMany({
      data: [
        {
          jobPostId: completedJob.id,
          employerUserId: completedJob.userId,
          executorUserId: executorUsers[5].id,
          rating: 5,
          text: "Приехал вовремя, сделал работу аккуратно и быстро."
        },
        {
          jobPostId: completedJob.id,
          employerUserId: completedJob.userId,
          executorUserId: executorUsers[7].id,
          rating: 4,
          text: "Качественно, но немного задержался по времени."
        }
      ]
    });
  }

  const messages: Prisma.MessageCreateManyInput[] = [
    {
      listingId: listingIds[0],
      senderName: "Салон красоты Aura",
      senderContact: "@aura_manager",
      text: "Добрый день, нужна уборка сегодня после 21:00."
    },
    {
      listingId: listingIds[3],
      senderName: "Магазин ФрутМаркет",
      senderContact: "fruit@example.com",
      text: "Нужен курьер на 3 часа, сможете выйти сегодня?"
    }
  ];

  if (createdJobs[0]?.id) {
    messages.push({
      jobPostId: createdJobs[0].id,
      senderName: "Магомед Алиев",
      senderContact: "@magomed.clean",
      text: "Готов выйти завтра с утра на смену."
    });
  }

  if (createdJobs[1]?.id) {
    messages.push({
      jobPostId: createdJobs[1].id,
      senderName: "Расул Гаджиев",
      senderContact: "+7 960 100-10-11",
      text: "Есть бригада из двух человек, можем разгрузить к 10:00."
    });
  }

  await prisma.message.createMany({
    data: messages
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
