
import plotly.express as px
import pandas as pd

def render_map(df):
    fig = px.scatter_mapbox(
        df,
        lat="lat",
        lon="lon",
        color="holding",
        hover_name="flight",
        hover_data=["stack", "alt_baro", "track", "speed"],
        zoom=9,
        height=600
    )
    fig.update_layout(mapbox_style="open-street-map")
    fig.update_layout(margin={"r":0,"t":0,"l":0,"b":0})
    return fig
