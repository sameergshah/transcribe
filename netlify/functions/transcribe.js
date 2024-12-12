const axios = require('axios');
const ytDlp = require('yt-dlp');
const fs = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
  const { youtubeUrl, apiKey } = JSON.parse(event.body);

  if (!youtubeUrl || !apiKey) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'YouTube URL and API Key are required.' }),
    };
  }

  try {
    // Download the video using yt-dlp
    const videoPath = path.join(__dirname, 'video.mp3');
    await ytDlp.downloadVideo(youtubeUrl, {
      extractAudio: true,
      audioFormat: 'mp3',
      output: videoPath,
    });

    // Send the audio file to Whisper API for transcription
    const formData = new FormData();
    formData.append('file', fs.createReadStream(videoPath));

    const transcriptionResponse = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'multipart/form-data',
      },
    });

    const transcription = transcriptionResponse.data.text;

    // Return the transcription as plain text
    return {
      statusCode: 200,
      body: JSON.stringify({ transcription }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error processing the video.' }),
    };
  }
};
