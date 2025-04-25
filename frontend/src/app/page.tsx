import Chat from "@/component/chat/Main";
import TopBar from "@/component/mainScreen/main"

export default function Home() {
  return (
    <div className="flex flex-row w-screen items-center justify-between h-screen">
      <div className="w-full flex-col items-center justify-between h-screen">
        <div>
          <TopBar />
        </div>
        <div>
          fsdfds
        </div>
      </div>
      <Chat />
    </div>
  );
}
