"""
ws_routes.py — WebSocket endpoints for real-time frontend integration.
"""
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core.websocket import manager

router = APIRouter()

@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We just keep the connection alive. 
            # If the client sends a ping, we can receive it here.
            data = await websocket.receive_text()
            if data == "ping":
                await manager.send_personal_message({"event": "pong"}, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
