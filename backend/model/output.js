const mongoose = require("mongoose");

const outputSchema = new mongoose.Schema({
  name: {
    type: String,
    require: true,
  },
  type: String,
  dateCreated: Date,
  lastUpdated: Date,
  duration: String,
  transcription: String,
  url: String,
});

module.exports = mongoose.model("Output", outputSchema);
