import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('ayurveda.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS doshas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    elements TEXT,
    qualities TEXT,
    physical_traits TEXT,
    mental_traits TEXT,
    imbalance_signs TEXT,
    balancing_tips TEXT
  );

  CREATE TABLE IF NOT EXISTS herbs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    sanskrit_name TEXT,
    properties TEXT,
    rasa TEXT,
    virya TEXT,
    vipaka TEXT,
    benefits TEXT,
    contraindications TEXT
  );

  CREATE TABLE IF NOT EXISTS ailments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT,
    dosha_involved TEXT,
    ayurvedic_management TEXT,
    home_remedies TEXT
  );

  CREATE TABLE IF NOT EXISTS diagnostics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'Pulse', 'Tongue', 'Eyes', etc.
    observation TEXT,
    indication TEXT
  );
`);

// Seed data function
export function seedDatabase() {
  const doshaCount = db.prepare('SELECT count(*) as count FROM doshas').get() as { count: number };
  if (doshaCount.count === 0) {
    const insertDosha = db.prepare(`
      INSERT INTO doshas (name, elements, qualities, physical_traits, mental_traits, imbalance_signs, balancing_tips)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertDosha.run(
      'Vata', 
      'Space and Air', 
      'Dry, light, cold, rough, subtle, mobile, clear', 
      'Thin, light frame, dry skin, cold hands/feet', 
      'Creative, energetic, quick learner, prone to anxiety', 
      'Constipation, gas, dry skin, insomnia, anxiety, joint pain', 
      'Warm cooked foods, routine, oil massage (Abhyanga), grounding yoga'
    );

    insertDosha.run(
      'Pitta', 
      'Fire and Water', 
      'Hot, sharp, light, liquid, spreading, oily', 
      'Medium build, warm skin, reddish hair, strong digestion', 
      'Intelligent, focused, competitive, prone to anger', 
      'Acid reflux, inflammation, skin rashes, irritability, loose stools', 
      'Cooling foods, avoiding spicy/fried food, meditation, moonlit walks'
    );

    insertDosha.run(
      'Kapha', 
      'Earth and Water', 
      'Heavy, slow, cool, oily, smooth, dense, soft, stable, gross, cloudy', 
      'Large frame, thick skin, lustrous hair, slow metabolism', 
      'Calm, loving, patient, prone to lethargy/attachment', 
      'Weight gain, congestion, lethargy, depression, slow digestion', 
      'Light/dry/spicy foods, vigorous exercise, staying warm, variety in routine'
    );
  }

  const herbCount = db.prepare('SELECT count(*) as count FROM herbs').get() as { count: number };
  if (herbCount.count === 0) {
    const insertHerb = db.prepare(`
      INSERT INTO herbs (name, sanskrit_name, properties, rasa, virya, vipaka, benefits, contraindications)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertHerb.run(
      'Ashwagandha', 'Withania somnifera', 'Adaptogen, Rasayana', 'Bitter, Astringent, Sweet', 'Heating', 'Sweet', 
      'Reduces stress, improves sleep, boosts immunity, strengthens muscles', 'High Pitta, acute congestion'
    );

    insertHerb.run(
      'Turmeric', 'Curcuma longa', 'Anti-inflammatory, Antibacterial', 'Bitter, Astringent, Pungent', 'Heating', 'Pungent', 
      'Purifies blood, heals skin, improves digestion, supports joints', 'Pregnancy (in high doses), bile duct obstruction'
    );

    insertHerb.run(
      'Brahmi', 'Bacopa monnieri', 'Nervine, Medhya', 'Bitter, Astringent', 'Cooling', 'Sweet', 
      'Enhances memory, reduces anxiety, improves focus, cools the mind', 'Low heart rate'
    );
  }

  const ailmentCount = db.prepare('SELECT count(*) as count FROM ailments').get() as { count: number };
  if (ailmentCount.count === 0) {
    const insertAilment = db.prepare(`
      INSERT INTO ailments (name, description, dosha_involved, ayurvedic_management, home_remedies)
      VALUES (?, ?, ?, ?, ?)
    `);

    insertAilment.run(
      'Indigestion (Ajirna)', 'Weak digestive fire (Agni)', 'Vata, Pitta, or Kapha', 
      'Fasting, light diet, ginger tea, Deepana/Pachana herbs', 'Ginger and lemon juice before meals'
    );

    insertAilment.run(
      'Insomnia (Anidra)', 'Difficulty sleeping', 'Vata', 
      'Oil massage, warm milk with nutmeg, grounding routine', 'Warm milk with a pinch of nutmeg before bed'
    );
  }

  const diagnosticCount = db.prepare('SELECT count(*) as count FROM diagnostics').get() as { count: number };
  if (diagnosticCount.count === 0) {
    const insertDiag = db.prepare(`
      INSERT INTO diagnostics (type, observation, indication)
      VALUES (?, ?, ?)
    `);

    insertDiag.run('Tongue', 'Thick white coating', 'High Ama (toxins) and Kapha imbalance');
    insertDiag.run('Tongue', 'Red edges', 'Pitta imbalance or inflammation');
    insertDiag.run('Pulse', 'Snake-like (Vakra)', 'Vata dominance');
    insertDiag.run('Pulse', 'Frog-like (Manduka)', 'Pitta dominance');
    insertDiag.run('Pulse', 'Swan-like (Hamsa)', 'Kapha dominance');
  }
}

export default db;
