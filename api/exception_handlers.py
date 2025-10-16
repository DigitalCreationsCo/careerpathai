"""Custom exception handlers for FastAPI."""

import traceback
import logging
from typing import Union
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
from sqlalchemy.exc import SQLAlchemyError
import json

logger = logging.getLogger(__name__)


def setup_exception_handlers(app: FastAPI):
    """Setup comprehensive exception handlers for the FastAPI app."""
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors with detailed information."""
        logger.error(f"Validation error on {request.method} {request.url.path}")
        logger.error(f"Validation errors: {exc.errors()}")
        
        # Extract detailed error information
        errors = []
        for error in exc.errors():
            error_detail = {
                "field": " -> ".join(str(loc) for loc in error["loc"]),
                "message": error["msg"],
                "type": error["type"],
                "input": error.get("input")
            }
            errors.append(error_detail)
        
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation Error",
                "message": "Request validation failed",
                "details": errors,
                "path": str(request.url.path),
                "method": request.method
            }
        )
    
    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        """Handle HTTP exceptions with consistent format."""
        logger.warning(f"HTTP {exc.status_code} on {request.method} {request.url.path}: {exc.detail}")
        
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": "HTTP Error",
                "message": exc.detail,
                "status_code": exc.status_code,
                "path": str(request.url.path),
                "method": request.method
            }
        )
    
    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
        """Handle database errors."""
        logger.error(f"Database error on {request.method} {request.url.path}: {str(exc)}")
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Database Error",
                "message": "A database operation failed",
                "path": str(request.url.path),
                "method": request.method
            }
        )
    
    @app.exception_handler(ValidationError)
    async def pydantic_validation_exception_handler(request: Request, exc: ValidationError):
        """Handle Pydantic model validation errors."""
        logger.error(f"Pydantic validation error on {request.method} {request.url.path}: {exc}")
        
        return JSONResponse(
            status_code=422,
            content={
                "error": "Model Validation Error",
                "message": "Data validation failed",
                "details": exc.errors(),
                "path": str(request.url.path),
                "method": request.method
            }
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all other exceptions."""
        logger.error(f"Unhandled exception on {request.method} {request.url.path}: {str(exc)}")
        logger.error(f"Traceback:\n{traceback.format_exc()}")
        
        # In development, include traceback
        import os
        include_traceback = os.getenv("ENVIRONMENT", "development") == "development"
        
        return JSONResponse(
            status_code=500,
            content={
                "error": "Internal Server Error",
                "message": "An unexpected error occurred",
                "path": str(request.url.path),
                "method": request.method,
                "traceback": traceback.format_exc().split('\n') if include_traceback else None
            }
        )
