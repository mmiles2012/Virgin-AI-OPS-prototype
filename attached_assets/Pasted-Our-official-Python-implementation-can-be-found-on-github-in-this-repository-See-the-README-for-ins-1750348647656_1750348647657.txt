Our official Python implementation can be found on github in this repository. See the README for installation instructions.

Retrieving Data¶

The API is encapsulated in a single class with methods for data retrieving.

class opensky_api.OpenSkyApi(username=None, password=None)¶
Main class of the OpenSky Network API. Instances retrieve data from OpenSky via HTTP.

__init__(username=None, password=None)¶
Create an instance of the API client. If you do not provide username and password requests will be anonymous which imposes some limitations.

Parameters
:
username (str) – an OpenSky username (optional).
password (str) – an OpenSky password for the given username (optional).
get_arrivals_by_airport(airport, begin, end)¶
Retrieves flights for a certain airport which arrived within a given time interval [begin, end].

Parameters
:
airport (str) – ICAO identier for the airport.
begin (int) – Start of time interval to retrieve flights for as Unix time (seconds since epoch).
end (int) – End of time interval to retrieve flights for as Unix time (seconds since epoch).
Returns
:
list of FlightData objects if request was successful, None otherwise..
Return type
:
FlightData | None
get_departures_by_airport(airport, begin, end)¶
Retrieves flights for a certain airport which arrived within a given time interval [begin, end].

Parameters
:
airport (str) – ICAO identier for the airport.
begin (int) – Start of time interval to retrieve flights for as Unix time (seconds since epoch).
end (int) – End of time interval to retrieve flights for as Unix time (seconds since epoch).
Returns
:
list of FlightData objects if request was successful, None otherwise.
Return type
:
FlightData | None
get_flights_by_aircraft(icao24, begin, end)¶
Retrieves data of flights for certain aircraft and time interval.

Parameters
:
icao24 (str) – Unique ICAO 24-bit address of the transponder in hex string representation. All letters need to be lower case.
begin (int) – Start of time interval to retrieve flights for as Unix time (seconds since epoch).
end (int) – End of time interval to retrieve flights for as Unix time (seconds since epoch).
Returns
:
list of FlightData objects if request was successful, None otherwise.
Return type
:
FlightData | None