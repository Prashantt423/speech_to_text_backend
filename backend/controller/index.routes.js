const express = require("express");
const router = express.Router();
const axios = require("axios");
const multer = require("multer");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const fs = require("fs");
const FormData = require("form-data");
const dotenv = require("dotenv");
const { Readable } = require("stream");
// Set your OpenAI API key here
dotenv.config({ path: "./.env" });
const apiKey = process.env.OPENAI_API_KEY;
console.log(apiKey);

const upload = multer();
const Output = require("../model/output");
const bufferToStream = (buffer) => {
  return Readable.from(buffer);
};

async function extractAudioFromVideo(videoURL) {
  return new Promise((resolve, reject) => {
    // Use FFmpeg to extract audio from the video
    ffmpeg()
      .input(videoURL)
      .outputFormat("mp3")
      .toFormat("mp3")
      .on("end", () => {
        resolve(
          axios.get(videoURL + ".mp3", {
            responseType: "stream",
          })
        );
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

router.post("/transcribe", async (req, res, next) => {
  try {
    const firebaseStorageURL = req.body.firebaseStorageURL;
    console.log(firebaseStorageURL);
    let audioStream;
    if (firebaseStorageURL.endsWith("mp4")) {
      // It's a video, extract audio using FFmpeg
      audioStream = await extractAudioFromVideo(firebaseStorageURL);
    } else {
      audioStream = await axios.get(firebaseStorageURL, {
        responseType: "stream",
      });
    }

    const formData = new FormData();
    formData.append("file", audioStream.data, {
      filename: "audio.mp3",
      contentType: "audio/mp3",
    });
    formData.append("model", "whisper-1");
    formData.append("response_format", "json");

    const config = {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    };

    // Call the OpenAI Whisper API to transcribe the audio
    const response = await axios.post(
      "https://api.openai.com/v1/audio/transcriptions",
      formData,
      config
    );

    if (response.status !== 200) {
      // Handle the error response here if needed
      throw new Error(`OpenAI API returned status code: ${response.status}`);
    }

    const transcription = response.data.text;
    const newOutput = await Output.create({
      name: "audio.mp3", // Replace with the actual file name
      type: "audio/mp3", // Replace with the actual content type
      dateCreated: new Date(),
      lastUpdated: new Date(),
      transcription: transcription,
      url: firebaseStorageURL,
    });

    console.log(newOutput);
    res.json(newOutput.transcription);
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    res.status(200).json(await Output.find());
  } catch (e) {
    next(e);
  }
});

module.exports = router;
