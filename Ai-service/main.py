from fastapi import FastAPI
from app.agent.agent import CrewAIAgent
from app.models import AgentRequest, AgentResponse

app = FastAPI()

# Initialize the CrewAI agent
agent = CrewAIAgent()

@app.post("/agent/execute", response_model=AgentResponse)
async def execute_agent_task(request: AgentRequest):
    """
    Endpoint to execute the CrewAI agent with the given input
    """
    result = agent.execute_task(request.input_data)
    return {"result": result}