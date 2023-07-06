import { fetchEventSource } from "@fortaine/fetch-event-source";
import { useState, useMemo } from "react";
import { appConfig } from "../../config.browser";
import { abort } from "process";

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

  const abortController = useMemo(() => new AbortController(), []);


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


  function clear() {
    setChatHistory([]);
  }


  const sendMessage = (message: string, chatHistory: Array<ChatMessage>) => {
    setState("waiting");
    const newHistory = [
      ...chatHistory,
      { role: "user", content: message } as const,
    ];

    setChatHistory(newHistory);
    const body = new FormData()
    body.append("question",message)
    setState("loading");
    setChatHistory((curr) => [
        ...curr,
        { role: "assistant", content: "..." } as const,
      ]);
    fetch(API_PATH,{method: "POST",body,signal:abortController.signal})
    .then((response)=>{
      if(response.ok) return response.json()
      return Promise.reject()
    }).then(e=>{

      let chatContent = e.data || JSON.stringify(e)
      setChatHistory((curr) => {
        let temp = curr
        temp.reverse()[0]['content'] = chatContent
        temp.reverse()
        return temp
      });
      
    }).catch(()=>{
      if(abortController.signal.aborted) {
        console.log("El usuario ha cancelado la peticion") 
      }
      else {
        setChatHistory((curr) => [
        ...curr,
        { role: "assistant", content: "Lo siento, algo ha ocurrido. Vuelve a preguntar por favor." } as const,
      ]);
      }
    }).finally(()=>{
      setCurrentChat(null);
      setState("idle");
    })
  
  };

  return { sendMessage, currentChat, chatHistory, cancel, clear, state };
}
