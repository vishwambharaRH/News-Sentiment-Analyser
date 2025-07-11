// background.js
// This is the service worker for the extension. It runs in the background.

// Listen for messages from the popup script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background: Received request:', request.action, 'from sender:', sender.tab ? sender.tab.url : 'unknown'); // Log the action and sender
    const webpageText = request.text;
    const openRouterApiKey = request.apiKey;

    if (!openRouterApiKey) {
        console.error('Background: OpenRouter API Key is missing.'); // Log missing API key
        sendResponse({ error: "OpenRouter API Key is missing. Please set it in the extension popup." });
        return false;
    }

    if (request.action === 'analyzeSentiment') {
        console.log('Background: Initiating sentiment analysis.'); // Log sentiment analysis start
        analyzeSentimentWithOpenRouter(webpageText, openRouterApiKey)
            .then(sentiment => {
                console.log('Background: Sentiment analysis successful, result:', sentiment); // Log successful sentiment result
                sendResponse({ sentiment: sentiment });
            })
            .catch(error => {
                console.error('Background: Sentiment analysis failed with error:', error); // Log sentiment analysis error
                sendResponse({ error: error.message || 'Failed to analyze sentiment.' });
            });
        return true; // Indicate async response
    } else if (request.action === 'analyzeLeaning') {
        console.log('Background: Initiating news leaning analysis.'); // Log news leaning analysis start
        analyzeNewsLeaningWithOpenRouter(webpageText, openRouterApiKey)
            .then(leaning => {
                console.log('Background: News leaning analysis successful, result:', leaning); // Log successful leaning result
                sendResponse({ leaning: leaning });
            })
            .catch(error => {
                console.error('Background: News leaning analysis failed with error:', error); // Log news leaning analysis error
                sendResponse({ error: error.message || 'Failed to analyze news leaning.' });
            });
        return true; // Indicate async response
    }
});

/**
 * Calls OpenRouter's API to analyze the sentiment of the given text.
 * @param {string} text The text content from the webpage to analyze.
 * @param {string} openRouterApiKey The user's OpenRouter API key.
 * @returns {Promise<string>} A promise that resolves with "Positive", "Negative", or "Neutral" sentiment.
 */
async function analyzeSentimentWithOpenRouter(text, openRouterApiKey) {
    const model = "deepseek/deepseek-r1-0528-qwen3-8b:free"; // Good for general classification

    // Ensure text does not exceed typical LLM context window limits
    const truncatedText = text.substring(0, 5000); // Truncate text to avoid large payloads

    const prompt = `Analyze the sentiment of the following text and classify it as either "Positive", "Negative", or "Neutral". Provide only one of these words as your response.\n\nText: "${truncatedText}"`;

    const payload = {
        model: model,
        messages: [
            { role: "user", content: prompt }
        ]
    };

    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

    try {
        console.log('Background: Sending sentiment request to OpenRouter API.'); // Log API request initiation
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Background: OpenRouter API sentiment response not OK:', response.status, errorData); // Log non-OK API response
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        console.log('Background: Received sentiment API result:', result); // Log raw API result

        if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
            const sentiment = result.choices[0].message.content.trim();
            if (sentiment === 'Positive' || sentiment === 'Negative' || sentiment === 'Neutral') {
                return sentiment;
            } else {
                console.warn('Background: OpenRouter API returned unexpected sentiment format:', sentiment); // Warn about unexpected format
                return 'Neutral'; // Default to Neutral if unexpected
            }
        } else {
            console.error('Background: OpenRouter API sentiment response structure invalid:', result); // Log invalid structure
            throw new Error('OpenRouter API response structure is unexpected or content is missing.');
        }
    } catch (error) {
        console.error('Background: Error during sentiment API call:', error); // Log fetch/parsing error
        throw new Error(`Could not analyze sentiment: ${error.message}`);
    }
}

/**
 * Calls OpenRouter's API to analyze the political leaning of the given text.
 * @param {string} text The text content from the webpage to analyze.
 * @param {string} openRouterApiKey The user's OpenRouter API key.
 * @returns {Promise<string>} A promise that resolves with "Right-leaning", "Left-leaning", or "Unbiased".
 */
async function analyzeNewsLeaningWithOpenRouter(text, openRouterApiKey) {
    const model = "deepseek/deepseek-r1-0528-qwen3-8b:free"; // Good for nuanced classification

    // Ensure text does not exceed typical LLM context window limits
    const truncatedText = text.substring(0, 5000); // Truncate text to avoid large payloads

    const prompt = `Analyze the political leaning of the following news article text and classify it as either "Right-leaning", "Left-leaning", or "Unbiased". Provide only one of these words as your response.\n\nNews Article Text: "${truncatedText}"`;

    const payload = {
        model: model,
        messages: [
            { role: "user", content: prompt }
        ]
    };

    const apiUrl = "https://openrouter.ai/api/v1/chat/completions";

    try {
        console.log('Background: Sending news leaning request to OpenRouter API.'); // Log API request initiation
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openRouterApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Background: OpenRouter API news leaning response not OK:', response.status, errorData); // Log non-OK API response
            throw new Error(`OpenRouter API error: ${response.status} - ${errorData.message || response.statusText}`);
        }

        const result = await response.json();
        console.log('Background: Received news leaning API result:', result); // Log raw API result

        if (result.choices && result.choices.length > 0 && result.choices[0].message && result.choices[0].message.content) {
            const leaning = result.choices[0].message.content.trim();
            if (leaning === 'Right-leaning' || leaning === 'Left-leaning' || leaning === 'Unbiased') {
                return leaning;
            } else {
                console.warn('Background: OpenRouter API returned unexpected leaning format:', leaning); // Warn about unexpected format
                return 'Unbiased';
            }
        } else {
            console.error('Background: OpenRouter API news leaning response structure invalid:', result); // Log invalid structure
            throw new Error('OpenRouter API response structure is unexpected or content is missing.');
        }
    } catch (error) {
        console.error('Background: Error during news leaning API call:', error); // Log fetch/parsing error
        throw new Error(`Could not analyze news leaning: ${error.message}`);
    }
}
