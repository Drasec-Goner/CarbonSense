const mongoose = require('mongoose');
const dotenv = require('dotenv');
const StateProgram = require('./models/StateProgram');
const stateProgramsData = require('./data/statePrograms.json');

dotenv.config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await StateProgram.deleteMany({});
    console.log('Cleared existing data');

    for (const [stateName, data] of Object.entries(stateProgramsData)) {
      await StateProgram.create({
        state: stateName,
        programs: data.programs,
        suggestions: data.suggestions,
      });
    }

    console.log('Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
