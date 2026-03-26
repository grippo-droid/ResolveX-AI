"""
websocket.py — WebSocket connection manager for broadcasting events.
"""
from fastapi import WebSocket
from typing import List, Dict
import logging

logger = logging.getLogger("resolvex.ws")

class ConnectionManager:
    def __init__(self):
        # We store connections. A robust app might store them by user_id or room.
        # For this implementation, we broadcast universally or by ticket_id.
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast(self, message: dict):
        # Broadcast the JSON message to all connected clients.
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"WebSocket broadcast error: {e}")
                dead_connections.append(connection)
        
        for dead in dead_connections:
            self.disconnect(dead)

# Global manager instance
manager = ConnectionManager()
