'use client';
import React, { useState } from "react";
import Chat from "@/component/chat/Main";
import TopBar from "@/component/mainScreen/main"
import Sidebar from "@/component/sidebar/Main";

export default function Home() {
const [isChatOpen, setIsChatOpen] = useState(false);



  return (
    <div className="flex flex-row w-screen items-center justify-between h-screen">
      <Sidebar/>
      <div className="w-full flex-col items-center justify-between h-screen">
          <TopBar isChatOpen={isChatOpen} setIsChatOpen={setIsChatOpen} />
        <div>
          fsdfds
        </div>
      </div>
      <Chat isOpen={isChatOpen} setIsOpen={setIsChatOpen} />
    </div>
  );
}
