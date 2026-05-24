"use client";
import { use, useState } from "react";

export function useTruncateMessage(wordLimit) {
  const [truncatedMessage, setTruncatedMessage] = useState("");

  const truncateMessage = (message) => {
    const splitWords = message.split(" ");

    const words = splitWords
      .filter((word) => word.trim() !== "") // Filter out empty words
      .map((word) => word.trim()); // Trim remaining words

    if (words.length > wordLimit) {
      const truncated = words.slice(0, wordLimit).join(" ");
      // const remaining = words.slice(wordLimit).join(" ");
      setTruncatedMessage(`${truncated}...`);
    } else {
      setTruncatedMessage(message);
    }
  };

  return [truncatedMessage, truncateMessage];
}
// export function messageTimeStamp(message) {
//   const [message, setMessage] = useState("");
//  useEffect(() => {
//   const time= new Date();
//   const minutes = time.getMinutes();
//   if(minutes < 1){
//     setMessage();
//   }

//  },[message])
// }
