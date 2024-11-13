(function () {
  // Add marked library
  const markedScript = document.createElement("script");
  markedScript.src = "https://cdn.jsdelivr.net/npm/marked/marked.min.js";
  document.head.appendChild(markedScript);

  // Configure marked options when it's loaded
  markedScript.onload = () => {
    marked.setOptions({
      breaks: true,
      sanitize: false, // We need this false to allow links
      gfm: true,
    });
  };

  // Styles for the widget
  const styles = `
    .ai-chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }

    .ai-chat-button {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      background-color: #3182ce;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;
    }

    .ai-chat-button svg {
      width: 20px;
      height: 20px;
    }

    .ai-chat-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: #1A202C;
      display: none;
      flex-direction: column;
      overflow: hidden;
      position: fixed;
      padding-bottom: env(safe-area-inset-bottom, 20px);
    }

    @media (min-width: 640px) {
      .ai-chat-container {
        position: fixed;
        top: auto;
        left: auto;
        bottom: 100px;
        right: 20px;
        width: 380px;
        height: 600px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      }

      .ai-chat-button {
        width: 60px;
        height: 60px;
      }

      .ai-chat-button svg {
        width: 24px;
        height: 24px;
      }
    }

    .ai-chat-header {
      padding: 16px;
      background-color: #2D3748;
      color: white;
      display: flex;
      align-items: center;
      justify-content: space-between;
      -webkit-user-select: none;
      user-select: none;
    }

    .ai-chat-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 24px;
      padding: 8px;
      margin: -8px;
    }

    .ai-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      padding-bottom: 80px;
      -webkit-overflow-scrolling: touch;
    }

    .ai-chat-input-container {
      padding: 12px 16px;
      border-top: 1px solid #2D3748;
      display: flex;
      gap: 8px;
      background-color: #1A202C;
      position: sticky;
      bottom: 0;
      padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
    }

    .ai-chat-input {
      flex: 1;
      padding: 12px;
      border-radius: 20px;
      border: 1px solid #2D3748;
      background-color: #2D3748;
      color: #fff;
      font-size: 16px;
    }

    .ai-chat-send {
      padding: 8px 16px;
      background-color: #3182ce;
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-weight: 500;
    }

    .ai-message {
      margin-bottom: 16px;
      display: flex;
      gap: 8px;
    }

    .ai-message-content {
      max-width: 85%;
      padding: 12px 16px;
      border-radius: 16px;
      color: white;
      font-size: 15px;
      line-height: 1.5;
    }

    .ai-message-content a {
      color: #63B3ED;
      text-decoration: none;
      word-break: break-all;
    }

    .ai-message-content a:hover {
      text-decoration: underline;
    }

    @media (min-width: 640px) {
      .ai-message-content {
        max-width: 70%;
      }
    }

    .ai-message.bot .ai-message-content {
      background-color: #2D3748;
      border-top-left-radius: 4px;
    }

    .ai-message.user {
      flex-direction: row-reverse;
    }

    .ai-message.user .ai-message-content {
      background-color: #3182ce;
      border-top-right-radius: 4px;
    }

    .ai-chat-actions {
      padding: 8px 16px;
      background-color: #2D3748;
      display: flex;
      justify-content: flex-end;
    }

    .ai-chat-clear-history {
      background: none;
      border: 1px solid #4A5568;
      color: #A0AEC0;
      padding: 6px 12px;
      border-radius: 16px;
      cursor: pointer;
      font-size: 13px;
    }

    .ai-chat-clear-history:hover {
      background-color: #4A5568;
      color: white;
    }

    /* Fix iOS input styles */
    .ai-chat-input {
      -webkit-appearance: none;
      appearance: none;
    }

    /* Prevent body scroll when chat is open */
    body.ai-chat-open {
      overflow: hidden;
      position: fixed;
      width: 100%;
    }
  `;

  class AIChatWidget {
    constructor(config) {
      this.config = config;
      this.messages = this.loadChatHistory();
      this.initialize();
    }

    initialize() {
      // Add styles
      const styleSheet = document.createElement("style");
      styleSheet.textContent = styles + this.getMarkdownStyles();
      document.head.appendChild(styleSheet);

      // Create widget elements
      this.createWidgetElements();
      this.attachEventListeners();

      // Load existing messages
      this.messages.forEach((message) => {
        const messageDiv = document.createElement("div");
        messageDiv.className = `ai-message ${message.isBot ? "bot" : "user"}`;

        if (message.isBot && window.marked) {
          messageDiv.innerHTML = `
            <div class="ai-message-content">
              ${marked.parse(message.content)}
            </div>
          `;
        } else {
          messageDiv.innerHTML = `
            <div class="ai-message-content">
              ${message.content}
            </div>
          `;
        }

        this.messagesContainer.appendChild(messageDiv);
      });
    }

    createWidgetElements() {
      // Main container
      this.widget = document.createElement("div");
      this.widget.className = "ai-chat-widget";

      // Chat button
      this.button = document.createElement("button");
      this.button.className = "ai-chat-button";
      this.button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
      `;

      // Chat container
      this.container = document.createElement("div");
      this.container.className = "ai-chat-container";
      this.container.innerHTML = `
        <div class="ai-chat-header">
          <span>Chat</span>
          <button class="ai-chat-close">×</button>
        </div>
        <div class="ai-chat-actions">
          <button class="ai-chat-clear-history">Limpar</button>
        </div>
        <div class="ai-chat-messages"></div>
        <div class="ai-chat-input-container">
          <input type="text" class="ai-chat-input" placeholder="Digite sua mensagem...">
          <button class="ai-chat-send">Enviar</button>
        </div>
      `;

      this.widget.appendChild(this.container);
      this.widget.appendChild(this.button);
      document.body.appendChild(this.widget);

      // Store references to elements
      this.messagesContainer =
        this.container.querySelector(".ai-chat-messages");
      this.input = this.container.querySelector(".ai-chat-input");
      this.sendButton = this.container.querySelector(".ai-chat-send");
      this.closeButton = this.container.querySelector(".ai-chat-close");
      this.clearHistoryButton = this.container.querySelector(
        ".ai-chat-clear-history"
      );
    }

    attachEventListeners() {
      this.button.addEventListener("click", () => this.toggleChat());
      this.closeButton.addEventListener("click", () => this.toggleChat());
      this.sendButton.addEventListener("click", () => this.sendMessage());
      this.input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.sendMessage();
      });
      this.clearHistoryButton.addEventListener("click", () =>
        this.clearChatHistory()
      );
    }

    toggleChat() {
      const isOpening =
        this.container.style.display === "none" ||
        this.container.style.display === "";

      this.container.style.display = isOpening ? "flex" : "none";

      // Toggle body scroll lock
      if (isOpening) {
        document.body.classList.add("ai-chat-open");
      } else {
        document.body.classList.remove("ai-chat-open");
      }
    }

    async sendMessage() {
      const message = this.input.value.trim();
      if (!message) return;

      // Add user message to chat
      this.addMessage(message, false);
      this.input.value = "";

      try {
        const response = await this.callAPI(message);
        this.addMessage(response, true);
      } catch (error) {
        console.error("Error sending message:", error);
        this.addMessage(
          "Desculpe, ocorreu um erro ao processar sua mensagem.",
          true
        );
      }
    }

    addMessage(content, isBot) {
      const messageDiv = document.createElement("div");
      messageDiv.className = `ai-message ${isBot ? "bot" : "user"}`;

      if (isBot && window.marked) {
        // Create a wrapper for the content
        const wrapper = document.createElement("div");
        wrapper.className = "ai-message-content";

        // Convert URLs to markdown links and then parse markdown
        const contentWithLinks = this.urlify(content);
        wrapper.innerHTML = marked.parse(contentWithLinks);

        // Make links open in new tab and add security attributes
        wrapper.querySelectorAll("a").forEach((link) => {
          link.setAttribute("target", "_blank");
          link.setAttribute("rel", "noopener noreferrer");
        });

        messageDiv.appendChild(wrapper);
      } else {
        messageDiv.innerHTML = `
          <div class="ai-message-content">
            ${content}
          </div>
        `;
      }

      this.messagesContainer.appendChild(messageDiv);
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;

      // Save message to history
      this.messages.push({ content, isBot });
      this.saveChatHistory();
    }

    async getContext(question) {
      try {
        const response = await fetch(
          `${this.config.apiUrl}/search?indexName=agent-${
            this.config.agentId
          }&searchText=${encodeURIComponent(question)}`
        );

        const responseData = await response.json();

        const data = responseData.data || responseData.results || responseData;

        if (!Array.isArray(data)) {
          console.warn("Data is not an array:", data);
          return "";
        }

        return data
          .filter((item) => {
            return item?.document?.content;
          })
          .map((item) => item.document.content)
          .filter(Boolean)
          .join(";");
      } catch (error) {
        console.error("Error getting context:", error);
        return "";
      }
    }

    async callAPI(message) {
      // Get context before sending message
      const context = await this.getContext(message);

      const response = await fetch(`${this.config.apiUrl}/ai/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId: this.config.companyId,
          agentId: this.config.agentId,
          question: message,
          additionalContext: context || "",
        }),
      });

      const data = await response.json();
      return data.response;
    }

    loadChatHistory() {
      const history = localStorage.getItem(
        `chat-history-${this.config.agentId}`
      );
      return history ? JSON.parse(history) : [];
    }

    saveChatHistory() {
      localStorage.setItem(
        `chat-history-${this.config.agentId}`,
        JSON.stringify(this.messages)
      );
    }

    clearChatHistory() {
      this.messages = [];
      localStorage.removeItem(`chat-history-${this.config.agentId}`);
      this.messagesContainer.innerHTML = "";
    }

    // Add styles for markdown content
    getMarkdownStyles() {
      return `
        .ai-message-content {
          line-height: 1.5;
        }
        
        .ai-message-content p {
          margin: 0 0 1em 0;
        }
        
        .ai-message-content p:last-child {
          margin-bottom: 0;
        }

        .ai-message-content pre {
          background-color: #2D3748;
          padding: 1em;
          border-radius: 4px;
          overflow-x: auto;
        }

        .ai-message-content code {
          background-color: rgba(45, 55, 72, 0.5);
          padding: 0.2em 0.4em;
          border-radius: 3px;
          font-family: monospace;
        }

        .ai-message-content ul, .ai-message-content ol {
          margin: 0 0 1em 0;
          padding-left: 2em;
        }

        .ai-message-content blockquote {
          border-left: 3px solid #4A5568;
          margin: 0 0 1em 0;
          padding-left: 1em;
          color: #A0AEC0;
        }
      `;
    }

    urlify(text) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      return text.replace(urlRegex, (url) => {
        return `[${url}](${url})`;
      });
    }
  }

  // Expose to window
  window.AIChatWidget = AIChatWidget;
})();
