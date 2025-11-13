import logging
import sys
from typing import Optional
from config.settings import settings

def setup_logging(log_level: Optional[str] = None) -> None:
    level = log_level or settings.LOG_LEVEL
    
    formatter = logging.Formatter(
        fmt='%(levelname)s:%(name)s:%(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    root_logger.addHandler(console_handler)
    
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)