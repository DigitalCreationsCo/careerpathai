from dotenv import load_dotenv
from fastapi import FastAPI
from .chat import router as chat_router

load_dotenv(".env.local")

app = FastAPI()

# Include the chat router
app.include_router(chat_router)
