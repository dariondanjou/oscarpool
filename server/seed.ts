/**
 * Seed script: inserts all 98th Academy Awards categories and nominees into Supabase.
 * Run once via: npx tsx server/seed.ts
 */
import 'dotenv/config';
import { supabaseAdmin } from './supabase';

const NOMINEES_DATA: Array<{
  slug: string;
  name: string;
  sortOrder: number;
  nominees: Array<{ name: string; detail?: string }>;
}> = [
  {
    slug: "best-picture",
    name: "Best Picture",
    sortOrder: 1,
    nominees: [
      { name: "Bugonia" },
      { name: "F1" },
      { name: "Frankenstein" },
      { name: "Hamnet" },
      { name: "Marty Supreme" },
      { name: "One Battle After Another" },
      { name: "The Secret Agent" },
      { name: "Sentimental Value" },
      { name: "Sinners" },
      { name: "Train Dreams" },
    ],
  },
  {
    slug: "actor-leading",
    name: "Actor in a Leading Role",
    sortOrder: 2,
    nominees: [
      { name: "Timothée Chalamet", detail: "Marty Supreme" },
      { name: "Leonardo DiCaprio", detail: "One Battle After Another" },
      { name: "Ethan Hawke", detail: "Blue Moon" },
      { name: "Michael B. Jordan", detail: "Sinners" },
      { name: "Wagner Moura", detail: "The Secret Agent" },
    ],
  },
  {
    slug: "actor-supporting",
    name: "Actor in a Supporting Role",
    sortOrder: 3,
    nominees: [
      { name: "Benicio Del Toro", detail: "One Battle After Another" },
      { name: "Jacob Elordi", detail: "Frankenstein" },
      { name: "Delroy Lindo", detail: "Sinners" },
      { name: "Sean Penn", detail: "One Battle After Another" },
      { name: "Stellan Skarsgård", detail: "Sentimental Value" },
    ],
  },
  {
    slug: "actress-leading",
    name: "Actress in a Leading Role",
    sortOrder: 4,
    nominees: [
      { name: "Jessie Buckley", detail: "Hamnet" },
      { name: "Rose Byrne", detail: "If I Had Legs I'd Kick You" },
      { name: "Kate Hudson", detail: "Song Sung Blue" },
      { name: "Renate Reinsve", detail: "Sentimental Value" },
      { name: "Emma Stone", detail: "Bugonia" },
    ],
  },
  {
    slug: "actress-supporting",
    name: "Actress in a Supporting Role",
    sortOrder: 5,
    nominees: [
      { name: "Elle Fanning", detail: "Sentimental Value" },
      { name: "Inga Ibsdotter Lilleaas", detail: "Sentimental Value" },
      { name: "Amy Madigan", detail: "Weapons" },
      { name: "Wunmi Mosaku", detail: "Sinners" },
      { name: "Teyana Taylor", detail: "One Battle After Another" },
    ],
  },
  {
    slug: "animated-feature",
    name: "Animated Feature Film",
    sortOrder: 6,
    nominees: [
      { name: "Arco" },
      { name: "Elio" },
      { name: "KPOP Demon Hunters" },
      { name: "Little Amélie or the Character of Rain" },
      { name: "Zootopia 2" },
    ],
  },
  {
    slug: "animated-short",
    name: "Animated Short Film",
    sortOrder: 7,
    nominees: [
      { name: "Butterfly" },
      { name: "Forevergreen" },
      { name: "The Girl Who Cried Pearls" },
      { name: "Retirement Plan" },
      { name: "The Three Sisters" },
    ],
  },
  {
    slug: "casting",
    name: "Casting",
    sortOrder: 8,
    nominees: [
      { name: "Hamnet", detail: "Nina Gold" },
      { name: "Marty Supreme", detail: "Jennifer Venditti" },
      { name: "One Battle After Another", detail: "Cassandra Kulukundis" },
      { name: "The Secret Agent", detail: "Gabriel Domingues" },
      { name: "Sinners", detail: "Francine Maisler" },
    ],
  },
  {
    slug: "cinematography",
    name: "Cinematography",
    sortOrder: 9,
    nominees: [
      { name: "Frankenstein", detail: "Dan Laustsen" },
      { name: "Marty Supreme", detail: "Darius Khondji" },
      { name: "One Battle After Another", detail: "Michael Bauman" },
      { name: "Sinners", detail: "Autumn Durald Arkapaw" },
      { name: "Train Dreams", detail: "Adolpho Veloso" },
    ],
  },
  {
    slug: "costume-design",
    name: "Costume Design",
    sortOrder: 10,
    nominees: [
      { name: "Avatar: Fire and Ash", detail: "Deborah L. Scott" },
      { name: "Frankenstein", detail: "Kate Hawley" },
      { name: "Hamnet", detail: "Malgosia Turzanska" },
      { name: "Marty Supreme", detail: "Miyako Bellizzi" },
      { name: "Sinners", detail: "Ruth E. Carter" },
    ],
  },
  {
    slug: "directing",
    name: "Directing",
    sortOrder: 11,
    nominees: [
      { name: "Hamnet", detail: "Chloé Zhao" },
      { name: "Marty Supreme", detail: "Josh Safdie" },
      { name: "One Battle After Another", detail: "Paul Thomas Anderson" },
      { name: "Sentimental Value", detail: "Joachim Trier" },
      { name: "Sinners", detail: "Ryan Coogler" },
    ],
  },
  {
    slug: "documentary-feature",
    name: "Documentary Feature Film",
    sortOrder: 12,
    nominees: [
      { name: "The Alabama Solution" },
      { name: "Come See Me in the Good Light" },
      { name: "Cutting Through Rocks" },
      { name: "Mr. Nobody Against Putin" },
      { name: "The Perfect Neighbor" },
    ],
  },
  {
    slug: "documentary-short",
    name: "Documentary Short Film",
    sortOrder: 13,
    nominees: [
      { name: "All the Empty Rooms" },
      { name: "Armed Only with a Camera: The Life and Death of Brent Renaud" },
      { name: "Children No More: 'Were and Are Gone'" },
      { name: "The Devil Is Busy" },
      { name: "Perfectly a Strangeness" },
    ],
  },
  {
    slug: "film-editing",
    name: "Film Editing",
    sortOrder: 14,
    nominees: [
      { name: "F1", detail: "Stephen Mirrione" },
      { name: "Marty Supreme", detail: "Ronald Bronstein and Josh Safdie" },
      { name: "One Battle After Another", detail: "Andy Jurgensen" },
      { name: "Sentimental Value", detail: "Olivier Bugge Coutté" },
      { name: "Sinners", detail: "Michael P. Shawver" },
    ],
  },
  {
    slug: "international-feature",
    name: "International Feature Film",
    sortOrder: 15,
    nominees: [
      { name: "The Secret Agent", detail: "Brazil" },
      { name: "It Was Just an Accident", detail: "France" },
      { name: "Sentimental Value", detail: "Norway" },
      { name: "Sirāt", detail: "Spain" },
      { name: "The Voice of Hind Rajab", detail: "Tunisia" },
    ],
  },
  {
    slug: "live-action-short",
    name: "Live Action Short Film",
    sortOrder: 16,
    nominees: [
      { name: "Butcher's Stain" },
      { name: "A Friend of Dorothy" },
      { name: "Jane Austen's Period Drama" },
      { name: "The Singers" },
      { name: "Two People Exchanging Saliva" },
    ],
  },
  {
    slug: "makeup-hairstyling",
    name: "Makeup and Hairstyling",
    sortOrder: 17,
    nominees: [
      { name: "Frankenstein" },
      { name: "Kokuho" },
      { name: "Sinners" },
      { name: "The Smashing Machine" },
      { name: "The Ugly Stepsister" },
    ],
  },
  {
    slug: "original-score",
    name: "Music (Original Score)",
    sortOrder: 18,
    nominees: [
      { name: "Bugonia", detail: "Jerskin Fendrix" },
      { name: "Frankenstein", detail: "Alexandre Desplat" },
      { name: "Hamnet", detail: "Max Richter" },
      { name: "One Battle After Another", detail: "Jonny Greenwood" },
      { name: "Sinners", detail: "Ludwig Göransson" },
    ],
  },
  {
    slug: "original-song",
    name: "Music (Original Song)",
    sortOrder: 19,
    nominees: [
      { name: '"Dear Me"', detail: "Diane Warren: Relentless" },
      { name: '"Golden"', detail: "KPOP Demon Hunters" },
      { name: '"I Lied To You"', detail: "Sinners" },
      { name: '"Sweet Dreams Of Joy"', detail: "Viva Verdi!" },
      { name: '"Train Dreams"', detail: "Train Dreams" },
    ],
  },
  {
    slug: "production-design",
    name: "Production Design",
    sortOrder: 20,
    nominees: [
      { name: "Frankenstein", detail: "Tamara Deverell / Shane Vieau" },
      { name: "Hamnet", detail: "Fiona Crombie / Alice Felton" },
      { name: "Marty Supreme", detail: "Jack Fisk / Adam Willis" },
      { name: "One Battle After Another", detail: "Florencia Martin / Anthony Carlino" },
      { name: "Sinners", detail: "Hannah Beachler / Monique Champagne" },
    ],
  },
  {
    slug: "sound",
    name: "Sound",
    sortOrder: 21,
    nominees: [
      { name: "F1" },
      { name: "Frankenstein" },
      { name: "One Battle After Another" },
      { name: "Sinners" },
      { name: "Sirāt" },
    ],
  },
  {
    slug: "visual-effects",
    name: "Visual Effects",
    sortOrder: 22,
    nominees: [
      { name: "Avatar: Fire and Ash" },
      { name: "F1" },
      { name: "Jurassic World Rebirth" },
      { name: "The Lost Bus" },
      { name: "Sinners" },
    ],
  },
  {
    slug: "adapted-screenplay",
    name: "Writing (Adapted Screenplay)",
    sortOrder: 23,
    nominees: [
      { name: "Bugonia", detail: "Will Tracy" },
      { name: "Frankenstein", detail: "Guillermo del Toro" },
      { name: "Hamnet", detail: "Chloé Zhao & Maggie O'Farrell" },
      { name: "One Battle After Another", detail: "Paul Thomas Anderson" },
      { name: "Train Dreams", detail: "Clint Bentley & Greg Kwedar" },
    ],
  },
  {
    slug: "original-screenplay",
    name: "Writing (Original Screenplay)",
    sortOrder: 24,
    nominees: [
      { name: "Blue Moon", detail: "Robert Kaplow" },
      { name: "It Was Just an Accident", detail: "Jafar Panahi" },
      { name: "Marty Supreme", detail: "Ronald Bronstein & Josh Safdie" },
      { name: "Sentimental Value", detail: "Eskil Vogt, Joachim Trier" },
      { name: "Sinners", detail: "Ryan Coogler" },
    ],
  },
];

async function seed() {
  console.log("Seeding categories and nominees into Supabase...");

  for (const cat of NOMINEES_DATA) {
    // Upsert category
    const { data: catData, error: catError } = await supabaseAdmin
      .from('oscar_categories')
      .upsert(
        { slug: cat.slug, name: cat.name, sortOrder: cat.sortOrder },
        { onConflict: 'slug' }
      )
      .select('id')
      .single();

    if (catError) {
      console.error(`Error upserting category "${cat.name}":`, catError.message);
      continue;
    }

    const categoryId = catData.id;

    // Upsert nominees
    for (let i = 0; i < cat.nominees.length; i++) {
      const n = cat.nominees[i];
      const { error: nomError } = await supabaseAdmin
        .from('oscar_nominees')
        .upsert(
          {
            categoryId,
            name: n.name,
            detail: n.detail ?? null,
            sortOrder: i,
          },
          { onConflict: 'categoryId,name' }
        );

      if (nomError) {
        console.error(`  Error upserting nominee "${n.name}":`, nomError.message);
      }
    }

    console.log(`  ✓ ${cat.name} (${cat.nominees.length} nominees)`);
  }

  // Create default pool_settings row if it doesn't exist
  const { data: existing } = await supabaseAdmin
    .from('pool_settings')
    .select('id')
    .limit(1)
    .single();

  if (!existing) {
    const { error: settingsError } = await supabaseAdmin
      .from('pool_settings')
      .insert({
        votingOpen: true,
        ceremonyDate: '2026-03-15T00:00:00Z',
      });

    if (settingsError) {
      console.error('Error creating pool_settings:', settingsError.message);
    } else {
      console.log('  ✓ Default pool_settings created');
    }
  } else {
    console.log('  ✓ pool_settings already exists');
  }

  console.log("Seed complete!");
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
