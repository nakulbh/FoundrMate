"use client";
import { ArrowUp } from "lucide-react";
import React from "react";

export default function Main() {
  const [messages, setMessages] = React.useState([
    {
      id: 1,
      text: "Hello",
      type: "user",
    },
    {
      id: 2,
      text: "Hi",
      type: "bot",
    },
    {
      id: 3,
      text: "How are you?",
      type: "user",
    },
    {
      id: 4,
      text: "I am fine",
      type: "bot",
    },
  ]);
  return (
    <div className="flex flex-col  w-[40vh] h-full p-4 bg-gray-100 rounded-l-xl">
      <div className="w-full h-[90%]">
        {messages.map((msg) => {
          return (
            <div
              key={msg.id}
              className={`flex ${
                msg.type === "user" ? " justify-end w-full" : "justify-start"
              } mb-2`}
            >
              <div
                className={`${
                  msg.type === "user"
                    ? "bg-gray-300 w-fit  rounded-t-2xl rounded-l-2xl p-2"
                    : "bg-gray-300 w-fit  rounded-t-2xl rounded-r-2xl p-2"
                } `}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-row items-center border-2 border-blue-100  bg-blue-50 w-full  rounded-full max-h-40  text-wrap">
        <input type="text" className="w-full p-2" />

        <span className="bg-blue-300 p-1 mr-1 rounded-full">
          <ArrowUp color="black"  />
        </span>
      </div>
    </div>
  );
}
