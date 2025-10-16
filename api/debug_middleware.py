"""Debug middleware for FastAPI development."""

import json
import time
import traceback
from typing import Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

# Configure detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class DebugMiddleware(BaseHTTPMiddleware):
    """Middleware for enhanced debugging in development."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Log request details
        start_time = time.time()
        
        logger.info(f"🔵 {request.method} {request.url.path}")
        logger.debug(f"Headers: {dict(request.headers)}")
        logger.debug(f"Query params: {dict(request.query_params)}")
        
        # Log request body for POST/PUT requests
        if request.method in ["POST", "PUT", "PATCH"]:
            try:
                body = await request.body()
                if body:
                    try:
                        body_json = json.loads(body)
                        logger.debug(f"Request body: {json.dumps(body_json, indent=2)}")
                    except json.JSONDecodeError:
                        logger.debug(f"Request body (raw): {body.decode('utf-8', errors='ignore')}")
            except Exception as e:
                logger.warning(f"Could not read request body: {e}")
        
        # Process request
        try:
            response = await call_next(request)
            
            # Log response details
            process_time = time.time() - start_time
            logger.info(f"🟢 {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)")
            
            return response
            
        except Exception as e:
            # Log detailed error information
            process_time = time.time() - start_time
            logger.error(f"🔴 {request.method} {request.url.path} - ERROR ({process_time:.3f}s)")
            logger.error(f"Exception: {type(e).__name__}: {str(e)}")
            logger.error(f"Traceback:\n{traceback.format_exc()}")
            
            # Return detailed error response in development
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Internal Server Error",
                    "type": type(e).__name__,
                    "message": str(e),
                    "traceback": traceback.format_exc().split('\n') if logger.level <= logging.DEBUG else None
                }
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Simpler middleware for production request logging."""
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start_time = time.time()
        
        # Log request
        logger.info(f"{request.method} {request.url.path}")
        
        response = await call_next(request)
        
        # Log response
        process_time = time.time() - start_time
        logger.info(f"{request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)")
        
        return response


def setup_debug_logging():
    """Setup enhanced logging configuration."""
    import sys
    
    # Create custom formatter
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Setup console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    # Setup file handler for errors
    file_handler = logging.FileHandler('api_debug.log')
    file_handler.setLevel(logging.ERROR)
    file_handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)
    
    # Reduce noise from some libraries
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
