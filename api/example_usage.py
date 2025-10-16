"""Example usage of the Deep Research FastAPI integration."""

import asyncio
import json
from typing import AsyncGenerator

import httpx
from sse_starlette import EventSourceResponse


class DeepResearchClient:
    """Client for interacting with the Deep Research API."""
    
    def __init__(self, base_url: str = "http://localhost:8000", session_token: str = None):
        self.base_url = base_url
        self.session_token = session_token
        self.client = httpx.AsyncClient()
    
    async def start_research_session(
        self,
        message: str,
        chat_id: str = None,
        configuration: dict = None
    ) -> dict:
        """Start a new research session."""
        headers = {}
        if self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        
        response = await self.client.post(
            f"{self.base_url}/api/research/start",
            json={
                "message": message,
                "chat_id": chat_id,
                "configuration": configuration
            },
            headers=headers
        )
        response.raise_for_status()
        return response.json()
    
    async def get_sessions(self, status_filter: str = None) -> dict:
        """Get user's research sessions."""
        headers = {}
        if self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        
        params = {}
        if status_filter:
            params["status_filter"] = status_filter
        
        response = await self.client.get(
            f"{self.base_url}/api/research/sessions",
            params=params,
            headers=headers
        )
        response.raise_for_status()
        return response.json()
    
    async def get_session(self, session_id: str) -> dict:
        """Get a specific research session."""
        headers = {}
        if self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        
        response = await self.client.get(
            f"{self.base_url}/api/research/session/{session_id}",
            headers=headers
        )
        response.raise_for_status()
        return response.json()
    
    async def send_message(self, session_id: str, message: str) -> dict:
        """Send a message to an existing session."""
        headers = {}
        if self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        
        response = await self.client.post(
            f"{self.base_url}/api/research/session/{session_id}/message",
            json={"message": message},
            headers=headers
        )
        response.raise_for_status()
        return response.json()
    
    async def stream_research_progress(self, session_id: str) -> AsyncGenerator[dict, None]:
        """Stream research progress via SSE."""
        headers = {}
        if self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        
        async with self.client.stream(
            "GET",
            f"{self.base_url}/api/research/stream/{session_id}",
            headers=headers
        ) as response:
            response.raise_for_status()
            
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    try:
                        data = json.loads(line[6:])  # Remove "data: " prefix
                        yield data
                    except json.JSONDecodeError:
                        continue
    
    async def delete_session(self, session_id: str) -> dict:
        """Delete a research session."""
        headers = {}
        if self.session_token:
            headers["Authorization"] = f"Bearer {self.session_token}"
        
        response = await self.client.delete(
            f"{self.base_url}/api/research/session/{session_id}",
            headers=headers
        )
        response.raise_for_status()
        return response.json()
    
    async def close(self):
        """Close the HTTP client."""
        await self.client.aclose()


async def example_research_workflow():
    """Example of a complete research workflow."""
    client = DeepResearchClient(session_token="your_nextauth_jwt_token")
    
    try:
        # 1. Start a new research session
        print("Starting research session...")
        session = await client.start_research_session(
            message="Research the latest trends in artificial intelligence and machine learning for 2024",
            configuration={
                "max_researcher_iterations": 3,
                "max_concurrent_research_units": 2,
                "allow_clarification": True
            }
        )
        session_id = session["id"]
        print(f"Session created: {session_id}")
        
        # 2. Stream research progress
        print("Streaming research progress...")
        async for event in client.stream_research_progress(session_id):
            event_type = event.get("type")
            
            if event_type == "clarification":
                print(f"Clarification needed: {event.get('data', {}).get('question')}")
                # Send clarification response
                await client.send_message(
                    session_id,
                    "Please focus on practical applications and business impact"
                )
            
            elif event_type == "update":
                print(f"Research update: {event.get('data', {})}")
            
            elif event_type == "completion":
                print(f"Research completed!")
                print(f"Final report: {event.get('data', {}).get('final_report')}")
                break
            
            elif event_type == "error":
                print(f"Error: {event.get('data', {}).get('error')}")
                break
        
        # 3. Get session details
        session_details = await client.get_session(session_id)
        print(f"Session status: {session_details['status']}")
        
        # 4. List all sessions
        sessions = await client.get_sessions()
        print(f"Total sessions: {sessions['total']}")
        
    finally:
        await client.close()


async def example_multiple_sessions():
    """Example of managing multiple research sessions."""
    client = DeepResearchClient(session_token="your_nextauth_jwt_token")
    
    try:
        # Start multiple research sessions
        topics = [
            "AI trends in healthcare",
            "Machine learning in finance",
            "Computer vision applications"
        ]
        
        session_ids = []
        for topic in topics:
            session = await client.start_research_session(
                message=f"Research {topic}",
                configuration={"max_researcher_iterations": 2}
            )
            session_ids.append(session["id"])
            print(f"Started session for '{topic}': {session['id']}")
        
        # Monitor all sessions
        for session_id in session_ids:
            print(f"Monitoring session: {session_id}")
            async for event in client.stream_research_progress(session_id):
                if event.get("type") == "completion":
                    print(f"Session {session_id} completed")
                    break
        
        # Clean up - delete completed sessions
        for session_id in session_ids:
            await client.delete_session(session_id)
            print(f"Deleted session: {session_id}")
        
    finally:
        await client.close()


if __name__ == "__main__":
    # Run the example
    asyncio.run(example_research_workflow())
