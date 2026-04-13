import React, { useEffect } from 'react';

const ChatbotWidget = () => {
  useEffect(() => {
    // Inject the Chatling configuration
    window.chtlConfig = { chatbotId: "2713873929" };

    // Create the script element
    const script = document.createElement('script');
    script.async = true;
    script.setAttribute('data-id', '2713873929');
    script.id = 'chtl-script';
    script.type = 'text/javascript';
    script.src = 'https://chatling.ai/js/embed.js';

    // Append the script to the document head or body
    document.body.appendChild(script);

    // Add global click listener to close widget when clicking outside
    const handleClickOutside = (e) => {
      // Check if the click target is outside the Chatling widget elements
      // Chatling typically uses IDs/classes starting with 'chtl' or 'chatling'
      const isClickInsideWidget = e.target.closest('[id*="chtl"], [class*="chtl"], [id*="chatling"], [class*="chatling"]');

      if (!isClickInsideWidget) {
        // Attempt to close via standard exposed global methods if they exist
        if (window.chtl && typeof window.chtl.close === 'function') {
          window.chtl.close();
        } else if (window.chatling && typeof window.chatling.closeWidget === 'function') {
          window.chatling.closeWidget();
        } else {
          // Alternative fallback for specific widget component elements
          // Some setups use specific generic container structures
          // Since the embed renders itself, we try to simulate the closing by finding the close button
          // Or toggling the container visibility directly.
          try {
            // Let's attempt to use the generic window configuration wrapper or simulate a click on the chat button 
            // if it's currently open (this varies by implementation).
            const root = document.querySelector('chatling-chat') || document.querySelector('chtl-chat');
            if (root && root.shadowRoot) {
              // If they use shadow dom
              const wrapper = root.shadowRoot.querySelector('.chat-container');
              if (wrapper && wrapper.classList.contains('is-open')) {
                // trigger the toggle
                const toggleBtn = root.shadowRoot.querySelector('.toggle-button');
                if (toggleBtn) toggleBtn.click();
              }
            } else {
              // Global close fallback
              window.dispatchEvent(new Event('chatling-close'));
            }
          } catch (e) { }
        }
      }
    };

    // Use capturing phase to ensure it fires before iframes capture the event
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, []);

  return null; // Return null since the external script generates its own UI
};

export default ChatbotWidget;
