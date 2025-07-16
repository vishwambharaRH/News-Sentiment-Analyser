# News Sentiment Analyzer
## Introduction
This extension uses a call to a free model (here deepseek/deepseek-r1-0528-qwen3-8b:free) on OpenRouter to show the webpage leaning and sentiment.
Sentiment varies at times, however on the tested webpages, the general public perception of the website held.
A few sites that were tested include Fox News, NBC, CNN and BBC.

## Further Iterations
Further updates will include the classification of propaganda and a custom-generated bias score for such webpages.
Another page will be published about the overall bias scores of major news corporations around the world.
A more permanent setup will be created for permanent API key storage, or till you want to change it.

## How to Use
To use the extension, `git pull` this repository onto your system.
Open your Chromium browser, go to chrome://extensions and enable developer mode (for now).
Click 'Load Unpacked' and select this folder.
Ensure all service workers are working properly.
Create your own account on OpenRouter and get an API key that you can insert into the extension.

### Advisory: the free version of the OpenRouter API is limited to 30 calls per hour.
