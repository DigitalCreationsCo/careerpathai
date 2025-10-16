"""Research configuration management with user-specific settings."""

import os
from typing import Dict, Any, Optional
from langchain_core.runnables import RunnableConfig

from open_deep_research.configuration import Configuration


class ResearchConfigManager:
    """Manages research configuration for users and sessions."""
    
    def __init__(self):
        self.default_config = self._load_default_config()
    
    def _load_default_config(self) -> Dict[str, Any]:
        """Load default configuration from environment variables."""
        return {
            "max_structured_output_retries": int(os.getenv("MAX_STRUCTURED_OUTPUT_RETRIES", "3")),
            "allow_clarification": os.getenv("ALLOW_CLARIFICATION", "true").lower() == "true",
            "max_concurrent_research_units": int(os.getenv("MAX_CONCURRENT_RESEARCH_UNITS", "5")),
            "search_api": os.getenv("SEARCH_API", "tavily"),
            "max_researcher_iterations": int(os.getenv("MAX_RESEARCHER_ITERATIONS", "6")),
            "max_react_tool_calls": int(os.getenv("MAX_REACT_TOOL_CALLS", "10")),
            "summarization_model": os.getenv("SUMMARIZATION_MODEL", "openai:gpt-4.1-mini"),
            "summarization_model_max_tokens": int(os.getenv("SUMMARIZATION_MODEL_MAX_TOKENS", "8192")),
            "max_content_length": int(os.getenv("MAX_CONTENT_LENGTH", "50000")),
            "research_model": os.getenv("RESEARCH_MODEL", "openai:gpt-4.1"),
            "research_model_max_tokens": int(os.getenv("RESEARCH_MODEL_MAX_TOKENS", "10000")),
            "compression_model": os.getenv("COMPRESSION_MODEL", "openai:gpt-4.1"),
            "compression_model_max_tokens": int(os.getenv("COMPRESSION_MODEL_MAX_TOKENS", "8192")),
            "final_report_model": os.getenv("FINAL_REPORT_MODEL", "openai:gpt-4.1"),
            "final_report_model_max_tokens": int(os.getenv("FINAL_REPORT_MODEL_MAX_TOKENS", "10000")),
        }
    
    def get_user_config(self, user_id: str, session_config: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Get configuration for a specific user, merging defaults with session-specific settings."""
        config = self.default_config.copy()
        
        # Apply session-specific configuration if provided
        if session_config:
            config.update(session_config)
        
        # TODO: In the future, load user-specific preferences from database
        # user_preferences = await self._load_user_preferences(user_id)
        # config.update(user_preferences)
        
        return config
    
    def create_runnable_config(self, thread_id: str, user_id: str, session_config: Optional[Dict[str, Any]] = None) -> RunnableConfig:
        """Create RunnableConfig for LangGraph execution."""
        configurable = self.get_user_config(user_id, session_config)
        configurable["thread_id"] = thread_id
        
        return {
            "configurable": configurable
        }
    
    def get_api_keys(self) -> Dict[str, str]:
        """Get API keys for different models from environment."""
        return {
            "openai": os.getenv("OPENAI_API_KEY"),
            "anthropic": os.getenv("ANTHROPIC_API_KEY"),
            "tavily": os.getenv("TAVILY_API_KEY"),
        }


# Global configuration manager instance
config_manager = ResearchConfigManager()
