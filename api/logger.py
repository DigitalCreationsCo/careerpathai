"""Centralized logging configuration for the API."""

import logging
import sys
from typing import Optional

# Create logger instance
logger = logging.getLogger("api")

def setup_logger(level: str = "INFO", log_file: Optional[str] = None) -> logging.Logger:
    """Setup the API logger with console and optional file output."""
    
    # Clear any existing handlers
    logger.handlers.clear()
    
    # Set level
    logger.setLevel(getattr(logging, level.upper()))
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (if specified)
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger

# Initialize logger
setup_logger()