import {
  JobPostStatus,
  ListingStatus,
  PayType,
  PriceType,
  Prisma,
  PrismaClient,
  TariffKind,
  UserRole
} from "@prisma/client";

const prisma = new PrismaClient();

type SeedExecutor = {
  name: string;
  email: string;
  phone: string;
  gender: "MALE" | "FEMALE";
  age: number;
  workCategory: string;
  previousWork?: string;
  about: string;
  experienceYears: number;
  skills: string[];
  availability: string;
  isOnline: boolean;
  urgentToday: boolean;
  listing: {
    title: string;
    category: string;
    description: string;
    priceType: PriceType;
    priceValue: number | null;
    district: string;
    tariffKind: TariffKind;
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
  tariffKind?: TariffKind;
};

const executors: SeedExecutor[] = [
  {
    name: "Магомед Алиев",
    email: "executor1@example.com",
    phone: "+7 960 100-10-10",
    gender: "MALE",
    age: 31,
    workCategory: "Уборка",
    previousWork: "Клининг-служба",
    about: "Убираю офисы и квартиры, аккуратно и быстро.",
    experienceYears: 4,
    skills: ["Уборка", "Мытье окон", "Химчистка"],
    availability: "Пн-Сб, 08:00-20:00",
    isOnline: true,
    urgentToday: true,
    listing: {
      title: "Уборка офиса под ключ",
      category: "Уборка",
      description: "Быстро привожу в порядок офисы, магазины и помещения после смены.",
      priceType: PriceType.PER_SQM,
      priceValue: 120,
      district: "Центр",
      tariffKind: "GOLD"
    }
  },
  {
    name: "Расул Гаджиев",
    email: "executor2@example.com",
    phone: "+7 960 100-10-11",
    gender: "MALE",
    age: 29,
    workCategory: "Грузчики",
    previousWork: "Складская логистика",
    about: "Грузчик для переездов и складских задач.",
    experienceYears: 6,
    skills: ["Переезды", "Разгрузка", "Склад"],
    availability: "Ежедневно, 09:00-22:00",
    isOnline: true,
    urgentToday: false,
    listing: {
      title: "Грузчик на час и смену",
      category: "Грузчики",
      description: "Помогу с подъемом мебели, техники и коробок.",
      priceType: PriceType.PER_HOUR,
      priceValue: 500,
      district: "Набережная",
      tariffKind: "PREMIUM"
    }
  },
  {
    name: "Зарема Мусаева",
    email: "executor3@example.com",
    phone: "+7 960 100-10-12",
    gender: "FEMALE",
    age: 35,
    workCategory: "Няня",
    previousWork: "Частный детский центр",
    about: "Няня с педагогическим образованием и рекомендациями.",
    experienceYears: 8,
    skills: ["Уход за детьми", "Подготовка к школе", "Развитие"],
    availability: "Будни, 07:30-19:00",
    isOnline: false,
    urgentToday: false,
    listing: {
      title: "Няня на день и вечер",
      category: "Няня",
      description: "Смотрю за детьми от 2 лет, соблюдаю режим и программу занятий.",
      priceType: PriceType.PER_HOUR,
      priceValue: 450,
      district: "Южный",
      tariffKind: "BASIC"
    }
  },
  {
    name: "Камиль Абдулаев",
    email: "executor4@example.com",
    phone: "+7 960 100-10-13",
    gender: "MALE",
    age: 27,
    workCategory: "Курьер",
    previousWork: "Сервис доставки",
    about: "Курьер по Дербенту, доставка документов и заказов.",
    experienceYears: 3,
    skills: ["Доставка", "Навигация", "Коммуникация"],
    availability: "Ежедневно, 10:00-23:00",
    isOnline: true,
    urgentToday: true,
    listing: {
      title: "Курьер по Дербенту",
      category: "Курьер",
      description: "Быстрая доставка в пределах города.",
      priceType: PriceType.FIXED,
      priceValue: 300,
      district: "Северный",
      tariffKind: "GOLD"
    }
  },
  {
    name: "Аминат Сулейманова",
    email: "executor5@example.com",
    phone: "+7 960 100-10-14",
    gender: "FEMALE",
    age: 30,
    workCategory: "Бариста",
    previousWork: "Кофейня у крепости",
    about: "Бариста с опытом работы в кофейнях и на мероприятиях.",
    experienceYears: 5,
    skills: ["Espresso", "Latte Art", "Касса"],
    availability: "2/2, с 08:00",
    isOnline: false,
    urgentToday: true,
    listing: {
      title: "Бариста на смены",
      category: "Бариста",
      description: "Работаю на потоке и поддерживаю стабильное качество напитков.",
      priceType: PriceType.NEGOTIABLE,
      priceValue: null,
      district: "Центр",
      tariffKind: "PREMIUM"
    }
  },
  {
    name: "Арсен Керимов",
    email: "executor6@example.com",
    phone: "+7 960 100-10-15",
    gender: "MALE",
    age: 38,
    workCategory: "Строительство",
    previousWork: "Стройбригада",
    about: "Отделка и мелкий ремонт квартир и офисов.",
    experienceYears: 9,
    skills: ["Шпаклевка", "Покраска", "Плитка"],
    availability: "Пн-Сб, полный день",
    isOnline: true,
    urgentToday: false,
    listing: {
      title: "Строитель-универсал",
      category: "Строительство",
      description: "Выполняю отделочные работы и косметический ремонт.",
      priceType: PriceType.PER_SQM,
      priceValue: 950,
      district: "Рубас",
      tariffKind: "BASIC"
    }
  },
  {
    name: "Саид Рамазанов",
    email: "executor7@example.com",
    phone: "+7 960 100-10-16",
    gender: "MALE",
    age: 33,
    workCategory: "Сантехник",
    previousWork: "Сервисный центр",
    about: "Сантехник, выезд в день обращения по городу.",
    experienceYears: 7,
    skills: ["Смесители", "Трубы", "Устранение течи"],
    availability: "Ежедневно, 09:00-21:00",
    isOnline: true,
    urgentToday: true,
    listing: {
      title: "Сантехник срочно",
      category: "Сантехник",
      description: "Установка сантехники, ремонт течей, подключение.",
      priceType: PriceType.FIXED,
      priceValue: 1500,
      district: "Аэродром",
      tariffKind: "PREMIUM"
    }
  },
  {
    name: "Руслан Ахмедов",
    email: "executor8@example.com",
    phone: "+7 960 100-10-17",
    gender: "MALE",
    age: 36,
    workCategory: "Электрик",
    previousWork: "Электромонтаж",
    about: "Электрик с инструментом, монтаж и диагностика.",
    experienceYears: 10,
    skills: ["Проводка", "Щиток", "Освещение"],
    availability: "Пн-Вс, 08:00-20:00",
    isOnline: false,
    urgentToday: false,
    listing: {
      title: "Электрик на дом",
      category: "Электрик",
      description: "Диагностика, замена розеток, монтаж автоматов.",
      priceType: PriceType.NEGOTIABLE,
      priceValue: null,
      district: "Коса",
      tariffKind: "BASIC"
    }
  },
  {
    name: "Патимат Исмаилова",
    email: "executor9@example.com",
    phone: "+7 960 100-10-18",
    gender: "FEMALE",
    age: 26,
    workCategory: "Официант",
    previousWork: "Банкетный сервис",
    about: "Официант для банкетов и смен в зале.",
    experienceYears: 4,
    skills: ["Сервис", "Банкеты", "Командная работа"],
    availability: "Вечерние смены",
    isOnline: true,
    urgentToday: false,
    listing: {
      title: "Официант на мероприятия",
      category: "Официант",
      description: "Выходы на банкеты, свадьбы и корпоративы.",
      priceType: PriceType.PER_HOUR,
      priceValue: 400,
      district: "Центр",
      tariffKind: "PREMIUM"
    }
  },
  {
    name: "Эльдар Гусейнов",
    email: "executor10@example.com",
    phone: "+7 960 100-10-19",
    gender: "MALE",
    age: 32,
    workCategory: "Ремонт",
    previousWork: "Мебельный цех",
    about: "Сборка мебели и мелкий домашний ремонт.",
    experienceYears: 5,
    skills: ["Сборка мебели", "Монтаж", "Ремонт"],
    availability: "Пн-Пт, 10:00-19:00",
    isOnline: false,
    urgentToday: true,
    listing: {
      title: "Сборка мебели",
      category: "Ремонт",
      description: "Соберу шкафы, кухни и кровати, помогу с мелкими ремонтами.",
      priceType: PriceType.FIXED,
      priceValue: 2000,
      district: "Южный",
      tariffKind: "BASIC"
    }
  },
  {
    name: "Зульфия Магомедова",
    email: "executor11@example.com",
    phone: "+7 960 100-10-20",
    gender: "FEMALE",
    age: 34,
    workCategory: "Уборка",
    previousWork: "Клининговая компания",
    about: "Генеральная уборка и уборка после ремонта.",
    experienceYears: 6,
    skills: ["Генеральная уборка", "После ремонта", "Мытье стекол"],
    availability: "Ежедневно, с 09:00",
    isOnline: true,
    urgentToday: true,
    listing: {
      title: "Уборка после ремонта",
      category: "Уборка",
      description: "Удаляю строительную пыль, привожу помещение к чистому виду.",
      priceType: PriceType.PER_SQM,
      priceValue: 150,
      district: "Северный",
      tariffKind: "GOLD"
    }
  },
  {
    name: "Ибрагим Алискеров",
    email: "executor12@example.com",
    phone: "+7 960 100-10-21",
    gender: "MALE",
    age: 24,
    workCategory: "Курьер",
    previousWork: "Служба доставки",
    about: "Курьер на личном автомобиле по Дербенту.",
    experienceYears: 2,
    skills: ["Доставка еды", "Экспресс-доставка", "Документы"],
    availability: "Пт-Вс, полный день",
    isOnline: true,
    urgentToday: false,
    listing: {
      title: "Курьер на авто",
      category: "Курьер",
      description: "Доставка по городу, срочные отправки и маршруты по времени.",
      priceType: PriceType.FIXED,
      priceValue: 350,
      district: "Набережная",
      tariffKind: "PREMIUM"
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
    status: JobPostStatus.ACTIVE,
    tariffKind: "GOLD"
  },
  {
    title: "Разгрузка товара на склад",
    category: "Грузчики",
    description: "Разгрузка машины и размещение коробок на стеллажах.",
    payType: PayType.FIXED,
    payValue: 3000,
    district: "Северный",
    urgentToday: true,
    status: JobPostStatus.ACTIVE,
    tariffKind: "PREMIUM"
  },
  {
    title: "Няня на вечерние часы",
    category: "Няня",
    description: "Нужна няня 3 раза в неделю, опыт обязателен.",
    payType: PayType.PER_HOUR,
    payValue: 500,
    district: "Южный",
    urgentToday: false,
    status: JobPostStatus.ACTIVE,
    tariffKind: "BASIC"
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
    status: JobPostStatus.ACTIVE,
    tariffKind: "PREMIUM"
  }
];

function addDays(days: number) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function addMinutes(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000);
}

async function main() {
  await prisma.contactView.deleteMany();
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.listingTariff.deleteMany();
  await prisma.listingPromotion.deleteMany();
  await prisma.topUpRequest.deleteMany();
  await prisma.tariffPlan.deleteMany();
  await prisma.paymentPlan.deleteMany();
  await prisma.adminSettings.deleteMany();
  await prisma.jobPost.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  const [basicTariff, premiumTariff, goldTariff] = await Promise.all([
    prisma.tariffPlan.create({
      data: {
        name: "BASIC 7 дней",
        kind: "BASIC",
        priceRub: 200,
        durationDays: 7,
        discountPercent: 0,
        isActive: true,
        sortOrder: 10
      }
    }),
    prisma.tariffPlan.create({
      data: {
        name: "PREMIUM 7 дней",
        kind: "PREMIUM",
        priceRub: 350,
        durationDays: 7,
        discountPercent: 10,
        isActive: true,
        sortOrder: 20
      }
    }),
    prisma.tariffPlan.create({
      data: {
        name: "GOLD 7 дней",
        kind: "GOLD",
        priceRub: 600,
        durationDays: 7,
        discountPercent: 15,
        isActive: true,
        sortOrder: 30
      }
    })
  ]);

  const tariffsByKind: Record<TariffKind, { id: string; durationDays: number }> = {
    BASIC: { id: basicTariff.id, durationDays: basicTariff.durationDays },
    PREMIUM: { id: premiumTariff.id, durationDays: premiumTariff.durationDays },
    GOLD: { id: goldTariff.id, durationDays: goldTariff.durationDays }
  };

  await prisma.adminSettings.create({
    data: {
      bankName: "Сбербанк",
      cardNumber: "2202 2000 1234 5678",
      phoneNumber: "+7 999 000-00-00",
      recipientName: "ИП Дербент Работа",
      instructions: "Переведите точную сумму и нажмите «Я оплатил». Подтверждение обычно занимает до 30 минут."
    }
  });

  const adminUser = await prisma.user.create({
    data: {
      name: "Администратор",
      email: "admin@derbent.local",
      role: UserRole.ADMIN,
      balanceRub: 0
    }
  });

  await prisma.paymentPlan.createMany({
    data: [
      { name: "7 дней / 200₽", durationDays: 7, priceRub: 200, isActive: true },
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
        role: UserRole.EXECUTOR,
        balanceRub: 900 + index * 100
      }
    });

    executorUsers.push({ id: user.id, name: item.name });

    await prisma.profile.create({
      data: {
        userId: user.id,
        city: "DERBENT",
        phone: item.phone,
        gender: item.gender,
        age: item.age,
        workCategory: item.workCategory,
        previousWork: item.previousWork,
        about: item.about,
        experienceYears: item.experienceYears,
        skills: item.skills,
        availability: item.availability,
        isOnline: item.isOnline,
        urgentToday: item.urgentToday
      }
    });

    const tariff = tariffsByKind[item.listing.tariffKind];
    const endsAt = addDays(tariff.durationDays + (index % 4));

    const listing = await prisma.listing.create({
      data: {
        userId: user.id,
        city: "DERBENT",
        currency: "RUB",
        status: ListingStatus.ACTIVE,
        expiresAt: endsAt,
        title: item.listing.title,
        category: item.listing.category,
        description: item.listing.description,
        priceType: item.listing.priceType,
        priceValue: item.listing.priceValue,
        district: item.listing.district
      }
    });

    listingIds.push(listing.id);

    await prisma.listingTariff.create({
      data: {
        listingId: listing.id,
        tariffPlanId: tariff.id,
        startsAt: new Date(),
        endsAt,
        status: "ACTIVE"
      }
    });
  }

  const employerOne = await prisma.user.create({
    data: {
      name: "Сеть кофеен Derbent Coffee",
      email: "employer1@example.com",
      role: UserRole.EMPLOYER,
      balanceRub: 2500
    }
  });

  const employerTwo = await prisma.user.create({
    data: {
      name: "Склад Логистик Дербент",
      email: "employer2@example.com",
      role: UserRole.EMPLOYER,
      balanceRub: 1800
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
    const tariff = job.tariffKind ? tariffsByKind[job.tariffKind] : null;
    const isActive = job.status === JobPostStatus.ACTIVE;
    const expiresAt = isActive ? addDays((tariff?.durationDays ?? 7) + (index % 3)) : job.status === JobPostStatus.PAUSED ? addDays(-1) : addDays(3);

    const jobPost = await prisma.jobPost.create({
      data: {
        userId: owner.id,
        city: "DERBENT",
        currency: "RUB",
        expiresAt,
        title: job.title,
        category: job.category,
        description: job.description,
        payType: job.payType,
        payValue: job.payValue,
        district: job.district,
        phone: job.phone ?? null,
        urgentToday: job.urgentToday,
        status: job.status
      }
    });

    createdJobs.push({ id: jobPost.id, userId: owner.id, status: job.status });

    if (isActive && tariff) {
      await prisma.listingTariff.create({
        data: {
          jobPostId: jobPost.id,
          tariffPlanId: tariff.id,
          startsAt: new Date(),
          endsAt: expiresAt,
          status: "ACTIVE"
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
    },
    {
      jobPostId: createdJobs[0]?.id,
      senderName: "Магомед Алиев",
      senderContact: "@magomed.clean",
      text: "Готов выйти завтра с утра на смену."
    },
    {
      jobPostId: createdJobs[1]?.id,
      senderName: "Расул Гаджиев",
      senderContact: "+7 960 100-10-11",
      text: "Есть бригада из двух человек, можем разгрузить к 10:00."
    }
  ].filter((item) => item.listingId || item.jobPostId) as Prisma.MessageCreateManyInput[];

  await prisma.message.createMany({ data: messages });

  await prisma.topUpRequest.createMany({
    data: [
      {
        userId: employerOne.id,
        approverUserId: adminUser.id,
        amountRub: 3000,
        status: "APPROVED",
        adminNote: "Подтверждено вручную",
        createdAt: addDays(-2),
        expiresAt: addDays(-2)
      },
      {
        userId: employerTwo.id,
        amountRub: 1200,
        status: "PENDING",
        proofText: "Перевод 7781",
        createdAt: addMinutes(-5),
        expiresAt: addMinutes(25)
      },
      {
        userId: executorUsers[0].id,
        amountRub: 500,
        status: "EXPIRED",
        createdAt: addDays(-1),
        expiresAt: addDays(-1)
      }
    ]
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
