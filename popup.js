// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const analyzeSentimentButton = document.getElementById('analyzeSentimentButton');
    const analyzeLeaningButton = document.getElementById('analyzeLeaningButton');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const sentimentResult = document.getElementById('sentimentResult');
    const leaningResult = document.getElementById('leaningResult');
    const errorMessage = document.getElementById('errorMessage');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const saveApiKeyButton = document.getElementById('saveApiKeyButton');
    const apiKeyStatus = document.getElementById('apiKeyStatus');

    // Function to show a message in the popup for a specific result area
    function showResult(element, message, type = 'default') {
        // Clear specific element text and hide it initially
        element.textContent = '';
        element.classList.add('hidden');

        // Clear general error message
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');

        if (type === 'sentiment') {
            element.textContent = message;
            element.classList.remove('text-green', 'text-red', 'text-blue', 'text-gray'); // Clear all previous classes
            if (message === 'Positive') {
                element.classList.add('text-green');
            } else if (message === 'Negative') {
                element.classList.add('text-red');
            } else {
                element.classList.add('text-gray'); // Neutral
            }
        } else if (type === 'leaning') {
            element.textContent = message;
            element.classList.remove('text-green', 'text-red', 'text-blue', 'text-gray'); // Clear all previous classes
            if (message === 'Right-leaning') {
                element.classList.add('text-red');
            } else if (message === 'Left-leaning') {
                element.classList.add('text-blue');
            } else {
                element.classList.add('text-gray'); // Unbiased
            }
        } else if (type === 'error') {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
            // When an error occurs, ensure both result fields are cleared and hidden
            sentimentResult.textContent = '';
            sentimentResult.classList.add('hidden');
            leaningResult.textContent = '';
            leaningResult.classList.add('hidden');
        }
        // Only show the element if it's not an error type (as error uses errorMessage)
        if (type !== 'error') {
            element.classList.remove('hidden');
        }
    }

    // Load API key from storage when popup opens
    chrome.storage.local.get(['openRouterApiKey'], function(result) {
        if (result.openRouterApiKey) {
            apiKeyInput.value = result.openRouterApiKey;
            apiKeyStatus.textContent = "API Key loaded.";
            apiKeyStatus.style.color = '#22c55e'; // Green
        } else {
            apiKeyStatus.textContent = "No API Key saved.";
            apiKeyStatus.style.color = '#ef4444'; // Red
        }
    });

    // Save API key to storage when save button is clicked
    saveApiKeyButton.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            chrome.storage.local.set({ 'openRouterApiKey': key }, function() {
                apiKeyStatus.textContent = "API Key saved successfully!";
                apiKeyStatus.style.color = '#22c55e'; // Green
            });
        } else {
            apiKeyStatus.textContent = "Please enter an API Key.";
            apiKeyStatus.style.color = '#ef4444'; // Red
        }
    });

    // Function to handle the analysis process
    async function performAnalysis(actionType) {
        const openRouterApiKey = apiKeyInput.value.trim();

        if (!openRouterApiKey) {
            showResult(errorMessage, 'Please enter and save your OpenRouter API Key first.', 'error');
            return;
        }

        // Clear ALL previous results and errors, and show loading
        sentimentResult.textContent = '';
        sentimentResult.classList.add('hidden');
        leaningResult.textContent = '';
        leaningResult.classList.add('hidden');
        errorMessage.textContent = '';
        errorMessage.classList.add('hidden');
        loadingIndicator.classList.remove('hidden');

        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

            if (!tab || !tab.id) {
                showResult(errorMessage, 'Could not get active tab information.', 'error');
                return;
            }

            const response = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                function: () => document.body.innerText
            });

            if (!response || !response[0] || !response[0].result) {
                showResult(errorMessage, 'Failed to extract text from the webpage.', 'error');
                return;
            }

            const webpageText = response[0].result;

            if (webpageText.trim().length === 0) {
                showResult(errorMessage, 'No substantial text found on this page to analyze.', 'error');
                return;
            }

            // Send message to background script
            chrome.runtime.sendMessage({
                action: actionType, // 'analyzeSentiment' or 'analyzeLeaning'
                text: webpageText,
                apiKey: openRouterApiKey
            }, (response) => {
                loadingIndicator.classList.add('hidden');

                if (chrome.runtime.lastError) {
                    showResult(errorMessage, `Error: ${chrome.runtime.lastError.message}`, 'error');
                    return;
                }

                if (response && response.sentiment) {
                    showResult(sentimentResult, response.sentiment, 'sentiment');
                } else if (response && response.leaning) {
                    showResult(leaningResult, response.leaning, 'leaning');
                } else if (response && response.error) {
                    showResult(errorMessage, `Error: ${response.error}`, 'error');
                } else {
                    showResult(errorMessage, 'Unknown error during analysis.', 'error');
                }
            });

        } catch (error) {
            loadingIndicator.classList.add('hidden');
            showResult(errorMessage, `An unexpected error occurred: ${error.message}`, 'error');
            console.error('Error in popup.js:', error);
        }
    }

    // Event listeners for both buttons
    analyzeSentimentButton.addEventListener('click', () => performAnalysis('analyzeSentiment'));
    analyzeLeaningButton.addEventListener('click', () => performAnalysis('analyzeLeaning'));
});
