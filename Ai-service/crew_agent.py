from crewai import Agent
from app.agent.tasks import Tool1, Tool2, Tool3
from app.agent.intent_detector import IntentDetector

class CrewAIAgent:
    def __init__(self):
        self.tool1 = Tool1()
        self.tool2 = Tool2()
        self.tool3 = Tool3()
        self.intent_detector = IntentDetector()
        
        self.agent = Agent(
            role='Smart API Router',
            goal='Accurately route requests based on detected intent',
            backstory='Uses LLM intelligence to understand user needs',
            tools=[self.tool1.execute, self.tool2.execute, self.tool3.execute],
            verbose=True
        )
    
    def execute_task(self, input_data):
        # First detect intent
        intent = self.intent_detector.detect_intent(input_data)
        
        # Route to appropriate tool based on intent
        if intent == "tool1":
            return self.tool1.execute(input_data)
        elif intent == "tool2":
            return self.tool2.execute(input_data)
        elif intent == "tool3":
            return self.tool3.execute(input_data)
        else:
            return "Could not determine the appropriate action for your request."