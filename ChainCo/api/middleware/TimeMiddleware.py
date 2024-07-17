from fastapi import FastAPI, Depends, HTTPException, Request
from starlette.middleware.base import BaseHTTPMiddleware
import time
from datetime import datetime
from loguru import logger

class TimeMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Code before the request is processed
        curr_time = time.ctime(time.time())
        curr_datetime = datetime.now()
        logger.info(f"Current Time:", curr_time)

        response = await call_next(request)

        # Code after the request is processed
        difference = datetime.now()-curr_datetime
        logger.info(f"Time taken between request and response is {difference.seconds} seconds")
        return response