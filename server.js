const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const { TranscribeStreamingClient, StartStreamTranscriptionCommand } = require("@aws-sdk/client-transcribe-streaming");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const transcribeClient = new TranscribeStreamingClient({
    region: "us-west-2", // Ensure this matches your AWS region
});

io.on('connection', (socket) => {
    console.log('A user connected');

    let audioStream;
    let lastTranscript = '';
    let isTranscribing = false;

    socket.on('startTranscription', async () => {
        console.log('Starting transcription');
        isTranscribing = true;
        let buffer = Buffer.from('');

        audioStream = async function* () {
            while (isTranscribing) {
                const chunk = await new Promise(resolve => socket.once('audioData', resolve));
                if (chunk === null) break;
                buffer = Buffer.concat([buffer, Buffer.from(chunk)]);
                console.log('Received audio chunk, buffer size:', buffer.length);

                while (buffer.length >= 1024) {
                    yield { AudioEvent: { AudioChunk: buffer.slice(0, 1024) } };
                    buffer = buffer.slice(1024);
                }
            }
        };

        const command = new StartStreamTranscriptionCommand({
            LanguageCode: "en-US",
            MediaSampleRateHertz: 44100,
            MediaEncoding: "pcm",
            AudioStream: audioStream()
        });

        try {
            console.log('Sending command to AWS Transcribe');
            const response = await transcribeClient.send(command);
            console.log('Received response from AWS Transcribe');
            
            for await (const event of response.TranscriptResultStream) {
                if (!isTranscribing) break;
                if (event.TranscriptEvent) {
                    console.log('Received TranscriptEvent:', JSON.stringify(event.TranscriptEvent));
                    const results = event.TranscriptEvent.Transcript.Results;
                    if (results.length > 0 && results[0].Alternatives.length > 0) {
                        const transcript = results[0].Alternatives[0].Transcript;
                        const isFinal = !results[0].IsPartial;

                        if (isFinal) {
                            console.log('Emitting final transcription:', transcript);
                            socket.emit('transcription', { text: transcript, isFinal: true });
                            lastTranscript = transcript;
                        } else {
                            const newPart = transcript.substring(lastTranscript.length);
                            if (newPart.trim() !== '') {
                                console.log('Emitting partial transcription:', newPart);
                                socket.emit('transcription', { text: newPart, isFinal: false });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Transcription error:", error);
            socket.emit('error', 'Transcription error occurred: ' + error.message);
        }
    });

    socket.on('audioData', (data) => {
        if (isTranscribing) {
            console.log('Received audioData event, data size:', data.byteLength);
            socket.emit('audioData', data);
        }
    });

    socket.on('stopTranscription', () => {
        console.log('Stopping transcription');
        isTranscribing = false;
        audioStream = null;
        lastTranscript = '';
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        isTranscribing = false;
        audioStream = null;
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});