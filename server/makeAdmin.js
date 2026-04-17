const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || "mongodb://brajdeepsingh8172_db_user:Brajdeep123@ac-cpxjolr-shard-00-00.caxhweh.mongodb.net:27017,ac-cpxjolr-shard-00-01.caxhweh.mongodb.net:27017,ac-cpxjolr-shard-00-02.caxhweh.mongodb.net:27017/eventplatform?ssl=true&replicaSet=atlas-u0780e-shard-0&authSource=admin&appName=Cluster0";

const makeAdmin = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to DB');
    
    const res = await User.updateOne(
      { email: 'brajdeepsingh8172@gmail.com' },
      { $set: { role: 'admin' } }
    );
    
    
    console.log(`Updated user:`, res);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
};

makeAdmin();
