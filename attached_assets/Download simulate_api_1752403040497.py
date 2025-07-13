
from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from simulate_full_response import simulate_full_response

app = FastAPI()

class ScenarioInput(BaseModel):
    aircraft_type: str
    origin: str
    destination: str
    position_nm_from_origin: float
    altitude_ft: int
    failure_type: str

@app.post("/simulate")
def simulate_scenario(input: ScenarioInput):
    result = simulate_full_response(
        aircraft_type=input.aircraft_type,
        origin=input.origin,
        destination=input.destination,
        position_nm_from_origin=input.position_nm_from_origin,
        altitude_ft=input.altitude_ft,
        failure_type=input.failure_type
    )
    return result
