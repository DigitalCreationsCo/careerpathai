"""Unit tests for ResearchConfigManager."""

import os
import pytest

from api.research_config import ResearchConfigManager


def test_defaults_loaded_from_env(monkeypatch):
    monkeypatch.setenv("MAX_STRUCTURED_OUTPUT_RETRIES", "7")
    monkeypatch.setenv("ALLOW_CLARIFICATION", "false")
    monkeypatch.setenv("MAX_CONCURRENT_RESEARCH_UNITS", "3")
    monkeypatch.setenv("SEARCH_API", "tavily")
    monkeypatch.setenv("MAX_RESEARCHER_ITERATIONS", "4")
    monkeypatch.setenv("MAX_REACT_TOOL_CALLS", "9")
    monkeypatch.setenv("SUMMARIZATION_MODEL", "openai:gpt-4.1-mini")
    monkeypatch.setenv("SUMMARIZATION_MODEL_MAX_TOKENS", "1024")
    monkeypatch.setenv("MAX_CONTENT_LENGTH", "12345")
    monkeypatch.setenv("RESEARCH_MODEL", "openai:gpt-4.1")
    monkeypatch.setenv("RESEARCH_MODEL_MAX_TOKENS", "2048")
    monkeypatch.setenv("COMPRESSION_MODEL", "openai:gpt-4.1")
    monkeypatch.setenv("COMPRESSION_MODEL_MAX_TOKENS", "4096")
    monkeypatch.setenv("FINAL_REPORT_MODEL", "openai:gpt-4.1")
    monkeypatch.setenv("FINAL_REPORT_MODEL_MAX_TOKENS", "8192")

    manager = ResearchConfigManager()
    defaults = manager.default_config

    assert defaults["max_structured_output_retries"] == 7
    assert defaults["allow_clarification"] is False
    assert defaults["max_concurrent_research_units"] == 3
    assert defaults["search_api"] == "tavily"
    assert defaults["max_researcher_iterations"] == 4
    assert defaults["max_react_tool_calls"] == 9
    assert defaults["summarization_model_max_tokens"] == 1024
    assert defaults["max_content_length"] == 12345
    assert defaults["research_model_max_tokens"] == 2048
    assert defaults["compression_model_max_tokens"] == 4096
    assert defaults["final_report_model_max_tokens"] == 8192


def test_user_config_merge():
    manager = ResearchConfigManager()
    merged = manager.get_user_config("user-1", {"max_researcher_iterations": 2, "search_api": "tavily"})

    assert merged["max_researcher_iterations"] == 2
    assert merged["search_api"] == "tavily"
    # Ensure default remains present
    assert "research_model" in merged


def test_create_runnable_config_includes_thread_and_user():
    manager = ResearchConfigManager()
    rc = manager.create_runnable_config(thread_id="t-123", user_id="u-456", session_config={"allow_clarification": True})

    assert "configurable" in rc
    cfg = rc["configurable"]
    assert cfg["thread_id"] == "t-123"
    assert cfg["allow_clarification"] is True

