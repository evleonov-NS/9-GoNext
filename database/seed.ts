import type { SQLiteDatabase } from 'expo-sqlite';
import { SEED_VERSION } from './constants';
import { addDays, nowIso, toDateOnly } from './helpers';
import { enableForeignKeys } from './mappers';
import * as placesRepo from '@/repositories/placesRepository';
import * as ideasRepo from '@/repositories/tripIdeasRepository';
import * as tripsRepo from '@/repositories/tripsRepository';
import * as photosRepo from '@/repositories/photosRepository';

/**
 * Демо-данные PROJECT §25.1.
 * Даты активной/плановой поездок относительны «сегодня», чтобы
 * «день 2 из 4» и баннер «начинается сегодня» всегда работали.
 */
export async function seedDemoDataIfNeeded(db: SQLiteDatabase): Promise<boolean> {
  await enableForeignKeys(db);

  const meta = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM app_meta WHERE key = 'seed_version'`
  );
  if (meta?.value === SEED_VERSION) {
    return false;
  }

  await db.withTransactionAsync(async () => {
    const ts = nowIso();
    const today = new Date();
    const activeStart = toDateOnly(addDays(today, -1));
    const activeEnd = toDateOnly(addDays(today, 2));
    const activeDay1 = activeStart;
    const plannedStart = toDateOnly(today);
    const plannedEnd = toDateOnly(addDays(today, 1));

    // --- Места Карелия / Выборг (§25.1: 7 мест) ---
    const kivach = await placesRepo.createPlace(db, {
      name: 'Водопад Кивач',
      city: 'Карелия',
      category: 'nature',
      latitude: 62.2675,
      longitude: 33.9808,
      description: 'Один из крупнейших равнинных водопадов Европы.',
      liked: true,
    });
    const ruskeala = await placesRepo.createPlace(db, {
      name: 'Горный парк Рускеала',
      city: 'Карелия',
      category: 'nature',
      latitude: 61.9455,
      longitude: 30.578,
      description: 'Мраморный каньон и подземные маршруты.',
    });
    const kizhi = await placesRepo.createPlace(db, {
      name: 'Музей-заповедник Кижи',
      city: 'Карелия',
      category: 'museum',
      latitude: 62.0668,
      longitude: 35.2135,
      description: 'Деревянное зодчество на острове в Онежском озере.',
    });
    const castle = await placesRepo.createPlace(db, {
      name: 'Выборгский замок',
      city: 'Выборг',
      category: 'sight',
      latitude: 60.7158,
      longitude: 28.729,
      description: 'Средневековый замок на острове Замковый.',
    });
    const monrepo = await placesRepo.createPlace(db, {
      name: 'Парк Монрепо',
      city: 'Выборг',
      category: 'walk',
      latitude: 60.7379,
      longitude: 28.7233,
      description: 'Романтический скальный пейзажный парк.',
    });
    const sampo = await placesRepo.createPlace(db, {
      name: 'Гора Сампо',
      city: 'Карелия',
      category: 'nature',
      // без координат — крайний случай
      description: 'Смотровая площадка у Кончезера.',
      visitLater: true,
    });
    const embankment = await placesRepo.createPlace(db, {
      name: 'Набережная Онежского озера',
      city: 'Петрозаводск',
      category: 'walk',
      latitude: 61.79,
      longitude: 34.38,
      description: 'Променад вдоль Онеги.',
    });

    // --- Места Алтай (идея) ---
    const teletskoye = await placesRepo.createPlace(db, {
      name: 'Телецкое озеро',
      city: 'Алтай',
      category: 'nature',
      visitLater: true,
    });
    const chuysky = await placesRepo.createPlace(db, {
      name: 'Чуйский тракт',
      city: 'Алтай',
      category: 'sight',
      visitLater: true,
    });
    const geyser = await placesRepo.createPlace(db, {
      name: 'Гейзерное озеро',
      city: 'Алтай',
      category: 'nature',
      visitLater: true,
    });

    // --- Места Стамбул (идея) ---
    const hagia = await placesRepo.createPlace(db, {
      name: 'Айя-София',
      city: 'Стамбул',
      category: 'sight',
      visitLater: true,
    });
    const topkapi = await placesRepo.createPlace(db, {
      name: 'Дворец Топкапы',
      city: 'Стамбул',
      category: 'museum',
      visitLater: true,
    });
    const bazaar = await placesRepo.createPlace(db, {
      name: 'Гранд-базар',
      city: 'Стамбул',
      category: 'shopping',
      visitLater: true,
    });
    const galata = await placesRepo.createPlace(db, {
      name: 'Галатская башня',
      city: 'Стамбул',
      category: 'sight',
      visitLater: true,
    });
    const balat = await placesRepo.createPlace(db, {
      name: 'Балат',
      city: 'Стамбул',
      category: 'walk',
      visitLater: true,
    });
    const kadikoy = await placesRepo.createPlace(db, {
      name: 'Кадыкёй',
      city: 'Стамбул',
      category: 'walk',
      visitLater: true,
    });
    const kofte = await placesRepo.createPlace(db, {
      name: 'Чия Кёфтеджиси',
      city: 'Стамбул',
      category: 'food',
      visitLater: true,
    });

    // --- Идеи ---
    const altai = await ideasRepo.createTripIdea(db, {
      title: 'Алтай',
      description: 'Горные озёра и Чуйский тракт. Без жёстких дат.',
      status: 'active',
    });
    await ideasRepo.addTripIdeaPlace(db, altai.id, {
      placeId: teletskoye.id,
      sortOrder: 10,
      priority: 'must',
    });
    await ideasRepo.addTripIdeaPlace(db, altai.id, {
      placeId: chuysky.id,
      sortOrder: 20,
      priority: 'must',
    });
    await ideasRepo.addTripIdeaPlace(db, altai.id, {
      placeId: geyser.id,
      sortOrder: 30,
      priority: 'optional',
    });

    const istanbul = await ideasRepo.createTripIdea(db, {
      title: 'Стамбул',
      description:
        'Хочу съездить на 4–5 дней.\nОтдельный день оставить на азиатскую сторону.',
      status: 'active',
    });
    const istanbulPlaces = [
      { place: hagia, priority: 'must' as const },
      { place: topkapi, priority: 'must' as const },
      { place: bazaar, priority: 'optional' as const },
      { place: galata, priority: 'interesting' as const },
      { place: balat, priority: 'optional' as const },
      { place: kadikoy, priority: 'must' as const },
      { place: kofte, priority: 'interesting' as const },
    ];
    for (let i = 0; i < istanbulPlaces.length; i += 1) {
      const item = istanbulPlaces[i];
      await ideasRepo.addTripIdeaPlace(db, istanbul.id, {
        placeId: item.place.id,
        sortOrder: (i + 1) * 10,
        priority: item.priority,
      });
    }

    // --- Активная поездка «Карелия» ---
    const kareliaActive = await tripsRepo.createTrip(db, {
      title: 'Карелия',
      description: 'Природа и острова Онеги.',
      startDate: activeStart,
      endDate: activeEnd,
      status: 'active',
      current: true,
    });
    const kivachTp = await tripsRepo.addTripPlace(db, kareliaActive.id, {
      placeId: kivach.id,
      sortOrder: 10,
      dayNumber: 1,
      status: 'visited',
      visitDate: activeDay1,
      liked: true,
      notes: 'Шум воды слышен издалека. Стоит приехать утром.',
      priority: 'must',
    });
    await tripsRepo.addTripPlace(db, kareliaActive.id, {
      placeId: ruskeala.id,
      sortOrder: 20,
      dayNumber: 2,
      status: 'pending',
      notes: 'Билеты на подземку — заранее.',
      priority: 'must',
    });
    await tripsRepo.addTripPlace(db, kareliaActive.id, {
      placeId: kizhi.id,
      sortOrder: 30,
      dayNumber: 3,
      status: 'pending',
      notes: 'Паром из Петрозаводска.',
      priority: 'must',
    });
    await tripsRepo.addTripPlace(db, kareliaActive.id, {
      placeId: embankment.id,
      sortOrder: 40,
      dayNumber: null, // без дня
      status: 'pending',
      priority: 'optional',
    });

    // Запись фото без файла — этап 8 работает с реальными URI; демо-строка схемы не показывается в UI
    await photosRepo.createPhoto(db, {
      uri: 'demo://karelia/kivach-1.jpg',
      placeId: kivach.id,
      tripPlaceId: kivachTp.id,
    });

    // --- Запланированная «Выборг» (старт сегодня) ---
    const vyborg = await tripsRepo.createTrip(db, {
      title: 'Выборг на выходные',
      description: 'Замок и Монрепо.',
      startDate: plannedStart,
      endDate: plannedEnd,
      status: 'planned',
      current: false,
    });
    await tripsRepo.addTripPlace(db, vyborg.id, {
      placeId: castle.id,
      sortOrder: 10,
      dayNumber: 1,
      status: 'pending',
      priority: 'must',
    });
    await tripsRepo.addTripPlace(db, vyborg.id, {
      placeId: monrepo.id,
      sortOrder: 20,
      dayNumber: 2,
      status: 'pending',
      priority: 'optional',
    });

    // --- Завершённая «Карелия, август 2025» — 4 из 5, Сампо skipped ---
    const kareliaDone = await tripsRepo.createTrip(db, {
      title: 'Карелия, август 2025',
      description: 'Первая поездка: водопады и острова.',
      startDate: '2025-08-09',
      endDate: '2025-08-12',
      status: 'completed',
      current: false,
    });
    await tripsRepo.addTripPlace(db, kareliaDone.id, {
      placeId: kivach.id,
      sortOrder: 10,
      dayNumber: 1,
      status: 'visited',
      visitDate: '2025-08-09',
      liked: true,
      notes: 'Дождь не испортил впечатление.',
      priority: 'must',
    });
    await tripsRepo.addTripPlace(db, kareliaDone.id, {
      placeId: ruskeala.id,
      sortOrder: 20,
      dayNumber: 2,
      status: 'visited',
      visitDate: '2025-08-10',
      liked: true,
      notes: 'Катамаран по каньону — must.',
      priority: 'must',
    });
    await tripsRepo.addTripPlace(db, kareliaDone.id, {
      placeId: kizhi.id,
      sortOrder: 30,
      dayNumber: 3,
      status: 'visited',
      visitDate: '2025-08-11',
      liked: true,
      priority: 'must',
    });
    await tripsRepo.addTripPlace(db, kareliaDone.id, {
      placeId: embankment.id,
      sortOrder: 40,
      dayNumber: 4,
      status: 'visited',
      visitDate: '2025-08-12',
      liked: false,
      notes: 'Вечерняя прогулка перед отъездом.',
      priority: 'optional',
    });
    await tripsRepo.addTripPlace(db, kareliaDone.id, {
      placeId: sampo.id,
      sortOrder: 50,
      dayNumber: 4,
      status: 'skipped',
      notes: 'Не успели, оставили на следующий раз',
      priority: 'optional',
    });

    await db.runAsync(
      `INSERT INTO app_meta (key, value) VALUES ('seed_version', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      SEED_VERSION
    );
    await db.runAsync(
      `INSERT INTO app_meta (key, value) VALUES ('seeded_at', ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ts
    );
  });

  return true;
}
