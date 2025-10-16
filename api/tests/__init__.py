"""Test package for API tests (unit and integration)."""

import os

# Ensure test-friendly environment defaults
os.environ.setdefault("AUTH_SECRET", "test_secret")
