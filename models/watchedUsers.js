const { Schema, model } = require('mongoose');

// Define Schema

const watchedSchema = new Schema({
	guildId: { type: String, required: true },
	userId: { type: String, required: true },
	lastInteraction: { type: Date, required: true },
	lastAction: { type: String, required: true },
});

// Export Model
module.exports = model('watchedUsers', watchedSchema);
