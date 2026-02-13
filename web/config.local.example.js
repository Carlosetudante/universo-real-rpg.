// Copy to `config.local.js` and fill with your local key.
(function () {
  window.OracleConfig = window.OracleConfig || {};
  Object.assign(window.OracleConfig, {
    useLLM: true,
    llmProvider: 'rapidapi_chatbot',
    llmModel: 'MiniMax-M1',
    minimaxBaseUrl: 'https://api.minimax.io/v1',
    minimaxApiKey: 'PUT_YOUR_MINIMAX_KEY_HERE',
    rapidapiEndpoint: 'https://chatgpt-ai-chat-bot.p.rapidapi.com/ask',
    rapidapiHost: 'chatgpt-ai-chat-bot.p.rapidapi.com',
    rapidapiKey: 'PUT_YOUR_RAPIDAPI_KEY_HERE',
    iaRapidapiEndpoint: 'https://adult-gpt.p.rapidapi.com/adultgpt',
    iaRapidapiHost: 'adult-gpt.p.rapidapi.com',
    rapidapiAdultGenre: 'ai-gay-1',
    rapidapiTemperature: 0.9,
    rapidapiTopK: 10,
    rapidapiTopP: 0.9,
    rapidapiMaxTokens: 200
  });
})();
