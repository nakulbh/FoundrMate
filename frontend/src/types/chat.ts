export interface Message {
  id: number;
  text: string;
  type: "user" | "bot";
  timestamp?: Date;
}

export interface MainProps {
  name?: string;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSendMessage?: (message: string) => void;
}