import math
from typing import List, Optional, Tuple, Dict, Any


def clamp(value: float, minimum: float, maximum: float) -> float:
    """Clamp value between minimum and maximum."""
    return max(minimum, min(maximum, value))


def normalize_relative_noise(rms: float) -> float:
    """
    Convert instantaneous acoustic RMS to a bounded 0-100 relative decibel scale.
    -60 dBFS corresponds to quiet (0), and 0 dBFS corresponds to maximum (100).
    """
    if not math.isfinite(rms) or rms <= 0.0:
        return 0.0
    dbfs = 20.0 * math.log10(rms)
    normalized = ((dbfs + 60.0) / 60.0) * 100.0
    return round(clamp(normalized, 0.0, 100.0), 1)


def calculate_stability(levels: List[float]) -> float:
    """
    Compute environmental acoustic stability score (0-100).
    Higher score indicates a steady, non-erratic environment.
    """
    if not levels or len(levels) < 2:
        return 100.0
    avg = sum(levels) / len(levels)
    variance = sum((x - avg) ** 2 for x in levels) / len(levels)
    std_dev = math.sqrt(variance)
    return round(clamp(100.0 - std_dev * 4.0, 0.0, 100.0), 1)


def calculate_focus_score(
    average_noise: float,
    stability: float,
    interruptions: int,
    duration_minutes: float
) -> int:
    """
    Calculate composite Focus Score (0-100).
    Evaluates observed environment quality, not the user:
    - Quietness (40%)
    - Stability (30%)
    - Low interruptions (24%)
    - Sustained duration up to 45 mins (6%)
    """
    quietness = clamp(100.0 - average_noise, 0.0, 100.0)
    interruption_score = clamp(100.0 - (interruptions * 12.0), 0.0, 100.0)
    duration_score = clamp((duration_minutes / 45.0) * 100.0, 0.0, 100.0)

    composite = (
        quietness * 0.40 +
        stability * 0.30 +
        interruption_score * 0.24 +
        duration_score * 0.06
    )
    return int(round(clamp(composite, 0.0, 100.0)))


def format_hour_window(hour: int, window_size: int = 2) -> str:
    """
    Format a clean hour window label handling 24-hour boundaries correctly.
    E.g., hour=23, window=2 -> '11 PM-1 AM'.
    """
    start_h = (hour % 24 + 24) % 24
    end_h = ((hour + window_size) % 24 + 24) % 24

    def format_single(h: int) -> str:
        period = "AM" if h < 12 else "PM"
        display = h % 12 or 12
        return f"{display} {period}"

    return f"{format_single(start_h)}-{format_single(end_h)}"


def relative_noise_label(level: Optional[float]) -> str:
    """Human-readable category for relative noise level."""
    if level is None:
        return "Waiting"
    if level <= 15:
        return "Very quiet"
    if level <= 35:
        return "Quiet"
    if level <= 55:
        return "Moderate"
    if level <= 75:
        return "Noisy"
    return "Very noisy"
