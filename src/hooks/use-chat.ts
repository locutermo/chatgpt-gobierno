import { fetchEventSource } from "@fortaine/fetch-event-source";
import { useState, useMemo } from "react";
import { appConfig } from "../../config.browser";

const API_PATH = "https://api-chatgpt-dg1w.onrender.com/get_response";
interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * A custom hook to handle the chat state and logic
 */
export function useChat() {
  const [currentChat, setCurrentChat] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [state, setState] = useState<"idle" | "waiting" | "loading">("idle");

  // Lets us cancel the stream
  const abortController = useMemo(() => new AbortController(), []);

  /**
   * Cancels the current chat and adds the current chat to the history
   */
  function cancel() {
    setState("idle");
    abortController.abort();
    if (currentChat) {
      const newHistory = [
        ...chatHistory,
        { role: "user", content: currentChat } as const,
      ];

      setChatHistory(newHistory);
      setCurrentChat("");
    }
  }

  /**
   * Clears the chat history
   */

  function clear() {
    console.log("clear");
    setChatHistory([]);
  }

  /**
   * Sends a new message to the AI function and streams the response
   */
  const sendMessage = (message: string, chatHistory: Array<ChatMessage>) => {
    setState("waiting");
    let chatContent = "";
    const newHistory = [
      ...chatHistory,
      { role: "user", content: message } as const,
    ];

    setChatHistory(newHistory);
    const body = new FormData()
    body.append("question",message)
    console.log(newHistory)
    // This is like an EventSource, but allows things like
    // POST requests and headers
    fetch(API_PATH,{
      method: "POST",
      body,
      signal:abortController.signal,
    }).then(e=>{
       return e.json() 
    }).then(e=>{
      let chatContent = e.data
      setChatHistory((curr) => [
              ...curr,
              { role: "assistant", content: chatContent } as const,
            ]);
            setCurrentChat(null);
            setState("idle");
    })
    /*
    fetchEventSource(API_PATH, {
      body,
      method: "POST",
      signal: abortController.signal,
      onclose: () => {
        setState("idle");
      },
      onmessage: (event) => {
        console.log("Evento:",event)
        switch (event.event) {
          case "delta": {
            // This is a new word or chunk from the AI
            console.log("Evento-:",event)

            setState("loading");
            const message = JSON.parse(event.data);
            if (message?.role === "assistant") {
              chatContent = "";
              return;
            }
            if (message.content) {
              chatContent += message.content;
              setCurrentChat(chatContent);
            }
            break;
          }
          case "open": {
            // The stream has opened and we should recieve
            // a delta event soon. This is normally almost instant.
            setCurrentChat("...");
            break;
          }
          case "done": {
            // When it's done, we add the message to the history
            // and reset the current chat
            setChatHistory((curr) => [
              ...curr,
              { role: "assistant", content: chatContent } as const,
            ]);
            setCurrentChat(null);
            setState("idle");
          }
          default:
            break;
        }
      },
    });
 */
  };

  return { sendMessage, currentChat, chatHistory, cancel, clear, state };
}
