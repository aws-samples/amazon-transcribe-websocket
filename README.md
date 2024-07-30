## Amazon Transcribe Websocket Static

Whether you're building a live captioning system, a voice-controlled interface, or a meeting transcription tool, the ability to convert speech to text in real-time can significantly improve your application's functionality. We created a sample static website to showcase how to leverage Amazon Transcribe's WebSocket API to create a real-time transcription service using Node.js 

This demo app uses browser microphone input and client-side JavaScript to demonstrate the real-time streaming audio transcription capability of [Amazon Transcribe](https://aws.amazon.com/transcribe/) using WebSockets.

Check out the [Amazon Transcribe WebSocket docs](https://docs.aws.amazon.com/transcribe/latest/dg/websocket.html).

## Setup

There is a new permission required to use streaming transcription, StartStreamTranscription. You can use a policy like this:

```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "transcribestreaming",
            "Effect": "Allow",
            "Action": "transcribe:StartStreamTranscription",
            "Resource": "*"
        }
    ]
}
```

Before running the application, ensure your AWS credentials are properly configured. You can set environment variables: 

```
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=your_region
```

## Building and Deploying

Even though this is a static site consisting only of HTML, CSS, and client-side JavaScript, there is a build step required. Some of the modules used were originally made for server-side code and do not work natively in the browser.

1. Clone the repo
2. run `npm init -y`
3. run `npm install express socket.io @aws-sdk/client-transcribe-streaming`

Once you have installed the neccessary libraries, all you need is a webserver. For example, from your project directory: 

```
node server.js
```

## License

This library is licensed under the MIT-0 License. 