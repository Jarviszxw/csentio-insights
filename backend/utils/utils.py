from datetime import date, timedelta
from typing import Tuple
from fastapi import HTTPException

def get_previous_date_range(start_date: date, end_date: date) -> Tuple[date, date]:
    delta = end_date - start_date
    prev_end_date = start_date - timedelta(days=1)
    prev_start_date = prev_end_date - delta
    return prev_start_date, prev_end_date


def cal_pop_percentage(current_value: float, previous_value: float) -> float:
    if not isinstance(current_value, (int, float)) or not isinstance(previous_value, (int, float)):
        raise HTTPException(status_code=400, detail="Invalid input: current_value and previous_value must be numbers")

    if previous_value == 0:
        if current_value == 0:
            return 0.0 
        return 100.0 

    percentage = ((current_value - previous_value) / previous_value) * 100
    return round(percentage, 1)
    