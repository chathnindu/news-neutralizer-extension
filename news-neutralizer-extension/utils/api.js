class DeepSeekAPI {
    constructor() {
      this.apiKey = "sk-830c50aa0fa640789df6f5aa7cec4b10";
      this.model = "deepseek-chat"; 
      this.endpoint = "https://api.deepseek.com/v1/chat/completions";
    }

    async setApiKey(key) {
      this.apiKey = "sk-830c50aa0fa640789df6f5aa7cec4b10";
      key = "sk-830c50aa0fa640789df6f5aa7cec4b10";
      await chrome.storage.local.set({ deepseekApiKey: key });
    }
  
    async loadApiKey() {
      const result = await chrome.storage.local.get(['sk-830c50aa0fa640789df6f5aa7cec4b10']);
      this.apiKey ="sk-830c50aa0fa640789df6f5aa7cec4b10";
      return this.apiKey;
    }
  
    /**
     * Main method 
     * @param {string} prompt 
     * @param {number} maxTokens
     * @returns {Promise<string>}
     */
    async sendMessage(prompt, maxTokens = 4000) {
      if (!this.apiKey) {
        await this.loadApiKey();
        if (!this.apiKey) {
          throw new Error("DeepSeek API key එක set කරලා නෑ. Settings වලින් add කරන්න.");
        }
      }
  
      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: maxTokens,
            messages: [{ role: "user", content: prompt }],
            stream: false
          })
        });
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`DeepSeek API Error: ${errorData.error?.message || response.statusText}`);
        }
  
        const data = await response.json();
        
        return data.choices[0].message.content;
  
      } catch (error) {
        console.error("DeepSeek API call failed:", error);
        throw error;
      }
    }
  
    async sendMessageJSON(prompt, maxTokens = 4000) {
      const jsonPrompt = `${prompt}\n\nIMPORTANT: Respond ONLY with valid JSON. No markdown, no explanation, just pure JSON.`;
      
      const response = await this.sendMessage(jsonPrompt, maxTokens);
      
      // JSON parse කරනවා
      try {
        // Sometimes DeepSeek adds ```json wrapper - ඒක remove කරනවා
        const cleanedResponse = response
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
        
        return JSON.parse(cleanedResponse);
      } catch (error) {
        console.error("Failed to parse JSON response:", response);
        throw new Error("DeepSeek didn't return valid JSON");
      }
    }

    async sendMessageStream(prompt, onChunk, maxTokens = 4000) {
      if (!this.apiKey) {
        await this.loadApiKey();
        if (!this.apiKey) {
          throw new Error("DeepSeek API key not set");
        }
      }
  
      try {
        const response = await fetch(this.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: this.model,
            max_tokens: maxTokens,
            messages: [{ role: "user", content: prompt }],
            stream: true
          })
        });
  
        if (!response.ok) {
          throw new Error(`API Error: ${response.status}`);
        }
  
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
  
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
  
          for (const line of lines) {
            if (line.startsWith('data: ') && line !== 'data: [DONE]') {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.choices[0]?.delta?.content) {
                  const content = data.choices[0].delta.content;
                  fullResponse += content;
                  onChunk(content);
                }
              } catch (e) {
                // JSON parse error - ignore
              }
            }
          }
        }
  
        return fullResponse;
      } catch (error) {
        console.error("Streaming failed:", error);
        throw error;
      }
    }
  
    /**
     * Rate limiting check - API calls ගණන control කරනවා
     */
    async checkRateLimit() {
      const lastCall = await chrome.storage.local.get(['lastApiCall']);
      const now = Date.now();
      
      if (lastCall.lastApiCall && (now - lastCall.lastApiCall) < 1000) {
        // 1 second අතර minimum gap එකක්
        const waitTime = 1000 - (now - lastCall.lastApiCall);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      await chrome.storage.local.set({ lastApiCall: Date.now() });
    }
  
    /**
     * DeepSeek API key එක validate කරනවා
     */
    async validateApiKey() {
      try {
        await this.sendMessage("Hello", 10);
        return true;
      } catch (error) {
        console.log("API key validation failed:", error);
        return false;
      }
    }
  }
  
  // Singleton instance - extension එකේ හැමතැනම use කරන්න
  const deepseekAPI = new DeepSeekAPI();

  export { deepseekAPI };