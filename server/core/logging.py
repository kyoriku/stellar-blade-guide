import logging
import sys
from typing import Optional
from config.settings import settings

def setup_logging(log_level: Optional[str] = None) -> None:
    level = log_level or settings.LOG_LEVEL
    
    formatter = logging.Formatter(
        fmt='%(message)s',
        # datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(console_handler)
    
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)

    api_logger = logging.getLogger("api")
    api_handler = logging.StreamHandler(sys.stdout)
    api_handler.setFormatter(logging.Formatter('%(message)s'))
    api_logger.handlers = [api_handler]
    api_logger.propagate = False

    honeypot_logger = logging.getLogger("middleware.honeypot")
    honeypot_handler = logging.StreamHandler(sys.stdout)
    honeypot_handler.setFormatter(logging.Formatter('%(message)s'))
    honeypot_logger.handlers = [honeypot_handler]
    honeypot_logger.propagate = False

    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("openai").setLevel(logging.WARNING)